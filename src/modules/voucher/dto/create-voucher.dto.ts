import { IsString, IsNotEmpty, IsNumberString } from "class-validator";

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
