import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { ProfileService } from "./organizer.service";

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  getOrganizerProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new ApiError("Invalid organizer ID", 400);
      }

      const result = await this.profileService.getOrganizerById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
