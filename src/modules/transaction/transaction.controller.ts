import { Request, Response } from "express";
import { TransactionService } from "./transaction.service";
import { ApiError } from "../../utils/api-error";

export class TransactionController {
  private transactionService: TransactionService;
  constructor() {
    this.transactionService = new TransactionService();
  }

  createTransaction = async (req: Request, res: Response) => {
    const authUserId = res.locals.user.id;
    const result = await this.transactionService.createTransaction(
      req.body,
      authUserId
    );
    res.status(200).send(result);
  };

  uploadPaymentProof = async (req: Request, res: Response) => {
    const files = req.files as { [filename: string]: Express.Multer.File[] };
    const paymentProof = files.paymentProof?.[0];
    if (!paymentProof) throw new ApiError("paymentProof is required", 400);

    const authUserId = res.locals.user.id;
    const result = await this.transactionService.uploadPaymentProof(
      req.body.uuid,
      paymentProof,
      authUserId
    );
    res.status(200).send(result);
  };

  updateTransaction = async (req: Request, res: Response) => {
    const result = await this.transactionService.updateTransaction(req.body);
    res.status(200).send(result);
  };
}
