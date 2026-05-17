import { Module } from '@nestjs/common';
import { FriendControllerV1 } from './friend.controller';
import { FriendService } from './friend.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [FriendControllerV1],
  providers: [FriendService]
})
export class FriendModule {}
