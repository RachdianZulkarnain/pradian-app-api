import { Request, Response } from "express";
import { TransactionService } from "./transaction.service";
import { ApiError } from "../../utils/api-error";
import { plainToInstance } from "class-transformer";
import { PaginationQueryParams } from "../pagination/dto/pagination.dto";

export class TransactionController {
  private transactionService = new TransactionService();

  createTransaction = async (req: Request, res: Response) => {
    try {
      const authUserId = res.locals.user.id;
      const result = await this.transactionService.createTransaction(
        req.body,
        authUserId
      );
      return res.status(201).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  uploadPaymentProof = async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const paymentProof = files?.paymentProof?.[0];
      if (!paymentProof) throw new ApiError("paymentProof is required", 400);

      const authUserId = res.locals.user.id;
      const { uuid } = req.body;
      if (!uuid) throw new ApiError("UUID is required", 400);

      const result = await this.transactionService.uploadPaymentProof(
        uuid,
        paymentProof,
        authUserId
      );
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateTransaction = async (req: Request, res: Response) => {
    try {
      const result = await this.transactionService.updateTransaction(req.body);
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getAdminTransactions = async (req: Request, res: Response) => {
    const adminId = res.locals.user?.id;
    if (!adminId) throw new ApiError("Unauthorized", 401);

    const take = parseInt(req.query.take as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    const result = await this.transactionService.getAdminTransactions({
      adminId,
      take,
      page,
    });

    res.status(200).send(result);
  };

  getTransaction = async (req: Request, res: Response) => {
    try {
      const authUserId = res.locals.user.id;
      const { uuid } = req.params;

      if (!uuid) throw new ApiError("UUID is required", 400);

      const result = await this.transactionService.getTransaction(
        uuid,
        authUserId
      );
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getAttendees = async (req: Request, res: Response) => {
    const query = plainToInstance(PaginationQueryParams, req.query);
    const adminId = res.locals.user?.id;
    const result = await this.transactionService.getAttendees(query, adminId);
    res.status(200).send(result);
  };

  applyVoucher = async (req: Request, res: Response) => {
    try {
      const authUserId = res.locals.user.id;
      const { uuid, code } = req.body;

      if (!uuid || !code) {
        throw new ApiError("UUID and voucher code are required", 400);
      }

      const result = await this.transactionService.applyVoucher(
        uuid,
        code,
        authUserId
      );
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  confirmPayment = async (req: Request, res: Response) => {
    try {
      const authUserId = res.locals.user.id;
      const { uuid } = req.params;
      const { method } = req.body;

      if (!uuid) throw new ApiError("UUID is required", 400);
      if (!method) throw new ApiError("Payment method is required", 400);

      const result = await this.transactionService.confirmPayment(
        uuid,
        method,
        authUserId
      );
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("[TransactionController Error]:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
