import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import type { DtlsParameters, MediaTag, RtpCapabilities, RtpParameters, TransportDirection } from '../../sfu/sfu.types';

export class CreateTransportDto {
  @IsIn(['send', 'recv'])
  direction: TransportDirection;
}
export class TransportIdDto {
  @IsString()
  transportId: string;
}
export class ConnectTransportDto extends TransportIdDto {
  @IsObject()
  dtlsParameters: DtlsParameters;
}
export class ProduceDto extends TransportIdDto {
  @IsIn(['audio', 'video'])
  kind: 'audio' | 'video';
  @IsObject()
  rtpParameters: RtpParameters;
  @IsIn(['audio', 'camera', 'screen'])
  mediaTag: MediaTag;
}
export class ConsumeDto extends TransportIdDto {
  @IsString()
  producerId: string;
  @IsObject()
  rtpCapabilities: RtpCapabilities;
}
export class ProducerIdDto {
  @IsString()
  producerId: string;
}
export class SetProducerPausedDto extends ProducerIdDto {
  @IsBoolean()
  paused: boolean;
}
export class ConsumerIdDto {
  @IsString()
  consumerId: string;
}
export class PreferredLayersDto extends ConsumerIdDto {
  @IsInt()
  @Min(0)
  @Max(7)
  spatialLayer: number;
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7)
  temporalLayer?: number;
}
