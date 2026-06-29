import { IsIn, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator';

export type SendChatMessageType = 'TEXT' | 'FILE';

export class SendChatMessageDto {
  @IsIn(['TEXT', 'FILE'])
  type: SendChatMessageType;

  @ValidateIf((body: SendChatMessageDto) => body.type === 'TEXT')
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message?: string;

  @ValidateIf((body: SendChatMessageDto) => body.type === 'FILE' && !body.fileUuid)
  @IsUUID()
  file_uuid?: string;

  @ValidateIf((body: SendChatMessageDto) => body.type === 'FILE' && !body.file_uuid)
  @IsUUID()
  fileUuid?: string;
}
