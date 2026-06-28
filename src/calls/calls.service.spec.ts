import { CallsService } from './calls.service';

const mockSend = jest.fn();
const mockOn = jest.fn();
const mockWsInstances: Array<{ url: string; readyState: number }> = [];

jest.mock('ws', () => {
  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;

    readyState = MockWebSocket.OPEN;

    constructor(public readonly url: string) {
      mockWsInstances.push(this);
    }

    send = mockSend;
    on = mockOn;
  }

  return {
    __esModule: true,
    default: MockWebSocket,
  };
});

describe('CallsService audio relay', () => {
  const createService = (coreHttpService = {} as never) => {
    const service = new CallsService(
      coreHttpService,
      {
        getOrThrow: jest.fn().mockReturnValue('ws://ai.example'),
      } as never,
      {
        error: jest.fn(),
        log: jest.fn(),
        warn: jest.fn(),
      } as never,
    );

    return service;
  };

  const createClient = (callRoomIdx = 7) => ({
    id: 'socket-1',
    data: {
      callRoomIdx,
      user: {
        idx: 11,
      },
    },
    emit: jest.fn(),
    rooms: new Set(['socket-1', `call_room:${callRoomIdx}`]),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockWsInstances.length = 0;
  });

  it('sends audio payloads to the AI WebSocket', () => {
    const service = createService();
    const audio = Buffer.from([1, 2, 3]);

    service.sendAudio(
      {
        audio,
        callRoomIdx: 7,
      },
      createClient() as never,
    );

    expect(mockWsInstances).toHaveLength(1);
    expect(mockWsInstances[0].url).toBe('ws://ai.example/cc?debug=1&ignore_hands_down=1');
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockSend.mock.calls[0][0])).toEqual({
      audio: {
        type: 'Buffer',
        data: [1, 2, 3],
      },
      callRoomIdx: 7,
    });
    expect(mockSend.mock.calls[0][1]).toEqual(expect.any(Function));
  });

  it('emits AI audio responses as audio translations to the call room', () => {
    const service = createService();
    const roomEmit = jest.fn();
    const server = {
      to: jest.fn().mockReturnValue({
        emit: roomEmit,
      }),
    };

    service.setServer(server as never);

    service.sendAudio(
      {
        audio: Buffer.from([9, 8, 7]),
        callRoomIdx: 7,
      },
      createClient() as never,
    );

    service['handleAiMessage'](
      Buffer.from(JSON.stringify({
        callRoomIdx: 7,
        text: 'hello audio',
      })),
    );

    expect(server.to).toHaveBeenCalledWith('call_room:7');
    expect(roomEmit).toHaveBeenCalledWith('audio_translation', {
      callRoomIdx: 7,
      text: 'hello audio',
    });
  });

  it('includes callIdx in the existing participants response when joining signaling room', async () => {
    const coreHttpService = {
      get: jest.fn().mockResolvedValue({
        data: {
          callIdx: 38,
          roomIdx: 7,
          participants: [
            {
              userIdx: 11,
              nickname: '현우',
              joinedAt: new Date(),
              isHost: true,
              host: true,
            },
          ],
          currentParticipant: 1,
        },
        message: 'ok',
      }),
    };
    const service = createService(coreHttpService as never);
    const roomEmit = jest.fn();
    const client = {
      id: 'socket-1',
      data: {
        user: {
          idx: 11,
          nickname: '현우',
        },
      },
      emit: jest.fn(),
      join: jest.fn((roomName: string) => client.rooms.add(roomName)),
      rooms: new Set(['socket-1']),
      to: jest.fn().mockReturnValue({
        emit: roomEmit,
      }),
    };

    await service.joinSignalingRoom(client as never, 7);

    expect(coreHttpService.get).toHaveBeenCalledWith('/calls/7/participants', {
      headers: {
        'X-User-Id': 11,
      },
    });
    expect(client.emit).toHaveBeenCalledWith('existing_participants', {
      callRoomIdx: 7,
      callIdx: 38,
      participants: [],
    });
  });
});
