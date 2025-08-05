import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class PayloadItem {
  @IsInt()
  @IsPositive()
  ticketId!: number;

  @IsInt()
  @IsPositive()
  qty!: number;
}

export class CreateTransactionDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayloadItem)
  payload!: PayloadItem[];
}
