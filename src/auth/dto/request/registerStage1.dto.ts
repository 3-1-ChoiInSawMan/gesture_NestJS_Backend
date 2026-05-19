import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RegisterStage1Dto {
  /**
   * 
   */
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email: string;
}