import { Type } from 'class-transformer';
import { IsIn, IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export type ChatRoomType = 'call' | 'dm';

/**
 * 채팅방 입장/퇴장 시 받는 페이로드.
 * - call: targetIdx = 통화방 번호(callRoomIdx)
 * - dm:   targetIdx = 상대 유저 번호(userIdx)
 */
export class ChatRoomPayloadDto {
  @IsIn(['call', 'dm'])
  roomType: ChatRoomType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetIdx: number;
}

/**
 * 메시지 전송 시 받는 페이로드. 방 정보 + 본문.
 */
export class ChatMessagePayloadDto extends ChatRoomPayloadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;
}
