import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CoreHttpModule } from 'src/core-http/core-http.module';
import { RedisModule } from 'src/redis/redis.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [
    CoreHttpModule,
    AuthModule,
    RedisModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
