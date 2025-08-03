import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../../utils/api-error";
import { CreateVoucherDTO } from "./dto/create-voucher.dto";
import { GetVouchersDTO } from "./dto/get-vouchers.dto";

export class VoucherService {
  private prisma = new PrismaService();

  getVouchers = async (query: GetVouchersDTO) => {
    const {
      take = "10",
      page = "1",
      sortBy = "createdAt",
      sortOrder = "desc",
      event,
      code,
    } = query;

    const where: any = {};
    if (event) where.eventId = Number(event);
    if (code) where.code = { contains: code, mode: "insensitive" };

    const data = await this.prisma.voucher.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (Number(page) - 1) * Number(take),
      take: Number(take),
      include: { event: true },
    });

    const total = await this.prisma.voucher.count({ where });
    return { data, meta: { page: Number(page), take: Number(take), total } };
  };

  getVouchersByEvent = async (eventId: number) => {
    return this.prisma.voucher.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  };

  createVoucher = async (body: CreateVoucherDTO, userId: number) => {
    const { event, code, value, limit } = body;
    const eventId = Number(event);

    if (isNaN(eventId) || isNaN(Number(value)) || isNaN(Number(limit))) {
      throw new ApiError("Invalid event, value, or limit format", 400);
    }

    const exists = await this.prisma.voucher.findFirst({
      where: { code, eventId },
    });
    if (exists) throw new ApiError("Voucher code already exists", 409);

    const voucher = await this.prisma.voucher.create({
      data: {
        code,
        eventId,
        value: Number(value),
        stock: Number(limit),
        createdBy: userId,
      },
    });

    return { message: "Voucher created successfully", data: voucher };
  };
}
