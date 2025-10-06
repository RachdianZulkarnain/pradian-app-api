import { IsNotEmpty, IsNumberString, IsString } from "class-validator";

export class CreateTicketDTO {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsNumberString()
  @IsNotEmpty()
  price!: string;

  @IsNumberString()
  @IsNotEmpty()
  limit!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}
