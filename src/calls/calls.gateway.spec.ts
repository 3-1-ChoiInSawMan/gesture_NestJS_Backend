import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import WebSocket from 'ws';
import type { AddressInfo } from 'node:net';
import { AuthService } from '../auth/auth.service';
import { CoreHttpService } from '../core-http/core-http.service';
import { SfuModule } from '../sfu/sfu.module';
import { CallsGateway } from './calls.gateway';
import { CallsService } from './calls.service';
import { CallStateService } from './call-state.service';
import { CallAiService } from './call-ai.service';

// Minimal Engine.IO/Socket.IO client using the existing ws dependency.
// This exercises actual Nest validation, guards, interceptors and ACK framing.
class TestClient {
  private sequence = 0;
  private readonly callbacks = new Map<number, (response: unknown) => void>();
  private readonly socket: WebSocket;
  readonly ready: Promise<void>;

  constructor(port: number) {
    this.socket = new WebSocket(`ws://127.0.0.1:${port}/socket.io/?EIO=4&transport=websocket`);
    this.ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket auth timed out')), 3_000);
      this.socket.on('error', (error) => { clearTimeout(timer); reject(error); });
      this.socket.on('message', (raw) => {
        const message = raw.toString();
        if (message.startsWith('0')) this.socket.send('40/calls,{"token":"test"}');
        if (message === '2') this.socket.send('3');
        if (message.startsWith('42/calls,')) {
          const [event] = JSON.parse(message.slice('42/calls,'.length)) as unknown[];
          if (event === 'calls_ready') { clearTimeout(timer); resolve(); }
        }
        const ack = /^43\/calls,(\d+)(\[.*)$/s.exec(message);
        if (ack) {
          const id = Number(ack[1]);
          const [response] = JSON.parse(ack[2]) as unknown[];
          this.callbacks.get(id)?.(response);
          this.callbacks.delete(id);
        }
      });
    });
  }

  request(event: string, payload: unknown = {}): Promise<{ ok: boolean; data?: any; error?: { code: string; message: string } }> {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.callbacks.delete(id); reject(new Error(`${event} ACK timed out`)); }, 3_000);
      this.callbacks.set(id, (response) => { clearTimeout(timer); resolve(response as never); });
      this.socket.send(`42/calls,${id}${JSON.stringify([event, payload])}`);
    });
  }

  close(): void { this.socket.terminate(); }
}

describe('CallsGateway Socket.IO integration', () => {
  let app: INestApplication;
  let client: TestClient;

  afterEach(async () => { client?.close(); await app?.close(); });

  it('serves SFU requests and returns validation/ownership errors through ACKs', async () => {
    const module = await Test.createTestingModule({
      imports: [SfuModule],
      providers: [CallsGateway, CallsService, CallStateService,
        { provide: AuthService, useValue: { verifyToken: async () => ({ idx: 11, exp: Date.now() / 1000 + 3600 }) } },
        { provide: CoreHttpService, useValue: {
          get: async () => ({ data: { participants: [{ userIdx: 11, nickname: 'A' }] } }),
          post: async () => ({ data: {}, message: 'ok' }),
        } },
        { provide: CallAiService, useValue: { onTranslation: () => () => undefined } },
        { provide: Logger, useValue: { error: jest.fn(), log: jest.fn(), warn: jest.fn() } },
      ],
    }).overrideProvider(ConfigService).useValue(new ConfigService({
      MEDIASOUP_WORKERS: 1, MEDIASOUP_MIN_PORT: 25000, MEDIASOUP_MAX_PORT: 25999, WEBRTC_LISTEN_IP: '127.0.0.1',
    })).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as AddressInfo;
    client = new TestClient(address.port);
    await client.ready;

    expect(await client.request('create_transport', { direction: 'send' })).toMatchObject({ ok: false });
    const joined = await client.request('join_call', { callRoomIdx: 7 });
    expect(joined).toMatchObject({ ok: true, data: { state: { status: 'waiting' }, existingProducers: [] } });
    expect(joined.data.rtpCapabilities.codecs.length).toBeGreaterThan(0);
    expect(await client.request('create_transport', { direction: 'invalid' })).toMatchObject({ ok: false });
    expect(await client.request('create_transport', { direction: 'send', peerId: 'spoofed' })).toMatchObject({ ok: false });
    expect(await client.request('create_transport', { direction: 'send' })).toMatchObject({ ok: true, data: { id: expect.any(String) } });
    expect(await client.request('close_transport', { transportId: 'someone-elses-id' })).toMatchObject({ ok: false });
    expect(await client.request('leave_call', { callRoomIdx: 7 })).toMatchObject({ ok: true, data: { left: true } });
    expect(await client.request('get_call_state')).toMatchObject({ ok: false });
  });
});
