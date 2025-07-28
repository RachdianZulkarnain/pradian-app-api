import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { PaginationQueryParams } from "../pagination/dto/pagination.dto";
import { EventService } from "./event.service";

export class EventController {
  private eventService: EventService;
  constructor() {
    this.eventService = new EventService();
  }

  getBlogs = async (req: Request, res: Response) => {
    const query = plainToInstance(PaginationQueryParams, req.query);
    const result = await this.eventService.getBlogs(query);
    res.status(200).send(result);
  };
}
