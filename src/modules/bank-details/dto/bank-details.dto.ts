import { IsString } from "class-validator";

export class UpsertBankDetailsDTO {
  @IsString()
  bankName!: string;

  @IsString()
  accountName!: string;

  @IsString()
  accountNumber!: string;
}
