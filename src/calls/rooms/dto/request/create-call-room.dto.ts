import { IsBoolean, IsEnum, IsNotEmpty, IsInt, IsString, Matches, Min, ValidateIf } from "class-validator";
import { Transform, Type } from 'class-transformer';
import { parseFormBoolean } from './room-field.transforms';
import { CallRoomCategory } from "src/calls/rooms/enums/call-room-category.enum";

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

  @ValidateIf((o: CreateCallRoomDto) => o.isPublic === false)
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Password must be a 4-digit number between 0000 and 9999.'
  })
  password: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxParticipant: number;

  @IsNotEmpty()
  @IsBoolean()
  @Transform(parseFormBoolean)
  isPublic: boolean;
}
