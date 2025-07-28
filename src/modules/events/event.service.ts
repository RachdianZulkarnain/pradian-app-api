import { Prisma } from "../../generated/prisma";
import { PaginationQueryParams } from "../pagination/dto/pagination.dto";
import { PrismaService } from "../prisma/prisma.service";
import { GetEventsDTO } from "./dto/get-events.dto";


export class EventService {
  private prisma: PrismaService;
  constructor() {
    this.prisma = new PrismaService();
  }

  getBlogs = async (query: GetEventsDTO) => {
    const { take, page, sortBy, sortOrder, search } = query;

    const whereCluse: Prisma.EventWhereInput = {};

    if (search) {
      whereCluse.title = { contains: search, mode: "insensitive" };
    }

    const events = await this.prisma.event.findMany({
      where: whereCluse,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * take,
      take: take,
      include: { admin: { omit: { password: true } } }, // join ke table user
    });

    const total = await this.prisma.event.count({ where: whereCluse });

    return {
      data: events,
      meta: { page, take, total },
    };
  };
}
