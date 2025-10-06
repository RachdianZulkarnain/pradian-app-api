import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { PaginationQueryParams } from "../pagination/dto/pagination.dto";
import { EventService } from "./event.service";

export class EventController {
  private eventService: EventService;
  constructor() {
    this.eventService = new EventService();
  }

  getEvents = async (req: Request, res: Response) => {
    const query = plainToInstance(PaginationQueryParams, req.query);
    const result = await this.eventService.getEvents(query);
    res.status(200).send(result);
  };

  getMyEvents = async (req: Request, res: Response) => {
    const adminId = res.locals.user?.id;
    if (!adminId) throw new ApiError("Unauthorized", 401);

    const take = parseInt(req.query.take as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    const result = await this.eventService.getMyEvents({ adminId, take, page });
    res.status(200).send(result);
  };

  updateEventStatus = async (req: Request, res: Response) => {
    const eventId = req.body.id;
    const status = req.body.status;

    if (!["ACTIVE", "DRAFT"].includes(status)) {
      throw new ApiError("Invalid status", 400);
    }

    const userId = res.locals.user?.id;
    if (!userId) throw new ApiError("Unauthorized", 401);

    const updated = await this.eventService.updateEventStatus(
      eventId,
      status,
      userId
    );
    res.status(200).send({ message: "Status updated", updated });
  };

  getEventBySlug = async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const result = await this.eventService.getEventBySlug(slug);
    res.status(200).send(result);
  };

  createEvent = async (req: Request, res: Response) => {
    const files = req.files as { [filename: string]: Express.Multer.File[] };
    const thumbnail = files.thumbnail?.[0];
    if (!thumbnail) throw new ApiError("thumbnail is required", 400);

    const result = await this.eventService.createEvent(
      req.body,
      thumbnail,
      res.locals.user.id
    );
    res.status(200).send(result);
  };

  editEvent = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const thumbnail = files?.thumbnail?.[0];

    const { slug } = req.params;
    const body = req.body;
    const userId = res.locals.user.id;

    const result = await this.eventService.editEvent(
      slug,
      body,
      thumbnail,
      userId
    );

    res.status(200).send(result);
  };

  getShortEvents = async (req: Request, res: Response) => {
    const result = await this.eventService.getShortEvents();
    res.status(200).send(result);
  };

  getTicketsByEvent = async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug) throw new ApiError("Slug is required", 400);

    const result = await this.eventService.getTicketsByEvent(slug);
    res.status(200).send(result);
  };
}
