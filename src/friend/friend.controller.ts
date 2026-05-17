import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtGuard } from 'src/guards/jwt.guard';
import { GetUser } from 'src/decorators/get-user.decorator';
import type { JwtPayload } from 'src/common/jwt-payload.interface';

@Controller({ path: '/friend', version: '1' })
export class FriendControllerV1 {
  constructor(
    private readonly friendService: FriendService,
  ) { };

  @UseGuards(JwtGuard)
  @Post()
  public async sendFriendRequest(@Query('userIdx') targetUserIdx: number, @GetUser() user: JwtPayload) {
    return this.friendService.sendFriendRequest(targetUserIdx, user.idx);
  }

  @UseGuards(JwtGuard)
  @Get()
  public async getPendingFriendRequests(@GetUser() user: JwtPayload) {
    return this.friendService.getPendingFriendRequests(user.idx);
  }

  @UseGuards(JwtGuard)
  @Post('/accept')
  public async acceptFriendRequest(@Query('friendshipIdx') friendshipIdx: number, @GetUser() user: JwtPayload) {
    return this.friendService.acceptFriendRequest(user.idx, friendshipIdx);
  }

  @UseGuards(JwtGuard)
  @Post('/reject')
  public async rejectFriendRequest(@Query('friendshipIdx') friendshipIdx: number, @GetUser() user: JwtPayload) {
    return this.friendService.rejectFriendRequest(user.idx, friendshipIdx);
  }
}
