// review.controller.ts
import { Request, Response } from "express";
import { ReviewService } from "./reviews.service";

export class ReviewController {
  private reviewService = new ReviewService();

  getReviewsByEvent = async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const reviews = await this.reviewService.getReviewsByEvent(eventId);
    res.status(200).json(reviews);
  };

  createReview = async (req: Request, res: Response) => {
    const userId = res.locals.user.id;
    const { eventId, rating, content } = req.body;

    if (!eventId || !rating || !content) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const review = await this.reviewService.createReview({
      eventId: Number(eventId),
      userId,
      rating: Number(rating),
      content,
    });

    res.status(201).json(review);
  };
}
