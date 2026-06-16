import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { AuthModule } from 'src/auth/auth.module';
import { CallsGateway } from './calls.gateway';
import { CoreHttpModule } from 'src/core-http/core-http.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [
    CoreHttpModule,
    AuthModule,
  ],
  controllers: [CallsController],
  providers: [
    CallsService,
    CallsGateway,
    ChatService,
    ChatGateway,
  ],
})
export class CallsModule {}
