import { IsNotEmpty, IsNumberString, IsString } from "class-validator";

export class CreateVoucherDTO {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsNumberString()
  @IsNotEmpty()
  value!: string;

  @IsNumberString()
  @IsNotEmpty()
  limit!: string;
}
