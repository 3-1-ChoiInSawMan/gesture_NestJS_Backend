import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CoreHttpModule } from 'src/core-http/core-http.module';
import { RedisModule } from 'src/redis/redis.module';
import { ChatRoomsController } from './chat-rooms.controller';
import { ChatRoomsService } from './chat-rooms.service';

@Module({
  imports: [
    AuthModule,
    CoreHttpModule,
    RedisModule,
  ],
  controllers: [ChatRoomsController],
  providers: [ChatRoomsService],
  exports: [ChatRoomsService],
})
export class ChatRoomsModule {}
