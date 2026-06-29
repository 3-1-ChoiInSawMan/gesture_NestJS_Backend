import { IsBoolean } from 'class-validator';

export class ReplyChatRoomInvitationDto {
  @IsBoolean()
  accept: boolean;
}
