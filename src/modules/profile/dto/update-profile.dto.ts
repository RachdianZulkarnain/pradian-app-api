import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

}
