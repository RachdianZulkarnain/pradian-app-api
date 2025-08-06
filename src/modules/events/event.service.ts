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
      status: "ACTIVE",
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

  getMyEvents = async ({
    adminId,
    take,
    page,
  }: {
    adminId: number;
    take: number;
    page: number;
  }) => {
    const whereClause = {
      deletedAt: null,
      adminId,
    };

    const events = await this.prisma.event.findMany({
      where: whereClause,
      skip: (page - 1) * take,
      take,
      include: {
        tickets: {
          select: {
            price: true,
          },
        },
      },
    });

    const total = await this.prisma.event.count({ where: whereClause });

    return {
      data: events,
      meta: {
        page,
        take,
        total,
      },
    };
  };

  updateEventStatus = async (
    eventId: number,
    status: "ACTIVE" | "DRAFT",
    userId: number
  ) => {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, adminId: userId, deletedAt: null },
    });

    if (!event) {
      throw new ApiError("Event not found or not yours", 404);
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: { status },
    });
  };

  getEventBySlug = async (slug: string) => {
    const event = await this.prisma.event.findFirst({
      where: { slug },
      include: {
        tickets: true,
        admin: {
          select: {
            name: true,
            pictureProfile: true,
          },
        },
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

  editEvent = async (
    slug: string,
    body: Partial<CreateEventDTO>, // Use Partial to allow partial updates
    thumbnail: Express.Multer.File | undefined,
    authUserId: number
  ) => {
    const existing = await this.prisma.event.findFirst({
      where: { slug },
    });

    if (!existing) {
      throw new ApiError("Event not found", 404);
    }

    if (existing.adminId !== authUserId) {
      throw new ApiError("Unauthorized to edit this event", 403);
    }

    let newThumbnail = existing.thumbnail;

    if (thumbnail) {
      if (existing.thumbnail) {
        await this.cloudinaryService.remove(existing.thumbnail);
      }
      const { secure_url } = await this.cloudinaryService.upload(thumbnail);
      newThumbnail = secure_url;
    }

    let startDate: Date | undefined = existing.startDate;
    let endDate: Date | undefined = existing.endDate;

    if (body.startDate) {
      const parsedStart = new Date(body.startDate);
      if (isNaN(parsedStart.getTime())) {
        throw new ApiError("Invalid start date format", 400);
      }
      startDate = parsedStart;
    }

    if (body.endDate) {
      const parsedEnd = new Date(body.endDate);
      if (isNaN(parsedEnd.getTime())) {
        throw new ApiError("Invalid end date format", 400);
      }
      endDate = parsedEnd;
    }

    const updated = await this.prisma.event.update({
      where: { id: existing.id },
      data: {
        title: body.title ?? existing.title,
        description: body.description ?? existing.description,
        category: body.category ?? existing.category,
        location: body.location ?? existing.location,
        startDate,
        endDate,
        thumbnail: newThumbnail,
      },
    });

    return { message: "Event updated successfully", updated };
  };

  getShortEvents = async () => {
    const events = await this.prisma.event.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return events;
  };

  getTicketsByEvent = async (slug: string) => {
    const event = await this.prisma.event.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    const tickets = await this.prisma.ticket.findMany({
      where: {
        eventId: event.id,
      },
      select: {
        id: true,
        title: true,
        price: true,
        stock: true,
        description: true,
        totalPrice: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { data: tickets };
  };
}
