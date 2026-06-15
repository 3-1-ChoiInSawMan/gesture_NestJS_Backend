import { Type } from 'class-transformer';
import { IsInstance, IsInt, IsNotEmpty, Min } from 'class-validator';

export class SendAudioDto {
  @IsNotEmpty()
  @Type(() => Buffer)
  @IsInstance(Buffer)
  audio: Buffer;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  callRoomIdx: number;
}
