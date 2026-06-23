import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMeetingMinutesDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  conclusion?: unknown[];
}
