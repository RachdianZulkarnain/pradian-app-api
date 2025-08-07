// src/modules/transactions/transaction.worker.ts
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
      where: { uuid },
    });

    if (!transaction) {
      throw new ApiError("Invalid transaction UUID", 400);
    }

    // Jika masih menunggu pembayaran, set ke EXPIRED dan rollback stock
    if (transaction.status === "WAITING_FOR_PAYMENT") {
      await this.prisma.$transaction(async (tx) => {
        // Update status jadi EXPIRED
        await tx.transaction.update({
          where: { uuid },
          data: { status: "EXPIRED" },
        });

        // Ambil detail transaksi
        const transactionDetails = await tx.transactionDetail.findMany({
          where: { transactionId: transaction.id },
        });

        // Kembalikan stok tiket
        for (const detail of transactionDetails) {
          await tx.ticket.update({
            where: { id: detail.ticketId },
            data: {
              stock: {
                increment: detail.qty,
              },
            },
          });
        }
      });
    }
  };
}
