import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtGuard } from 'src/guards/jwt.guard';
import { GetUser } from 'src/decorators/get-user.decorator';
import type { JwtPayload } from 'src/common/jwt-payload.interface';

@Controller('friend')
export class FriendController {
  constructor (
    private readonly friendService: FriendService,
  ) { };

  @UseGuards(JwtGuard)
  @Post('/')
  public async sendFriendRequest(@Query('userId') targetUserIdx: number, @GetUser() user: JwtPayload) {
    await this.friendService.sendFriendRequest(targetUserIdx, user.idx);
  }
}
