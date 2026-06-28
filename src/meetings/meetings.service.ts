import { Injectable } from '@nestjs/common';
import { CoreHttpService } from 'src/core-http/core-http.service';
import { ConfigService } from '@nestjs/config';
import { RedisStreamService } from 'src/redis/redis-stream.service';
import { convertKeysToSnakeCase } from 'src/utils/convert-snake';
import type { GetCallParticipantsResponse } from 'src/calls/dto/core/response/GetCallParticipantsResponse.interface';
import { CreateMeetingMinutesDto } from './dto/request/create-meeting-minutes.dto';
import { UpdateMeetingMinutesDto } from './dto/request/update-meeting-minutes.dto';
import { MeetingMinutesResponse } from './dto/core/response/MeetingMinutesResponse.interface';
import { MeetingMinutesSummaryResponse } from './dto/core/response/MeetingMinutesSummaryResponse.interface';
import { PublishMeetingMinutesResponse } from './dto/response/publish-meeting-minutes-response.interface';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly coreHttpService: CoreHttpService,
    private readonly redisStreamService: RedisStreamService,
    private readonly configService: ConfigService,
  ) {};

  async startMeeting(
    roomIdx: number,
    userIdx: number,
  ) {
    const callIdx = await this.resolveCallIdxByRoomIdx(roomIdx, userIdx);

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
    roomIdx: number,
    body: CreateMeetingMinutesDto,
    userIdx: number,
  ) {
    const callIdx = await this.resolveCallIdxByRoomIdx(roomIdx, userIdx);
    const streamKey = this.getMeetingStreamKey();
    const streamId = await this.redisStreamService.xadd(streamKey, this.normalizeCreateBody(callIdx, body, userIdx));

    return {
      data: {
        streamKey,
        streamId,
        callIdx,
      } satisfies PublishMeetingMinutesResponse,
      message: '회의록 저장 요청이 발행되었습니다.',
    };
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
    callIdx: number,
    body: CreateMeetingMinutesDto,
    userIdx: number,
  ) {
    return {
      call_idx: callIdx,
      user_idx: userIdx,
      title: body.title,
      transcript: this.normalizeTranscript(body),
      participants: body.participants,
      ai_summary: body.aiSummary ?? body.ai_summary ?? '',
      conclusion: body.conclusion,
    };
  }

  private async resolveCallIdxByRoomIdx(
    roomIdx: number,
    userIdx: number,
  ) {
    const { data } = await this.coreHttpService.get<GetCallParticipantsResponse>(`/calls/${roomIdx}/participants`, {
      headers: {
        'X-User-Id': userIdx,
      },
    });

    return data.callIdx;
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

  private normalizeTranscript(
    body: CreateMeetingMinutesDto,
  ) {
    if (Array.isArray(body.transcript)) {
      return body.transcript;
    }

    return [body.content ?? body.transcript ?? ''];
  }

  private getMeetingStreamKey() {
    return this.configService.get<string>('REDIS_MEETING_STREAM_KEY') ?? 'meeting-stream';
  }
}
