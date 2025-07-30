import cron from "node-cron";
import { PrismaService } from "../modules/prisma/prisma.service";

export const pointSchedule = () => {
  const prisma = new PrismaService();
  cron.schedule("0 0 * * *", async () => {
    try {
      const now = new Date();
      const expiredPoints = await prisma.referralPoint.findMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      if (expiredPoints.length > 0) {
        const expiredIds = expiredPoints.map((point) => point.id);

        await prisma.referralPoint.deleteMany({
          where: {
            id: { in: expiredIds },
          },
        });
      }
    } catch (error) {
        console.error("failed to process referral point scheduler", error)
    }
  });
};
