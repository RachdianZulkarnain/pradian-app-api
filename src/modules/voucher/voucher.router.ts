import { Router } from "express";
import { VoucherController } from "./voucher.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { CreateVoucherDTO } from "./dto/create-voucher.dto";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";

const uploader = new UploaderMiddleware();
const controller = new VoucherController();
const jwt = new JwtMiddleware();

export class VoucherRouter {
  private router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/", controller.getVouchers);
    this.router.get("/event/:eventId", controller.getVouchersByEvent);
    this.router.post(
      "/",
      jwt.verifyToken(process.env.JWT_SECRET!),
      uploader.upload().none(),
      validateBody(CreateVoucherDTO),
      controller.createVoucher
    );
  }

  getRouter() {
    return this.router;
  }
}
