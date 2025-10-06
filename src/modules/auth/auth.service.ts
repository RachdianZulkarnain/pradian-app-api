import { nanoid } from "nanoid";
import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { JwtService } from "../jwt/jwt.service";
import { MailService } from "../mail/mail.service";
import { PasswordService } from "../password/password.service";
import { PrismaService } from "../prisma/prisma.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterAdminDto } from "./dto/register-admin.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

export class AuthService {
  private prisma: PrismaService;
  private passwordService: PasswordService;
  private jwtService: JwtService;
  private mailService: MailService;
  private cloudinaryService: CloudinaryService;
  constructor() {
    this.prisma = new PrismaService();
    this.passwordService = new PasswordService();
    this.jwtService = new JwtService();
    this.mailService = new MailService();
    this.cloudinaryService = new CloudinaryService();
  }

  register = async (body: RegisterDto) => {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });

    if (user) {
      throw new ApiError("email already exist", 400);
    }

    const hashedPassword = await this.passwordService.hashPassword(
      body.password
    );

    let referralCode: string;
    while (true) {
      referralCode = nanoid(8);
      const exists = await this.prisma.user.findFirst({
        where: { referralCode },
      });
      if (!exists) break;
    }

    let referredBy: string | undefined = undefined;
    if (body.referralCode) {
      const referrer = await this.prisma.user.findFirst({
        where: { referralCode: body.referralCode },
      });

      if (!referrer) {
        throw new ApiError("Invalid referral code", 400);
      }

      referredBy = body.referralCode;
    }

    await this.mailService.sendMail(
      body.email,
      "Thankyou for Registering!",
      "welcome",
      { name: body.name, year: new Date().getFullYear() }
    );

    const newUser = await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        referralCode,
        referredBy,
      },
      omit: { password: true },
    });
    if (referredBy) {
      const referrer = await this.prisma.user.findFirst({
        where: { referralCode: referredBy },
      });

      if (referrer) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        await this.prisma.coupon.create({
          data: {
            code: `WELCOME-${newUser.name}-${Date.now()}`,
            userId: newUser.id,
            discount: 10000,
            expiresAt,
          },
        });

        await this.prisma.referralPoint.create({
          data: {
            userId: referrer.id,
            amount: 10000,
            expiresAt,
          },
        });
      }
    }

    return newUser;
  };

  registerAdmin = async (body: RegisterAdminDto) => {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });

    if (user) {
      throw new ApiError("email already exist", 400);
    }

    const hashedPassword = await this.passwordService.hashPassword(
      body.password
    );

    await this.mailService.sendMail(
      body.email,
      "Welcome Organizer!",
      "welcome",
      { name: body.name, year: new Date().getFullYear() }
    );

    const newAdmin = await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: "ADMIN",
      },
      omit: { password: true },
    });

    return newAdmin;
  };

  login = async (body: LoginDto) => {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });

    if (!user) {
      throw new ApiError("Invalid Credentials", 400);
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      body.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new ApiError("Invalid Credentials", 400);
    }

    const payload = { id: user.id, role: user.role };
    const accessToken = this.jwtService.generateToken(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    const { password, ...userWithoutPassword } = user;

    return { ...userWithoutPassword, accessToken };
  };

  forgotPassword = async (body: ForgotPasswordDto) => {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });

    if (!user) {
      throw new ApiError("Invalid Email Address", 400);
    }

    const payload = { id: user.id };
    const token = this.jwtService.generateToken(
      payload,
      process.env.JWT_SECRET_RESET!,
      { expiresIn: "15m" }
    );

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    await this.mailService.sendMail(
      body.email,
      "Reset Your Password",
      "forgot-password",
      {
        name: user.name,
        resetLink: resetLink,
        expiryMinutes: "15",
        year: new Date().getFullYear(),
      }
    );

    return { message: "Check your email" };
  };

  resetPassword = async (body: ResetPasswordDto, authUserId: number) => {
    const user = await this.prisma.user.findFirst({
      where: { id: authUserId },
    });

    if (!user) {
      throw new ApiError("User Not Found", 404);
    }

    const hashedPassword = await this.passwordService.hashPassword(
      body.password
    );

    await this.prisma.user.update({
      where: { id: authUserId },
      data: { password: hashedPassword },
    });

    return { message: "reset pasword success" };
  };
}
