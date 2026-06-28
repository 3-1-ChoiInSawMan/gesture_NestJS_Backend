import { MeetingsService } from './meetings.service';

describe('MeetingsService Redis Stream publishing', () => {
  const createService = () => {
    const coreHttpService = {
      get: jest.fn().mockResolvedValue({
        data: {
          callIdx: 38,
          roomIdx: 5,
          participants: [],
          currentParticipant: 1,
        },
        message: 'ok',
      }),
      post: jest.fn().mockResolvedValue({
        data: {
          minutesIdx: 1,
          callIdx: 38,
          roomIdx: 5,
          status: 'IN_PROGRESS',
        },
        message: '회의록이 시작되었습니다.',
      }),
    };

    const redisStreamService = {
      xadd: jest.fn().mockResolvedValue('1-0'),
    };

    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'REDIS_MEETING_STREAM_KEY') {
          return 'meeting-stream';
        }

        return undefined;
      }),
    };

    const service = new MeetingsService(
      coreHttpService as never,
      redisStreamService as never,
      configService as never,
    );

    return {
      service,
      coreHttpService,
      redisStreamService,
    };
  };

  it('resolves callIdx by roomIdx before publishing meeting minutes data', async () => {
    const { service, coreHttpService, redisStreamService } = createService();

    const response = await service.createMeetingMinutes(
      5,
      {
        title: '프로젝트 회의',
        transcript: ['안녕하세요', '회의를 시작합니다'],
        participants: ['윤정', '현우'],
        aiSummary: '프로젝트 일정 논의',
        conclusion: ['개발 완료 목표 6월'],
      },
      7,
    );

    expect(coreHttpService.get).toHaveBeenCalledWith('/calls/5/participants', {
      headers: {
        'X-User-Id': 7,
      },
    });
    expect(redisStreamService.xadd).toHaveBeenCalledWith('meeting-stream', {
      call_idx: 38,
      user_idx: 7,
      title: '프로젝트 회의',
      transcript: ['안녕하세요', '회의를 시작합니다'],
      participants: ['윤정', '현우'],
      ai_summary: '프로젝트 일정 논의',
      conclusion: ['개발 완료 목표 6월'],
    });
    expect(response).toEqual({
      data: {
        streamKey: 'meeting-stream',
        streamId: '1-0',
        callIdx: 38,
      },
      message: '회의록 저장 요청이 발행되었습니다.',
    });
  });

  it('resolves callIdx by roomIdx before starting meeting minutes', async () => {
    const { service, coreHttpService } = createService();

    const response = await service.startMeeting(5, 7);

    expect(coreHttpService.get).toHaveBeenCalledWith('/calls/5/participants', {
      headers: {
        'X-User-Id': 7,
      },
    });
    expect(coreHttpService.post).toHaveBeenCalledWith('/meetings/start/calls/38', undefined, {
      headers: {
        'X-User-Id': 7,
      },
    });
    expect(response).toEqual({
      data: {
        minutesIdx: 1,
        callIdx: 38,
        roomIdx: 5,
        status: 'IN_PROGRESS',
      },
      message: '회의록이 시작되었습니다.',
    });
  });
});
