import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { AnalyticsController } from "./analytics.controller";

export class AnalyticsRouter {
  private router: Router;
  private analyticsController: AnalyticsController;
  private jwtMiddleware = new JwtMiddleware();

  constructor() {
    this.router = Router();
    this.analyticsController = new AnalyticsController();
    this.jwtMiddleware = new JwtMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.analyticsController.getAdminAnalytics
    );
    this.router.get(
      "/monthly",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.analyticsController.getMonthlyAnalytics
    );
  }
  getRouter() {
    return this.router;
  }
}
