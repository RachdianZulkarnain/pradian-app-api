import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";

export class ReviewService {
  private prisma = new PrismaService();

  getReviewsByEvent = async (eventId: number) => {
    const reviews = await this.prisma.review.findMany({
      where: { eventId },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews;
  };

  createReview = async ({
    eventId,
    userId,
    rating,
    content,
  }: {
    eventId: number;
    userId: number;
    rating: number;
    content: string;
  }) => {
    const existing = await this.prisma.review.findFirst({
      where: { eventId, userId },
    });

    if (existing) {
      throw new ApiError("You have already reviewed this event", 400);
    }

    const review = await this.prisma.review.create({
      data: {
        eventId,
        userId,
        rating,
        comment: content,
      },
    });

    return review;
  };
}
