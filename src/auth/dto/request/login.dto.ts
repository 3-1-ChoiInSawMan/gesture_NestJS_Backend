import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
