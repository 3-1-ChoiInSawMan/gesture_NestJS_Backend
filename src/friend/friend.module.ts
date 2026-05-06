import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [HttpModule, JwtModule],
  controllers: [FriendController],
  providers: [FriendService]
})
export class FriendModule {}
