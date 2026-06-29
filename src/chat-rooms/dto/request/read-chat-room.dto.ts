import { Type } from 'class-transformer';
import { IsInt, Min, ValidateIf } from 'class-validator';

export class ReadChatRoomDto {
  @ValidateIf((body: ReadChatRoomDto) => body.lastReadMessageIdx === undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  last_read_message_idx?: number;

  @ValidateIf((body: ReadChatRoomDto) => body.last_read_message_idx === undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lastReadMessageIdx?: number;
}
