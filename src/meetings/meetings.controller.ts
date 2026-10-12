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

  @UseGuards(JwtGuard)
  @Post('/start/calls/:roomIdx')
  async handleStartMeetingByCallSpec(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.startMeeting(roomIdx, user);
  }

  @UseGuards(JwtGuard)
  @Post('/start/rooms/:roomIdx')
  async handleStartMeeting(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.startMeeting(roomIdx, user);
  }

  private async startMeeting(
    roomIdx: number,
    user: JwtPayload,
  ) {
    const { data, message } = await this.meetingsService.startMeeting(roomIdx, user.idx);

    return {
      data,
      message,
    };
  }

  @UseGuards(JwtGuard)
  @Post('/:minutesIdx/end')
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

  @UseGuards(JwtGuard)
  @Post('/calls/:roomIdx')
  async handleSaveMeetingMinutes(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @Body() body: CreateMeetingMinutesDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.meetingsService.saveMeetingMinutes(roomIdx, body, user.idx);

    return {
      data,
      message,
    };
  }

  @UseGuards(JwtGuard)
  @Post('/rooms/:roomIdx')
  async handleCreateMeetingMinutes(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @Body() body: CreateMeetingMinutesDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.meetingsService.createMeetingMinutes(roomIdx, body, user.idx);

    return {
      data,
      message,
    };
  }

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
