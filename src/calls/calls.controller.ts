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

  @UseGuards(JwtGuard)
  @Post('/:roomIdx/join')
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

  @UseGuards(JwtGuard)
  @Delete('/:roomIdx/leave')
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

  @UseGuards(JwtGuard)
  @Get('/:roomIdx/state')
  async handleGetCallState(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    return { data: { call: await this.callsService.getCallState(roomIdx, user.idx) } };
  }

  @UseGuards(JwtGuard)
  @Get('/:roomIdx/participants')
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
