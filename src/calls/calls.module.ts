import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { AuthModule } from 'src/auth/auth.module';
import { CallsGateway } from './calls.gateway';
import { CoreHttpModule } from 'src/core-http/core-http.module';
import { ChatRoomsModule } from 'src/chat-rooms/chat-rooms.module';
import { ConfigModule } from '@nestjs/config';
import { SfuModule } from '../sfu/sfu.module';
import { MediasModule } from '../medias/medias.module';
import { CallStateService } from './call-state.service';
import { CallAiService } from './call-ai.service';
import { CallRoomsService } from './rooms/call-rooms.service';
import { CallRoomsController } from './rooms/call-rooms.controller';

@Module({
  imports: [
    CoreHttpModule,
    AuthModule,
    ChatRoomsModule,
    ConfigModule,
    MediasModule,
    SfuModule,
  ],
  controllers: [CallsController, CallRoomsController],
  providers: [
    CallsService,
    CallsGateway,
    CallStateService,
    CallAiService,
    CallRoomsService,
  ],
})
export class CallsModule {}
