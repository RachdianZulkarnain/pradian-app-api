import { IsOptional, IsString, IsNumberString, IsIn } from "class-validator";

export class GetVouchersDTO {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  @IsIn(["asc", "desc"])
  sortOrder?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsNumberString()
  page: string = "1";

  @IsOptional()
  @IsNumberString()
  take: string = "10";
}
