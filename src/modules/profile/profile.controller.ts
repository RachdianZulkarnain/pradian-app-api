import { Request, Response } from "express";
import { ProfileService } from "./profile.service";
import { ApiError } from "../../utils/api-error";

export class ProfileController {
  private profileService: ProfileService;
  constructor() {
    this.profileService = new ProfileService();
  }

  getProfile = async (req: Request, res: Response) => {
    const authUserId = res.locals.user.id;
    const result = await this.profileService.getProfile(authUserId);
    res.status(200).send(result);
  };

  updateProfile = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const pictureProfile = files.pictureProfile?.[0];
    if (!pictureProfile) throw new ApiError("pictureProfile is required", 400);
    const authUserId = res.locals.user.id;
    const name = req.body.name;

    const result = await this.profileService.updateProfile(
      name,
      pictureProfile,
      authUserId
    );
    res.status(200).send(result);
  };

  changePassword = async (req: Request, res: Response) => {
    const authUserId = res.locals.user.id;
    const result = await this.profileService.changePassword(
      req.body,
      authUserId
    );
    res.status(200).send(result);
  };
}
