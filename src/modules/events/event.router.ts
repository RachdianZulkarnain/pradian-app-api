import { Router } from "express";
import { EventController } from "./event.controller";

export class EventRouter {
  private router: Router;
  private eventController: EventController;
  constructor() {
    this.router = Router();
    this.eventController = new EventController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/", this.eventController.getBlogs);
  };

  getRouter = () => {
    return this.router;
  };
}
