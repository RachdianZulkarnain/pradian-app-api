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
    const { take, page, sortBy, sortOrder, search, category, location } = query;

    const whereCluse: Prisma.EventWhereInput = {
      deletedAt: null,
    };

    if (search) {
      whereCluse.title = { contains: search, mode: "insensitive" };
    }

    if (category) {
      whereCluse.category = category;
    }

    if (location) {
      whereCluse.location = location;
    }

    const events = await this.prisma.event.findMany({
      where: whereCluse,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * take,
      take: take,
      include: {
        tickets: {
          select: {
            price: true,
          },
        },
      },
    });

    const total = await this.prisma.event.count({ where: whereCluse });

    return {
      data: events,
      meta: { page, take, total },
    };
  };

  getEventBySlug = async (slug: string) => {
    const event = await this.prisma.event.findFirst({
      where: { slug },
      include: {
        tickets: true,
      },
    });

    if (!event) {
      throw new ApiError("event not found", 404);
    }
    return event;
  };

  createEvent = async (
    body: CreateEventDTO,
    thumbnail: Express.Multer.File,
    authUserId: number
  ) => {
    const existing = await this.prisma.event.findFirst({
      where: { title: body.title },
    });

    if (existing) {
      throw new ApiError("Title already in use", 400);
    }

    const slug = generateSlug(body.title);
    const { secure_url } = await this.cloudinaryService.upload(thumbnail);

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ApiError("Invalid date format", 400);
    }

    await this.prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        location: body.location,
        startDate,
        endDate,
        thumbnail: secure_url,
        adminId: authUserId,
        slug,
      },
    });

    return { message: "Create event success" };
  };
}
