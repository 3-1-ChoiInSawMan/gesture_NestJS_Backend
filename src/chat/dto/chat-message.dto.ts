import { Type } from 'class-transformer';
import { IsIn, IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export type ChatRoomType = 'call' | 'dm';

export class ChatRoomPayloadDto {
  @IsIn(['call', 'dm'])
  roomType: ChatRoomType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetIdx: number;
}

export class ChatMessagePayloadDto extends ChatRoomPayloadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;
}
