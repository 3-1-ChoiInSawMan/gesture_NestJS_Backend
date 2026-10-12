import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWorker } from 'mediasoup';
import type { Worker } from 'mediasoup/types';
import { availableParallelism } from 'node:os';
import { integerSetting, transportOptions } from './sfu.config';

@Injectable()
export class WorkerManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerManager.name);
  private readonly workers: Worker[] = [];
  private readonly retries = new Set<NodeJS.Timeout>();
  private next = 0;
  private stopping = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    transportOptions(this.config);
    const count = integerSetting(this.config, 'MEDIASOUP_WORKERS', Math.min(2, availableParallelism()), 1, 64);
    try {
      for (let i = 0; i < count; i++) await this.spawn();
    } catch (error) {
      this.onModuleDestroy();
      throw error;
    }
  }

  getWorker(): Worker {
    if (!this.workers.length || this.stopping) throw new Error('SFU workers are unavailable');
    return this.workers[this.next++ % this.workers.length];
  }

  private async spawn(): Promise<void> {
    const worker = await createWorker({ logLevel: 'warn' });
    if (this.stopping) { worker.close(); return; }
    this.workers.push(worker);
    worker.on('died', (error) => {
      this.logger.error(`Worker ${worker.pid} died`, error);
      const index = this.workers.indexOf(worker);
      if (index !== -1) this.workers.splice(index, 1);
      this.scheduleReplacement();
    });
  }

  private scheduleReplacement(): void {
    if (this.stopping) return;
    const timer = setTimeout(() => {
      this.retries.delete(timer);
      void this.spawn().catch((error: unknown) => {
        this.logger.error('Worker replacement failed', error);
        this.scheduleReplacement();
      });
    }, 1_000);
    timer.unref();
    this.retries.add(timer);
  }

  onModuleDestroy(): void {
    this.stopping = true;
    for (const timer of this.retries) clearTimeout(timer);
    this.retries.clear();
    for (const worker of this.workers) worker.close();
    this.workers.length = 0;
  }
}
