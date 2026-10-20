import { EventEmitter } from 'node:events';
import { CallAiService } from './call-ai.service';

const mockSockets: Array<EventEmitter & { url: string; send: jest.Mock; terminate: jest.Mock }> = [];
jest.mock('ws', () => {
  const { EventEmitter: Emitter } = jest.requireActual<typeof import('node:events')>('node:events');
  class MockSocket extends Emitter {
    static OPEN = 1;
    readyState = 1;
    send = jest.fn();
    terminate = jest.fn(() => this.emit('close'));
    constructor(public url: string) { super(); mockSockets.push(this); }
  }
  return { __esModule: true, default: MockSocket };
});

describe('CallAiService', () => {
  let service: CallAiService;
  beforeEach(() => {
    mockSockets.length = 0;
    service = new CallAiService({ getOrThrow: () => 'ws://ai.example' } as never);
    service.onModuleInit();
  });
  afterEach(() => service.onModuleDestroy());

  it('preserves the upstream audio/frame protocol and correlates mixed responses', () => {
    const translated = jest.fn();
    service.onTranslation(translated);
    service.send('audio', 7, Buffer.from([1, 2]), 'session-a');
    service.send('frame', 7, [[0, 1]], 'session-a');
    expect(mockSockets[0].url).toBe('ws://ai.example/cc?debug=1&ignore_hands_down=1');
    expect(JSON.parse(mockSockets[0].send.mock.calls[0][0] as string)).toEqual({
      audio: { type: 'Buffer', data: [1, 2] }, callRoomIdx: 7,
    });
    mockSockets[0].emit('message', Buffer.from(JSON.stringify({ callRoomIdx: 7, text: 'audio' })));
    mockSockets[0].emit('message', Buffer.from(JSON.stringify({ callRoomIdx: 7, text: 'frame' })));
    expect(translated.mock.calls.map(([event]) => event.source)).toEqual(['audio', 'frame']);
  });

  it('keeps the old session identity on late responses', () => {
    const translated = jest.fn();
    service.onTranslation(translated);
    service.send('audio', 7, Buffer.from([1]), 'old');
    service.send('audio', 7, Buffer.from([2]), 'new');
    mockSockets[0].emit('message', Buffer.from(JSON.stringify({ callRoomIdx: 7, text: 'late' })));
    expect(translated).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'old' }));
  });

  it('bounds pending requests without evicting earlier correlations', () => {
    for (let i = 0; i < 256; i++) service.send('audio', 7, Buffer.from([1]), 'a');
    expect(service.send('audio', 7, Buffer.from([1]), 'a')).toEqual({ accepted: false });
    expect(mockSockets[0].send).toHaveBeenCalledTimes(256);
  });

  it('cancels reconnect on shutdown', () => {
    jest.useFakeTimers();
    mockSockets[0].emit('close');
    service.onModuleDestroy();
    jest.runOnlyPendingTimers();
    expect(mockSockets).toHaveLength(1);
    jest.useRealTimers();
  });
});
