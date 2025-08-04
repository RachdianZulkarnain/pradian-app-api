import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { UpdateTransactionDTO } from "./dto/update-transaction.dto";
import { TransactionQueue } from "./transaction.queue";

export class TransactionService {
  private prisma: PrismaService;
  private transactionQueue: TransactionQueue;
  private mailService: MailService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.prisma = new PrismaService();
    this.transactionQueue = new TransactionQueue();
    this.mailService = new MailService();
    this.cloudinaryService = new CloudinaryService();
  }

    // Get all transactions for the authenticated user
  getTransactions = async (authUserId: number) => {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId: authUserId },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            title: true,
            thumbnail: true,
            location: true,
            startDate: true,
            endDate: true,
          },
        },
        transactionDetail: {
          include: {
            ticket: {
              select: {
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return transactions;
  };

  // Get detailed transaction by UUID (only if it belongs to the user)
  getTransaction = async (uuid: string, authUserId: number) => {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        uuid,
        userId: authUserId,
      },
      include: {
        event: {
          select: {
            title: true,
            thumbnail: true,
            location: true,
            startDate: true,
            endDate: true,
          },
        },
        transactionDetail: {
          include: {
            ticket: {
              select: {
                title: true,
                description: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new ApiError("Transaction not found or access denied", 404);
    }

    return transaction;
  };

  createTransaction = async (
    body: CreateTransactionDTO,
    authUserId: number
  ) => {
    const payload = body.payload; // [{ ticketId: 1, qty: 2 }, ...]

    const ticketIds = payload.map((item) => item.ticketId);

    const tickets = await this.prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
    });

    for (const item of payload) {
      const ticket = tickets.find((t) => t.id === item.ticketId);
      if (!ticket) {
        throw new ApiError(`Ticket with ID ${item.ticketId} not found`, 400);
      }

      if (ticket.stock < item.qty) {
        throw new ApiError(
          `Insufficient stock for ticket ID ${item.ticketId}`,
          400
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Ambil eventId dari salah satu tiket (asumsi semua tiket dalam satu transaksi berasal dari event yang sama)
      const eventId = tickets[0].eventId;

      const transaction = await tx.transaction.create({
        data: {
          userId: authUserId,
          eventId,
        },
        include: { user: true },
      });

      const transactionDetails = payload.map((item) => {
        const ticket = tickets.find((t) => t.id === item.ticketId)!;
        return {
          transactionId: transaction.id,
          ticketId: item.ticketId,
          qty: item.qty,
          price: Math.floor(ticket.totalPrice),
        };
      });

      await tx.transactionDetail.createMany({ data: transactionDetails });

      for (const item of payload) {
        await tx.ticket.update({
          where: { id: item.ticketId },
          data: { stock: { decrement: item.qty } },
        });
      }

      return transaction;
    });

    await this.transactionQueue.addNewTransactionQueue(result.uuid);

    await this.mailService.sendMail(
      result.user.email,
      "Upload bukti pembayaran",
      "upload-proof",
      {
        name: result.user.name,
        uuid: result.uuid,
        expireAt: new Date(result.createdAt.getTime() + 5 * 60 * 1000),
        year: new Date().getFullYear(),
      }
    );

    return { message: "create transaction success" };
  };

  uploadPaymentProof = async (
    uuid: string,
    paymentProof: Express.Multer.File,
    authUserId: number
  ) => {
    //harus tau dulu transaksinya
    //harus user yang punya transaksi yang bisa upload payment proof
    //cari transaksi berdasarkan uuid
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid: uuid },
    });

    //kalau tidak ada throw error
    if (!transaction) {
      throw new ApiError("Transaction not found!", 400);
    }
    // kalau userId di data transaksi nya ada sesuai dengan userId didalam
    //token, throw error
    if (transaction.userId !== authUserId) {
      throw new ApiError("unauthorized", 401);
    }

    //upload bukti transfer ke cloudinary
    const { secure_url } = await this.cloudinaryService.upload(paymentProof);

    //update data ditable transaksi, ubah kolom paymentproof dan status
    await this.prisma.transaction.update({
      where: { uuid },
      data: { paymentProof: secure_url, status: "WAITING_FOR_CONFIRMATION" },
    });

    return { message: "Upload payment proof succes" };
  };

  updateTransaction = async (body: UpdateTransactionDTO) => {
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid: body.uuid },
    });

    // 1. Validasi transaksi
    if (!transaction) {
      throw new ApiError("Transaction not found!", 404);
    }

    if (transaction.status !== "WAITING_FOR_CONFIRMATION") {
      throw new ApiError(
        "Transaction status must be WAITING_FOR_CONFIRMATION",
        400
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 2. Update status transaksi
      await tx.transaction.update({
        where: { uuid: body.uuid },
        data: {
          status: body.type === "ACCEPT" ? "PAID" : "REJECT",
          updatedAt: new Date(),
        },
      });

      // 3. Jika ditolak, kembalikan stok tiket
      if (body.type === "REJECT") {
        const transactionDetails = await tx.transactionDetail.findMany({
          where: { transactionId: transaction.id },
        });

        for (const detail of transactionDetails) {
          await tx.ticket.update({
            where: { id: detail.ticketId },
            data: { stock: { increment: detail.qty } },
          });
        }
      }
    });

    return {
      message: `${
        body.type === "ACCEPT" ? "Accept" : "Reject"
      } transaction success`,
    };
  };
}
