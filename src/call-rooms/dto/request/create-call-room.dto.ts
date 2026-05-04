import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsString, Matches, ValidateIf } from "class-validator";
import { CallRoomCategory } from "src/call-rooms/enums/call-room-category.enum";

export class CreateCallRoomDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(CallRoomCategory)
  category: CallRoomCategory;

  @ValidateIf((o) => o.is_public === false)
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Password must be a 4-digit number between 0000 and 9999.'
  })
  password: string;

  // @IsNotEmpty()
  // @IsNumber()
  // max_participant: number;

  // @IsNotEmpty()
  // @IsBoolean()
  // is_public: boolean;
}
