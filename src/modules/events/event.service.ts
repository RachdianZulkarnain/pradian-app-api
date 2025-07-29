import { Prisma } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { generateSlug } from "../../utils/generate-slug";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PaginationQueryParams } from "../pagination/dto/pagination.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDTO } from "./dto/create-event.dto";
import { GetEventsDTO } from "./dto/get-events.dto";

export class EventService {
  private prisma: PrismaService;
  private cloudinaryService: CloudinaryService;
  constructor() {
    this.prisma = new PrismaService();
    this.cloudinaryService = new CloudinaryService();
  }

  getEvents = async (query: GetEventsDTO) => {
    const { take, page, sortBy, sortOrder, search } = query;

    const whereCluse: Prisma.EventWhereInput = {
      deletedAt: null,
    };

    if (search) {
      whereCluse.title = { contains: search, mode: "insensitive" };
    }

    const events = await this.prisma.event.findMany({
      where: whereCluse,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * take,
      take: take,
    });

    const total = await this.prisma.event.count({ where: whereCluse });

    return {
      data: events,
      meta: { page, take, total },
    };
  };

  createEvent = async (
    body: CreateEventDTO,
    thumbnail: Express.Multer.File,
    autUserId: number
  ) => {
    const event = await this.prisma.event.findFirst({
      where: { title: body.title },
    });

    if (event) {
      throw new ApiError("title already in use", 400);
    }

    const slug = generateSlug(body.title);

    const { secure_url } = await this.cloudinaryService.upload(thumbnail);

    return await this.prisma.event.create({
      data: {
        ...body,
        thumbnail: secure_url,
        adminId: autUserId,
        slug: slug,
      },
    });
  };
}
