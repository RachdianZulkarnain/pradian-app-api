import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RegisterAdminDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  role?: string;
}
