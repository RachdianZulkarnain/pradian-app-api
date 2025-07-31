import { IsNotEmpty, IsString } from "class-validator";

export class UpdateProfileDto {
  @IsNotEmpty()
  @IsString()
  name!: string;


}
