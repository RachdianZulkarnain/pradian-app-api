import { IsOptional, IsString } from "class-validator";

export class GetTicketsDTO {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string;

  @IsOptional()
  @IsString()
  page: string = "1";

  @IsOptional()
  @IsString()
  take: string = "10";
}
