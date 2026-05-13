import { IsNotEmpty, IsOptional, Matches } from "class-validator";

export class JoinCallRoomDto {
  @IsOptional()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Password must be a 4-digit number between 0000 and 9999.'
  })
  password: string;
}
