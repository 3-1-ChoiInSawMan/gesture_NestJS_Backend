import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateDirectMessageRoomDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetUserIdx: number;
}
