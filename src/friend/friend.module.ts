import { Module } from '@nestjs/common';
import { FriendControllerV1 } from './friend.controller';
import { FriendService } from './friend.service';
import { AuthModule } from 'src/auth/auth.module';
import { CoreHttpModule } from 'src/core-http/core-http.module';

@Module({
  imports: [CoreHttpModule, AuthModule],
  controllers: [FriendControllerV1],
  providers: [FriendService]
})
export class FriendModule {}
