import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class ConfirmPaymentDTO {
  @IsUUID()
  @IsNotEmpty()
  uuid!: string;

  @IsString()
  @IsNotEmpty()
  method!: string;
}
