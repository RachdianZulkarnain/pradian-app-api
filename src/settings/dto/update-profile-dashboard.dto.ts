import { IsOptional, IsString } from "class-validator";

export class UpdateDashboardProfileDto {
  @IsOptional()
  @IsString()
  name!: string;
}
