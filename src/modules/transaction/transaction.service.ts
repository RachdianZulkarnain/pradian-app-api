import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { UpdateTransactionDTO } from "./dto/update-transaction.dto";
import { TransactionQueue } from "./transaction.queue";

export class TransactionService {
  private prisma = new PrismaService();
  private transactionQueue = new TransactionQueue();
  private mailService = new MailService();
  private cloudinaryService = new CloudinaryService();

  getTransaction = async (uuid: string, authUserId: number) => {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        uuid,
        userId: authUserId,
      },
      include: {
        event: true,
        transactionDetail: { include: { ticket: true } },
      },
    });

    if (!transaction) {
      throw new ApiError("Transaction not found or access denied", 404);
    }

    return transaction
  };

  createTransaction = async (
    body: CreateTransactionDTO,
    authUserId: number
  ) => {
    const payload = body.payload;
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

    return result;
  };

  uploadPaymentProof = async (
    uuid: string,
    paymentProof: Express.Multer.File,
    authUserId: number
  ) => {
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid },
    });

    if (!transaction) throw new ApiError("Transaction not found!", 400);
    if (transaction.userId !== authUserId)
      throw new ApiError("Unauthorized", 401);

    const { secure_url } = await this.cloudinaryService.upload(paymentProof);

    await this.prisma.transaction.update({
      where: { uuid },
      data: {
        paymentProof: secure_url,
        status: "WAITING_FOR_CONFIRMATION",
      },
    });

    return { message: "Upload payment proof success" };
  };

  updateTransaction = async (body: UpdateTransactionDTO) => {
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid: body.uuid },
    });

    if (!transaction) throw new ApiError("Transaction not found!", 404);
    if (transaction.status !== "WAITING_FOR_CONFIRMATION") {
      throw new ApiError(
        "Transaction status must be WAITING_FOR_CONFIRMATION",
        400
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { uuid: body.uuid },
        data: {
          status: body.type === "ACCEPT" ? "PAID" : "REJECT",
          updatedAt: new Date(),
        },
      });

      if (body.type === "REJECT") {
        const details = await tx.transactionDetail.findMany({
          where: { transactionId: transaction.id },
        });

        for (const detail of details) {
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

  getUserTransactions = async ({
    page,
    take,
    search,
    userId,
  }: {
    page: number;
    take: number;
    search: string;
    userId: number;
  }) => {
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          event: {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        skip: (page - 1) * take,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          event: {
            select: {
              title: true,
              location: true,
              thumbnail: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({
        where: {
          userId,
          event: {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      }),
    ]);

    const formatted = transactions.map((tx) => ({
      uuid: tx.uuid,
      title: tx.event.title,
      location: tx.event.location,
      image: tx.event.thumbnail,
      status: tx.status,
      dateRange: `${tx.event.startDate.toLocaleDateString(
        "id-ID"
      )} - ${tx.event.endDate.toLocaleDateString("id-ID")}`,
    }));

    return {
      data: formatted,
      meta: {
        total,
        page,
        take,
      },
    };
  };

  applyVoucher = async (
    uuid: string,
    code: string,
    userId: number
  ): Promise<{ pricing: { totalTicketPrice: number; total: number } }> => {
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid, userId },
      include: {
        transactionDetail: {
          include: {
            ticket: true,
          },
        },
      },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);

    const voucher = await this.prisma.voucher.findFirst({
      where: { code, eventId: transaction.eventId },
    });

    if (!voucher) throw new ApiError("Voucher not found or invalid", 400);
    if (voucher.stock <= 0) throw new ApiError("Voucher limit exceeded", 400);

    const totalTicketPrice = transaction.transactionDetail.reduce(
      (acc, detail) => acc + detail.qty * (detail.ticket.price ?? 0),
      0
    );

    const discount = voucher.value;
    const total = Math.max(0, totalTicketPrice - discount);

    await this.prisma.transaction.update({
      where: { uuid },
      data: { voucherId: voucher.id },
    });

    await this.prisma.voucher.update({
      where: { id: voucher.id },
      data: { stock: { decrement: 1 } },
    });

    return {
      pricing: {
        totalTicketPrice,
        total,
      },
    };
  };

  confirmPayment = async (
    uuid: string,
    method: string,
    userId: number
  ): Promise<{ message: string }> => {
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid, userId },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);

    await this.prisma.transaction.update({
      where: { uuid },
      data: {
        paymentMethod: method,
      },
    });

    return { message: "Payment method confirmed" };
  };
}
