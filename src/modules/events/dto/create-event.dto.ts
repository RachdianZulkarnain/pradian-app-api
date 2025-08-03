import { IsNotEmpty, IsString, IsDateString } from "class-validator";

export class CreateEventDTO {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsString()
  category!: string;

  @IsNotEmpty()
  @IsString()
  location!: string;

  @IsNotEmpty()
  @IsDateString()
  startDate!: string; // ISO string from frontend

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;
}
