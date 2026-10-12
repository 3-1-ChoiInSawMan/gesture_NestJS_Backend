import type { Consumer, Producer, Router, WebRtcTransport } from 'mediasoup/types';
export type { DtlsParameters, RtpCapabilities, RtpParameters } from 'mediasoup/types';

export type TransportDirection = 'send' | 'recv';
export type MediaTag = 'audio' | 'camera' | 'screen';
export interface ProducerInfo {
  producerId: string;
  peerId: string;
  kind: 'audio' | 'video';
  mediaTag: MediaTag;
  paused: boolean;
}

export interface MediaPeer {
  transports: Map<string, { transport: WebRtcTransport; direction: TransportDirection; connected: boolean }>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

export interface MediaRoom {
  router: Router;
  peers: Map<string, MediaPeer>;
}

export interface SfuNotification {
  roomId: string;
  peerId?: string;
  event: 'producer_closed' | 'producer_paused' | 'producer_resumed' | 'consumer_closed' | 'transport_closed' | 'media_room_closed';
  data: Record<string, unknown>;
}
