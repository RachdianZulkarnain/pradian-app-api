import { PrismaService } from "../prisma/prisma.service";

export class AnalyticsService {
  private prismaService: PrismaService;
  constructor() {
    this.prismaService = new PrismaService();
  }

  getMonthlyAnalytics = async (adminId: number, year: number) => {
    const transactions = await this.prismaService.transaction.findMany({
      where: {
        event: {
          adminId,
          deletedAt: null,
        },
        status: "PAID",
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
      include: {
        transactionDetail: true,
      },
    });

    const monthlyTotals: Record<number, number> = Array.from(
      { length: 12 },
      (_, i) => [i + 1, 0]
    ).reduce((acc, [month]) => {
      acc[month] = 0;
      return acc;
    }, {} as Record<number, number>);

    for (const tx of transactions) {
      const month = new Date(tx.createdAt).getMonth() + 1;
      const revenue = tx.transactionDetail.reduce(
        (sum, detail) => sum + detail.qty * detail.price,
        0
      );
      monthlyTotals[month] += revenue;
    }

    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString("en-US", { month: "short" }),
      revenue: monthlyTotals[i + 1],
    }));
  };

  getAdminAnalytics = async (adminId: number) => {
    const totalEvents = await this.prismaService.event.count({
      where: {
        adminId,
        deletedAt: null,
      },
    });

    const totalTickets = await this.prismaService.ticket.count({
      where: {
        event: {
          adminId,
          deletedAt: null,
        },
      },
    });

    const totalVouchers = await this.prismaService.voucher.count({
      where: {
        event: {
          adminId,
          deletedAt: null,
        },
      },
    });

    const transactions = await this.prismaService.transaction.findMany({
      where: {
        event: {
          adminId,
          deletedAt: null,
        },
        status: "PAID",
      },
      include: {
        transactionDetail: true,
      },
    });

    const totalRevenue = transactions.reduce((acc, tx) => {
      const txTotal = tx.transactionDetail.reduce((sum, detail) => {
        return sum + detail.qty * detail.price;
      }, 0);
      return acc + txTotal;
    }, 0);

    return {
      totalRevenue,
      totalEvents,
      totalTickets,
      totalVouchers,
    };
  };
}
