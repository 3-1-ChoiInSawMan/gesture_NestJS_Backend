import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkerManager } from './worker-manager.service';
import { SfuService } from './sfu.service';

@Module({ imports: [ConfigModule], providers: [WorkerManager, SfuService], exports: [SfuService] })
export class SfuModule {}
