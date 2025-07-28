import Mail from "nodemailer/lib/mailer";
import { ApiError } from "../../utils/api-error";
import { JwtService } from "../jwt/jwt.service";
import { MailService } from "../mail/mail.service";
import { PasswordService } from "../password/password.service";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { nanoid } from "nanoid";

export class AuthService {
  private prisma: PrismaService;
  private passwordService: PasswordService;
  private jwtService: JwtService;
  private mailService: MailService;
  constructor() {
    this.prisma = new PrismaService();
    this.passwordService = new PasswordService();
    this.jwtService = new JwtService();
    this.mailService = new MailService();
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
      referralCode = nanoid(8); // e.g., "fj38djsh"
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
            code: `WELCOME-${newUser.id}-${Date.now()}`,
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
}
