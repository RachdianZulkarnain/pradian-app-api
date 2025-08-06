import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateBody } from "../../middlewares/validation.middleware";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { RegisterAdminDto } from "./dto/register-admin.dto";

export class AuthRouter {
  private authController: AuthController;
  private router: Router;
  private uploaderMiddleware: UploaderMiddleware;
  private jwtMiddleware: JwtMiddleware;
  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.jwtMiddleware = new JwtMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    this.router.post(
      "/register",
      validateBody(RegisterDto),
      this.authController.register
    );
    this.router.post(
      "/register/admin",
      validateBody(RegisterAdminDto),
      this.authController.registerAdmin
    );
    this.router.post(
      "/login",
      validateBody(LoginDto),
      this.authController.login
    );
    this.router.post(
      "/forgot-password",
      validateBody(ForgotPasswordDto),
      this.authController.forgotPassword
    );
    this.router.patch(
      "/reset-password",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET_RESET!),
      validateBody(ResetPasswordDto),
      this.authController.resettPassword
    );
  };

  getRouter = () => {
    return this.router;
  };
}
