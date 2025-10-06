import { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { AnalyticsService } from "./analytics.service";

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  getAdminAnalytics = async (req: Request, res: Response) => {
    const adminId = res.locals.user?.id;
    if (!adminId) throw new ApiError("Unauthorized", 401);

    const result = await this.analyticsService.getAdminAnalytics(adminId);
    res.status(200).send(result);
  };

   getMonthlyAnalytics = async (req: Request, res: Response) => {
    const adminId = res.locals.user?.id;
    if (!adminId) throw new ApiError("Unauthorized", 401);

    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const data = await this.analyticsService.getMonthlyAnalytics(adminId, year);
    res.status(200).send(data);
  };
}
