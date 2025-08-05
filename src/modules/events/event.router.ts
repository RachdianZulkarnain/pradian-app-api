import { Router } from "express";
import { EventController } from "./event.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { CreateEventDTO } from "./dto/create-event.dto";
import { validateBody } from "../../middlewares/validation.middleware";

export class EventRouter {
  private router: Router;
  private eventController: EventController;
  private jwtMiddleware: JwtMiddleware;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.router = Router();
    this.eventController = new EventController();
    this.jwtMiddleware = new JwtMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/list/short", this.eventController.getShortEvents);

    this.router.get("/", this.eventController.getEvents);

    this.router.patch(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.eventController.updateEventStatus
    );

    this.router.get(
      "/admin",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.eventController.getMyEvents
    );

    this.router.get("/:slug", this.eventController.getEventBySlug);

    this.router.patch(
      "/:slug/edit",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "thumbnail", maxCount: 1 }]),
      this.uploaderMiddleware.fileFilter([
        "image/jpeg",
        "image/png",
        "image/avif",
        "image/webp",
      ]),
      validateBody(CreateEventDTO), // if you have a DTO validator for editing
      this.eventController.editEvent
    );

    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "thumbnail", maxCount: 1 }]),
      this.uploaderMiddleware.fileFilter([
        "image/jpeg",
        "image/png",
        "image/webp",
      ]),
      validateBody(CreateEventDTO),
      this.eventController.createEvent
    );
  };

  getRouter = () => {
    return this.router;
  };
}
