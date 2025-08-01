import { connection } from "../../config/redis";
import { Job, Worker } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../../utils/api-error";

export class TransactionWorker {
  private worker: Worker;
  private prisma: PrismaService;
  constructor() {
    this.prisma = new PrismaService();
    this.worker = new Worker("transactionQueue", this.handleTransaction, {
      connection,
    });
  }

  private handleTransaction = async (job: Job<{ uuid: string }>) => {
    const uuid = job.data.uuid;

    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid: uuid },
    });

    if (!transaction) {
      throw new ApiError("Invalid transaction UUID", 400);
    }

    if (transaction.status === "WAITING_FOR_PAYMENT") {
      await this.prisma.$transaction(async (tx) => {
        // ubah status transaksi menjadi EXPIRED
        await tx.transaction.update({
          where: { uuid },
          data: { status: "EXPIRED" },
        });

        //ambil semua transaction detail
        const transactionDetails = await tx.transactionDetail.findMany({
          where: { transactionId: transaction.id },
        });

        //kembalikan stock ticket
        for (const detail of transactionDetails) {
          await tx.ticket.update({
            where: { id: detail.ticketId },
            data: { stock: { increment: detail.qty } },
          });
        }
      });
    }
  };
}
