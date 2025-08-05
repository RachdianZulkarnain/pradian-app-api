import { IsNumberString, IsOptional, IsString } from "class-validator";

export class GetUserTransactionsDTO {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  take?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
