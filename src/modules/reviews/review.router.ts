import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { ReviewController } from "./review.controller";

export class ReviewRouter {
  private router = Router();
  private controller = new ReviewController();
  private jwt = new JwtMiddleware();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/event/:eventId", this.controller.getReviewsByEvent);
    this.router.post(
      "/",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.controller.createReview
    );
  }

  public getRouter() {
    return this.router;
  }
}
