import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { PaginationQueryParams } from "../pagination/dto/pagination.dto";
import { EventService } from "./event.service";
import { ApiError } from "../../utils/api-error";

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

  getShortEvents = async (req: Request, res: Response) => {
    const result = await this.eventService.getShortEvents();
    res.status(200).send(result);
  };
}
