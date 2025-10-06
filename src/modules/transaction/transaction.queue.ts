import { Queue } from "bullmq";
import { connection } from "../../config/redis";

export class TransactionQueue {
  private queue: Queue;
  constructor() {
    this.queue = new Queue("transactionQueue", { connection });
  }

  addNewTransactionQueue = async (uuid: string) => {
    // fungsi untuk create antrian
    return await this.queue.add(
      "newTransaction",
      { uuid: uuid },
      {
        jobId: uuid,
        delay: 60 * 1000,
        attempts: 5,
        removeOnComplete: true,
        backoff: { type: "exponential", delay: 1000 },
      }
    );
  };
}
