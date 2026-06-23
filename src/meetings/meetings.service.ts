import { Injectable } from '@nestjs/common';
import { CoreHttpService } from 'src/core-http/core-http.service';
import { convertKeysToSnakeCase } from 'src/utils/convert-snake';
import { CreateMeetingMinutesDto } from './dto/request/create-meeting-minutes.dto';
import { UpdateMeetingMinutesDto } from './dto/request/update-meeting-minutes.dto';
import { MeetingMinutesResponse } from './dto/core/response/MeetingMinutesResponse.interface';
import { MeetingMinutesSummaryResponse } from './dto/core/response/MeetingMinutesSummaryResponse.interface';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly coreHttpService: CoreHttpService,
  ) {};

  async startMeeting(
    callIdx: number,
    userIdx: number,
  ) {
    return this.coreHttpService.post<MeetingMinutesResponse>(`/meetings/start/calls/${callIdx}`, undefined, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async endMeeting(
    minutesIdx: number,
    userIdx: number,
  ) {
    return this.coreHttpService.get<MeetingMinutesResponse>(`/meetings/${minutesIdx}/end`, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async createMeetingMinutes(
    callIdx: number,
    body: CreateMeetingMinutesDto,
    userIdx: number,
  ) {
    const request = convertKeysToSnakeCase(this.normalizeCreateBody(body));

    return this.coreHttpService.post<MeetingMinutesResponse>(`/meetings/calls/${callIdx}`, request, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async getMeetingMinutesByRoomIdx(
    roomIdx: number,
    userIdx: number,
  ) {
    return this.coreHttpService.get<MeetingMinutesSummaryResponse[]>(`/meetings/rooms/${roomIdx}`, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async getMeetingMinutesByIdx(
    minutesIdx: number,
    userIdx: number,
  ) {
    return this.coreHttpService.get<MeetingMinutesResponse>(`/meetings/${minutesIdx}`, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async updateMeetingMinutes(
    minutesIdx: number,
    body: UpdateMeetingMinutesDto,
    userIdx: number,
  ) {
    const request = convertKeysToSnakeCase(this.normalizeUpdateBody(body));

    return this.coreHttpService.patch<MeetingMinutesResponse>(`/meetings/${minutesIdx}`, request, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  private normalizeCreateBody(
    body: CreateMeetingMinutesDto,
  ) {
    return {
      title: body.title,
      content: body.content ?? body.transcript,
      participants: body.participants,
      aiSummary: body.aiSummary ?? body.ai_summary,
      conclusion: body.conclusion,
    };
  }

  private normalizeUpdateBody(
    body: UpdateMeetingMinutesDto,
  ) {
    return {
      title: body.title,
      content: body.content,
      conclusion: body.conclusion,
    };
  }
}
