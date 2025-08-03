import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../../utils/api-error";
import { CreateVoucherDTO } from "./dto/create-voucher.dto";
import { GetVouchersDTO } from "./dto/get-vouchers.dto";

export class VoucherService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();
  }

  getVouchers = async (query: GetVouchersDTO) => {
    const {
      take = "10",
      page = "1",
      sortBy = "createdAt",
      sortOrder = "desc",
      event,
      code,
    } = query;

    const whereClause: any = {};

    if (event) {
      whereClause.eventId = Number(event);
    }

    if (code) {
      whereClause.code = {
        contains: code,
        mode: "insensitive",
      };
    }

    const vouchers = await this.prisma.voucher.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (Number(page) - 1) * Number(take),
      take: Number(take),
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            startDate: true,
            endDate: true,
            location: true,
            category: true,
            createdAt: true,
            updatedAt: true,
            adminId: true,
          },
        },
      },
    });

    const total = await this.prisma.voucher.count({ where: whereClause });

    return {
      data: vouchers,
      meta: {
        page: Number(page),
        take: Number(take),
        total,
      },
    };
  };

  createVoucher = async (body: CreateVoucherDTO, userId: number) => {
    const eventId = Number(body.event);
    const value = Number(body.value);
    const limit = Number(body.limit);

    if (isNaN(eventId) || isNaN(value) || isNaN(limit)) {
      throw new ApiError("Invalid event, value, or limit format", 400);
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    const existingVoucher = await this.prisma.voucher.findFirst({
      where: {
        code: body.code,
        eventId,
      },
    });

    if (existingVoucher) {
      throw new ApiError("Voucher code already exists for this event", 409);
    }

    const voucher = await this.prisma.voucher.create({
      data: {
        code: body.code,
        eventId,
        value,
        stock: limit,
        createdBy: userId,
      },
    });

    return {
      message: "Voucher created successfully",
      data: voucher,
    };
  };
}
