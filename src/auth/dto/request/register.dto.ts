import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  id: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  nickname: string;

  @IsOptional()
  @IsString()
  profile_image_uuid?: string | null;
}
