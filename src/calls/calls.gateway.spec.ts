import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import type { AddressInfo } from 'node:net';
import { AuthService } from '../auth/auth.service';
import { CoreHttpService } from '../core-http/core-http.service';
import { SfuModule } from '../sfu/sfu.module';
import { CallsGateway } from './calls.gateway';
import { CallsService } from './calls.service';
import { CallStateService } from './call-state.service';
import { CallAiService } from './call-ai.service';

class TestClient {
  private sequence = 0;
  private readonly callbacks = new Map<number, (response: unknown) => void>();
  private readonly eventCallbacks = new Map<string, (payload: unknown) => void>();
  private readonly socket: WebSocket;
  readonly ready: Promise<void>;

  constructor(port: number, token = 'test') {
    this.socket = new WebSocket(`ws://127.0.0.1:${port}/socket.io/?EIO=4&transport=websocket`);
    this.ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket auth timed out')), 3_000);
      this.socket.on('error', (error) => { clearTimeout(timer); reject(error); });
      this.socket.on('message', (raw) => {
        const message = raw.toString();
        if (message.startsWith('0')) this.socket.send(`40/calls,${JSON.stringify({ token })}`);
        if (message === '2') this.socket.send('3');
        if (message.startsWith('42/calls,')) {
          const [event, payload] = JSON.parse(message.slice('42/calls,'.length)) as [string, unknown];
          if (event === 'calls_ready') { clearTimeout(timer); resolve(); }
          this.eventCallbacks.get(event)?.(payload);
          this.eventCallbacks.delete(event);
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

  nextEvent(event: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.eventCallbacks.delete(event); reject(new Error(`${event} timed out`)); }, 3_000);
      this.eventCallbacks.set(event, (payload) => { clearTimeout(timer); resolve(payload); });
    });
  }

  close(): void { this.socket.terminate(); }
}

describe('CallsGateway Socket.IO integration', () => {
  let app: INestApplication;
  let client: TestClient;
  let viewer: TestClient;

  afterEach(async () => { client?.close(); viewer?.close(); await app?.close(); });

  it('serves SFU requests and returns validation/ownership errors through ACKs', async () => {
    const module = await Test.createTestingModule({
      imports: [SfuModule],
      providers: [CallsGateway, CallsService, CallStateService,
        { provide: AuthService, useValue: { verifyToken: async (token: string) => ({ idx: token === 'test-b' ? 12 : 11, exp: Date.now() / 1000 + 3600 }) } },
        { provide: CoreHttpService, useValue: {
          get: async () => ({ data: { participants: [{ userIdx: 11, nickname: 'A' }, { userIdx: 12, nickname: 'B' }] } }),
          post: async () => ({ data: {}, message: 'ok' }),
        } },
        { provide: CallAiService, useValue: { onTranslation: () => () => undefined } },
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
    const send = await client.request('create_transport', { direction: 'send' });
    expect(send).toMatchObject({ ok: true, data: { id: expect.any(String) } });
    expect(await client.request('close_transport', { transportId: 'someone-elses-id' })).toMatchObject({ ok: false });
    viewer = new TestClient(address.port, 'test-b');
    await viewer.ready;
    expect(await viewer.request('join_call', { callRoomIdx: 7 })).toMatchObject({ ok: true });
    const announced = viewer.nextEvent('new_producer');
    const produced = await client.request('produce', {
      transportId: send.data.id, kind: 'video', mediaTag: 'camera',
      rtpParameters: {
        codecs: [{ mimeType: 'video/VP8', payloadType: 96, clockRate: 90000 }],
        encodings: [{ ssrc: 22222222 }], rtcp: { cname: 'test-camera' },
      },
    });
    expect(produced).toMatchObject({ ok: true, data: { id: expect.any(String) } });
    await expect(announced).resolves.toMatchObject({ producerId: produced.data.id, mediaTag: 'camera' });
    expect(await viewer.request('get_producers')).toMatchObject({
      ok: true, data: [expect.objectContaining({ producerId: produced.data.id })],
    });
    const receive = await viewer.request('create_transport', { direction: 'recv' });
    const consumed = await viewer.request('consume', {
      transportId: receive.data.id, producerId: produced.data.id,
      rtpCapabilities: joined.data.rtpCapabilities,
    });
    expect(consumed).toMatchObject({ ok: true, data: { producerId: produced.data.id, mediaTag: 'camera' } });
    expect(await viewer.request('resume_consumer', { consumerId: consumed.data.id }))
      .toMatchObject({ ok: true, data: { resumed: true } });
    expect(await client.request('leave_call', { callRoomIdx: 7 })).toMatchObject({ ok: true, data: { left: true } });
    expect(await client.request('get_call_state')).toMatchObject({ ok: false });
  });
});
