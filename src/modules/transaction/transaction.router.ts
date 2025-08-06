import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";

import { TransactionController } from "./transaction.controller";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { UpdateTransactionDTO } from "./dto/update-transaction.dto";
import { GetAttendeesDTO } from "./dto/get-participants.dto";

export class TransactionRouter {
  private router: Router;
  private transactionController: TransactionController;
  private jwtMiddleware: JwtMiddleware;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.router = Router();
    this.transactionController = new TransactionController();
    this.jwtMiddleware = new JwtMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    const { verifyToken, verifyRole } = this.jwtMiddleware;

    this.router.post(
      "/",
      verifyToken(process.env.JWT_SECRET!),
      verifyRole(["USER"]),
      validateBody(CreateTransactionDTO),
      this.transactionController.createTransaction
    );

    this.router.get(
      "/attendees",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.getAttendees
    );

    this.router.patch(
      "/:uuid/upload-proof",
      verifyToken(process.env.JWT_SECRET!),
      verifyRole(["USER"]),
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "paymentProof", maxCount: 1 }]),
      this.uploaderMiddleware.fileFilter([
        "image/jpeg",
        "image/png",
        "image/heic",
        "image/avif",
      ]),
      this.transactionController.uploadPaymentProof
    );

    this.router.patch(
      "/",
      verifyToken(process.env.JWT_SECRET!),
      verifyRole(["ADMIN"]),
      validateBody(UpdateTransactionDTO),
      this.transactionController.updateTransaction
    );

    this.router.get(
      "/admin",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.getAdminTransactions
    );

    this.router.get(
      "/user",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.getUserTransactions
    );

    this.router.get(
      "/:uuid",
      verifyToken(process.env.JWT_SECRET!),
      verifyRole(["USER"]),
      this.transactionController.getTransaction
    );

    this.router.post(
      "/:uuid/apply-voucher",
      verifyToken(process.env.JWT_SECRET!),
      verifyRole(["USER"]),
      this.transactionController.applyVoucher
    );
  };

  public getRouter = () => {
    return this.router;
  };
}
