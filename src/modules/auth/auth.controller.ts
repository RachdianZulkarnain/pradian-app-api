import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { ApiError } from "../../utils/api-error";

export class AuthController {
  private authService: AuthService;
  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const pictureProfile = files.pictureProfile?.[0];
    if (!pictureProfile) {
      throw new ApiError("Picture is required", 400);
    }
    const result = await this.authService.register(req.body, pictureProfile);
    res.status(200).send(result);
  };

  login = async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    res.status(200).send(result);
  };
}
