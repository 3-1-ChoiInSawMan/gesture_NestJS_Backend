import { IsNotEmpty, IsString, MaxLength } from "class-validator";


export class LoginDto {
  /**
   * 
   */
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  password: string;
}