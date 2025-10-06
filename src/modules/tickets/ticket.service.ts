import { Prisma } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTicketDTO } from "./dto/create-ticket.dto";
import { GetTicketsDTO } from "./dto/get-tickets.dto";

export class TicketService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();
  }

  getTickets = async (query: GetTicketsDTO) => {
    const {
      take = 10,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = query;

    const whereClause: Prisma.TicketWhereInput = {};

    if (search) {
      whereClause.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    const tickets = await this.prisma.ticket.findMany({
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

    const total = await this.prisma.ticket.count({ where: whereClause });

    return {
      data: tickets,
      meta: { page: Number(page), take: Number(take), total },
    };
  };

  createTicket = async (body: CreateTicketDTO, userId: number) => {
    const eventId = Number(body.event);
    const price = Number(body.price);
    const limit = Number(body.limit);

    if (isNaN(eventId) || isNaN(price) || isNaN(limit)) {
      throw new ApiError("Invalid event, price, or limit format", 400);
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        title: body.title,
        description: body.description,
        eventId,
        price,
        stock: limit,
        createdBy: userId,
      },
    });

    return {
      message: "Ticket created successfully",
      data: ticket,
    };
  };
}
