import { Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CallsService } from './calls.service';
import { JwtGuard } from 'src/guards/jwt.guard';
import { GetUser } from 'src/decorators/get-user.decorator';
import type { JwtPayload } from 'src/common/jwt-payload.interface';

@Controller({ path: '/calls', version: '1' })
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
  ) { };

  // 통화 참여
  @UseGuards(JwtGuard)
  @Post('/:roomIdx')
  async handleJoinCall(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.callsService.joinCall(roomIdx, user.idx);

    return {
      data: {
        call: data
      },
      message,
    };
  }

  // 통화 나가기
  @UseGuards(JwtGuard)
  @Delete('/:roomIdx')
  async handleLeaveCall(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.callsService.leaveCall(roomIdx, user.idx);

    return {
      data: {
        call: data
      },
      message,
    };
  }

  // 통화 참여자 조회
  @UseGuards(JwtGuard)
  @Get('/:roomIdx')
  async handleGetParticipantsByRoomIdx(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.callsService.getParticipantsByRoomIdx(roomIdx, user.idx);

    return {
      data: {
        call: data
      },
      message,
    };
  }
}
