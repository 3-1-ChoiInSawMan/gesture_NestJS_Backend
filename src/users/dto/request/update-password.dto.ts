import { IsNotEmpty } from "class-validator";

export class UpdatePasswordDto {
  @IsNotEmpty()
  current_password: string;

  @IsNotEmpty()
  new_password: string;
}
