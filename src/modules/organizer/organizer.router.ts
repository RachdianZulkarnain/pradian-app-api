import { Router } from "express";
import { ProfileController } from "./organizer.controller";

export class ProfileRouter {
  private router: Router;
  private profileController: ProfileController;

  constructor() {
    this.router = Router();
    this.profileController = new ProfileController();
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    this.router.get(
      "/organizer/:id",
      this.profileController.getOrganizerProfile
    );
  };

  getRouter = () => {
    return this.router;
  };
}
