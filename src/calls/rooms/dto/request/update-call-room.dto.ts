import { IsBoolean, IsEnum, IsNotEmpty, IsInt, IsOptional, IsString, Matches, Min, ValidateIf } from "class-validator";
import { Transform, Type } from 'class-transformer';
import { parseFormBoolean } from './room-field.transforms';
import { CallRoomCategory } from "src/calls/rooms/enums/call-room-category.enum";

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

  @ValidateIf((o: UpdateCallRoomDto) => o.isPublic === false || o.password !== undefined)
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Password must be a 4-digit number between 0000 and 9999.'
  })
  password: string;

  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxParticipant: number;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  @Transform(parseFormBoolean)
  isPublic: boolean;
}
