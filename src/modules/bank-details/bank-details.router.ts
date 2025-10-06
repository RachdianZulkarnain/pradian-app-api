import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { BankDetailsController } from "./bank-details.controller";
import { UpsertBankDetailsDTO } from "./dto/bank-details.dto";

export class BankDetailsRouter {
  private router: Router;
  private controller: BankDetailsController;
  private jwtMiddleware: JwtMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new BankDetailsController();
    this.jwtMiddleware = new JwtMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    this.router.get(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.controller.getBankDetails
    );

    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      validateBody(UpsertBankDetailsDTO),
      this.controller.upsertBankDetails
    );
  };

  getRouter = () => {
    return this.router;
  };
}
