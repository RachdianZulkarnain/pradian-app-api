import { Request, Response } from "express";
import { CreateTicketDTO } from "./dto/create-ticket.dto";
import { GetTicketsDTO } from "./dto/get-tickets.dto";
import { TicketService } from "./ticket.service";

export class TicketController {
  private ticketService: TicketService;

  constructor() {
    this.ticketService = new TicketService();
  }

  getTickets = async (req: Request, res: Response) => {
    const query = req.query as unknown as GetTicketsDTO;
    const result = await this.ticketService.getTickets(query);
    res.status(200).send(result);
  };

  createTicket = async (req: Request, res: Response) => {
    const authUserId = res.locals.user.id;
    const body = req.body as CreateTicketDTO;
    const result = await this.ticketService.createTicket(body, authUserId);
    res.status(201).send(result);
  };
}
