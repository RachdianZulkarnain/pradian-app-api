import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class ApplyVoucherDTO {
  @IsUUID()
  @IsNotEmpty()
  uuid!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}
