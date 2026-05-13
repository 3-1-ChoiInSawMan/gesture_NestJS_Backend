import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';
import { CallsGateway } from './calls.gateway';

@Module({
  imports: [
    HttpModule,
    AuthModule,
  ],
  controllers: [CallsController],
  providers: [
    CallsService,
    CallsGateway,
  ],
})
export class CallsModule {}
