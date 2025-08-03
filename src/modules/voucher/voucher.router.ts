import { Router } from "express";
import { VoucherController } from "./voucher.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { CreateVoucherDTO } from "./dto/create-voucher.dto";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";

const uploader = new UploaderMiddleware();

export class VoucherRouter {
  private router: Router;
  private voucherController: VoucherController;
  private jwtMiddleware: JwtMiddleware;

  constructor() {
    this.router = Router();
    this.voucherController = new VoucherController();
    this.jwtMiddleware = new JwtMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    this.router.get("/", this.voucherController.getVouchers);
    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      uploader.upload().none(),
      validateBody(CreateVoucherDTO),
      this.voucherController.createVoucher
    );
  };

  getRouter = () => this.router;
}
