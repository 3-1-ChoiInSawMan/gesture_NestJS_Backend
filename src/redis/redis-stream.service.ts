import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type StreamValue = string | number | boolean | Date | null | undefined | unknown[] | Record<string, unknown>;

@Injectable()
export class RedisStreamService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis(this.getRedisUrl(), {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
  }

  async xadd(
    streamKey: string,
    fields: Record<string, StreamValue>,
  ) {
    const entry = Object.entries(fields).flatMap(([key, value]) => [
      key,
      this.toStreamString(value),
    ]);

    const streamId = await this.redis.xadd(streamKey, '*', ...entry);

    if (!streamId) {
      throw new Error(`Failed to append Redis Stream entry: ${streamKey}`);
    }

    return streamId;
  }

  async onModuleDestroy() {
    this.redis.disconnect();
  }

  private getRedisUrl() {
    return this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  }

  private toStreamString(
    value: StreamValue,
  ) {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value) || typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }
}
