import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateMeetingMinutesDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @ValidateIf((body) => !body.content)
  @IsNotEmpty()
  @IsString()
  transcript?: string;

  @ValidateIf((body) => !body.transcript)
  @IsNotEmpty()
  @IsString()
  content?: string;

  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @IsOptional()
  @IsString()
  aiSummary?: string;

  @IsOptional()
  @IsString()
  ai_summary?: string;

  @IsArray()
  conclusion: unknown[];
}
