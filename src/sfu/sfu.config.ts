import type { RouterRtpCodecCapability, WebRtcTransportOptions } from 'mediasoup/types';
import { ConfigService } from '@nestjs/config';

export const MEDIA_CODECS: RouterRtpCodecCapability[] = [
  { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
  { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
];

export function integerSetting(config: ConfigService, key: string, fallback: number, min: number, max: number): number {
  const value = Number(config.get(key) ?? fallback);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function transportOptions(config: ConfigService): WebRtcTransportOptions {
  const ip = config.get<string>('WEBRTC_LISTEN_IP') ?? '127.0.0.1';
  const announcedAddress = config.get<string>('WEBRTC_ANNOUNCED_IP');
  if ((ip === '0.0.0.0' || ip === '::') && !announcedAddress) {
    throw new Error('WEBRTC_ANNOUNCED_IP is required when binding a wildcard address');
  }
  const min = integerSetting(config, 'MEDIASOUP_MIN_PORT', 6002, 1024, 65535);
  const max = integerSetting(config, 'MEDIASOUP_MAX_PORT', 6202, min, 65535);
  return {
    listenInfos: [
      { protocol: 'udp', ip, announcedAddress, portRange: { min, max } },
      { protocol: 'tcp', ip, announcedAddress, portRange: { min, max } },
    ],
    initialAvailableOutgoingBitrate: 1_000_000,
  };
}
