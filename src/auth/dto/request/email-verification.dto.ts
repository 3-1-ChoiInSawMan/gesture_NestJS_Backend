import { IsEmail, IsNotEmpty, IsString, Length, MaxLength } from "class-validator";

export class EmailVerificationDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}
