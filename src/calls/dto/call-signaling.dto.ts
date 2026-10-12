import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CallRoomPayloadDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  callRoomIdx: number;
}
