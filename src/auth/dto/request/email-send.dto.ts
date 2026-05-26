import { IsEmail, IsNotEmpty } from "class-validator";

export class EmailSendDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}