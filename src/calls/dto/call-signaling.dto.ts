import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CallRoomPayloadDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  callRoomIdx: number;
}

export class SignalingPayloadDto extends CallRoomPayloadDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  sdp?: string;

  @IsOptional()
  @IsString()
  candidate?: string;

  @IsOptional()
  @IsString()
  sdpMid?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sdpMLineIndex?: number | null;
}
