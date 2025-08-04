import { IsNotEmpty, IsString } from "class-validator";

export class ChangeDashboardPasswordDto {
  @IsNotEmpty()
  @IsString()
  oldPassword!: string;

  @IsNotEmpty()
  @IsString()
  newPassword!: string;  
}
