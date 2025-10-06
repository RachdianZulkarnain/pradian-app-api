import { PrismaClient } from "../../generated/prisma";

export class BankDetailsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  getBankDetails = async (userId: number) => {
    const details = await this.prisma.bankDetails.findFirst({
      where: { userId },
    });

    return details;
  };

  upsertBankDetails = async (
    userId: number,
    input: {
      bankName: string;
      accountName: string;
      accountNumber: string;
    }
  ) => {
    const existing = await this.prisma.bankDetails.findFirst({
      where: { userId },
    });

    if (existing) {
      const updated = await this.prisma.bankDetails.update({
        where: { id: existing.id },
        data: {
          bankName: input.bankName,
          accountName: input.accountName,
          accountNumber: input.accountNumber,
        },
      });
      return updated;
    } else {
      const created = await this.prisma.bankDetails.create({
        data: {
          userId,
          bankName: input.bankName,
          accountName: input.accountName,
          accountNumber: input.accountNumber,
        },
      });
      return created;
    }
  };
}
