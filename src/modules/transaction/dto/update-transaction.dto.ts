import { IsEnum, IsUUID } from "class-validator";

export enum UpdateType {
  ACCEPT = "ACCEPT",
  REJECT = "REJECT",
}

export class UpdateTransactionDTO {
  @IsUUID()
  uuid!: string;

  @IsEnum(UpdateType)
  type!: UpdateType;
}
