// src/modules/analytics/analytics.router.ts
import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";

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
