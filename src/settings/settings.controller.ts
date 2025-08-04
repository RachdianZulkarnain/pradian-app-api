import { Request, Response } from "express";
import { SettingsService } from "./settings.service";

export class SettingsController {
  private settingsService: SettingsService;
  constructor() {
    this.settingsService = new SettingsService();
  }

  getProfile = async (req: Request, res: Response) => {
    const authUserId = res.locals.user.id;
    const result = await this.settingsService.getProfile(authUserId);
    res.status(200).send(result);
  };

  updateProfile = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const pictureProfile = files.pictureProfile?.[0];
    const authUserId = res.locals.user.id;
    const body = req.body;

    const result = await this.settingsService.updateProfile(
      authUserId,
      body,
      pictureProfile
    );
    res.status(200).send(result);
  };

  changePassword = async (req: Request, res: Response) => {
    const authUserId = res.locals.user.id;
    const result = await this.settingsService.changePassword(
      req.body,
      authUserId
    );
    res.status(200).send(result);
  };
}
