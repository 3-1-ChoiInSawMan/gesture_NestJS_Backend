import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import type { JwtPayload } from 'src/common/jwt-payload.interface';
import { GetUser } from 'src/decorators/get-user.decorator';
import { JwtGuard } from 'src/guards/jwt.guard';
import { CreateMeetingMinutesDto } from './dto/request/create-meeting-minutes.dto';
import { UpdateMeetingMinutesDto } from './dto/request/update-meeting-minutes.dto';
import { MeetingsService } from './meetings.service';

@Controller({ path: '/meetings', version: '1' })
export class MeetingsController {
  constructor(
    private readonly meetingsService: MeetingsService,
  ) {};

  // 회의록 시작
  @UseGuards(JwtGuard)
  @Post('/start/calls/:callIdx')
  async handleStartMeeting(
    @Param('callIdx', new ParseIntPipe()) callIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.meetingsService.startMeeting(callIdx, user.idx);

    return {
      data,
      message,
    };
  }

  // 회의록 종료 및 요약
  @UseGuards(JwtGuard)
  @Get('/:minutesIdx/end')
  async handleEndMeeting(
    @Param('minutesIdx', new ParseIntPipe()) minutesIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.meetingsService.endMeeting(minutesIdx, user.idx);

    return {
      data,
      message,
    };
  }

  // 회의록 생성
  @UseGuards(JwtGuard)
  @Post('/calls/:callIdx')
  async handleCreateMeetingMinutes(
    @Param('callIdx', new ParseIntPipe()) callIdx: number,
    @Body() body: CreateMeetingMinutesDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.meetingsService.createMeetingMinutes(callIdx, body, user.idx);

    return {
      data,
      message,
    };
  }

  // 통화방 회의록 목록 조회
  @UseGuards(JwtGuard)
  @Get('/rooms/:roomIdx')
  async handleGetMeetingMinutesByRoomIdx(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.meetingsService.getMeetingMinutesByRoomIdx(roomIdx, user.idx);

    return {
      data,
      message,
    };
  }

  // 회의록 단건 조회
  @UseGuards(JwtGuard)
  @Get('/:minutesIdx')
  async handleGetMeetingMinutesByIdx(
    @Param('minutesIdx', new ParseIntPipe()) minutesIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.meetingsService.getMeetingMinutesByIdx(minutesIdx, user.idx);

    return {
      data,
      message,
    };
  }

  // 회의록 수정
  @UseGuards(JwtGuard)
  @Patch('/:minutesIdx')
  async handleUpdateMeetingMinutes(
    @Param('minutesIdx', new ParseIntPipe()) minutesIdx: number,
    @Body() body: UpdateMeetingMinutesDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.meetingsService.updateMeetingMinutes(minutesIdx, body, user.idx);

    return {
      data,
      message,
    };
  }
}
