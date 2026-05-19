import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, ValidateIf } from "class-validator";
import { CallRoomCategory } from "src/call-rooms/enums/call-room-category.enum";

export class UpdateCallRoomDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(CallRoomCategory)
  category: CallRoomCategory;

  @ValidateIf((o) => o.is_public === false)
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Password must be a 4-digit number between 0000 and 9999.'
  })
  password: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  max_participant: number;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  is_public: boolean;
}
