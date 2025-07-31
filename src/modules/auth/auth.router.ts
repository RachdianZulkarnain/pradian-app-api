import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateBody } from "../../middlewares/validation.middleware";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";

export class AuthRouter {
  private authController: AuthController;
  private router: Router;
  private uploaderMiddleware: UploaderMiddleware;
  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    this.router.post(
      "/register",
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "profilePicture", maxCount: 1 }]),
      validateBody(RegisterDto),
      this.authController.register
    );
    this.router.post(
      "/login",
      validateBody(LoginDto),
      this.authController.login
    );
  };

  getRouter = () => {
    return this.router;
  };
}
