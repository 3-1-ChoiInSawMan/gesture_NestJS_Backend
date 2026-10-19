import { ConfigService } from '@nestjs/config';
import { WorkerManager } from './worker-manager.service';
import { SfuService } from './sfu.service';
import type { RtpCapabilities, RtpParameters } from './sfu.types';

describe('SFU native resource lifecycle', () => {
  let workers: WorkerManager;
  let sfu: SfuService;
  let capabilities: RtpCapabilities;
  const audio: RtpParameters = {
    codecs: [{ mimeType: 'audio/opus', payloadType: 111, clockRate: 48000, channels: 2 }],
    encodings: [{ ssrc: 11111111 }], rtcp: { cname: 'test-audio' },
  };

  beforeEach(async () => {
    const config = new ConfigService({
      MEDIASOUP_WORKERS: 1, WEBRTC_LISTEN_IP: '127.0.0.1',
      MEDIASOUP_MIN_PORT: 24000, MEDIASOUP_MAX_PORT: 24999,
    });
    workers = new WorkerManager(config);
    await workers.onModuleInit();
    sfu = new SfuService(workers, config);
    ({ rtpCapabilities: capabilities } = await sfu.join('room', 'sender'));
    await sfu.join('room', 'viewer');
  });
  afterEach(() => { sfu?.onModuleDestroy(); workers?.onModuleDestroy(); });

  async function producer() {
    const transport = await sfu.createTransport('room', 'sender', 'send');
    return sfu.produce('room', 'sender', { transportId: transport.id, kind: 'audio', mediaTag: 'audio', rtpParameters: audio });
  }

  it('shares the router and one transport per direction for concurrent requests', async () => {
    const [a, b] = await Promise.all([
      sfu.createTransport('room', 'sender', 'send'),
      sfu.createTransport('room', 'sender', 'send'),
    ]);
    expect(a.id).toBe(b.id);
    expect(await sfu.connectTransport('room', 'sender', a.id, {
      role: 'client', fingerprints: [{ algorithm: 'sha-256', value: Array(32).fill('AA').join(':') }],
    })).toEqual({ connected: true });
    const dump = await workers.getWorker().dump();
    expect(dump.routerIds).toHaveLength(1);
  });

  it('advertises the externally reachable address in ICE candidates', async () => {
    const config = new ConfigService({
      MEDIASOUP_WORKERS: 1, WEBRTC_LISTEN_IP: '0.0.0.0', WEBRTC_ANNOUNCED_IP: '203.0.113.10',
      MEDIASOUP_MIN_PORT: 23000, MEDIASOUP_MAX_PORT: 23999,
    });
    const externalWorkers = new WorkerManager(config);
    await externalWorkers.onModuleInit();
    const externalSfu = new SfuService(externalWorkers, config);
    try {
      await externalSfu.join('external-room', 'peer');
      const transport = await externalSfu.createTransport('external-room', 'peer', 'recv');
      expect(transport.iceCandidates).not.toHaveLength(0);
      expect(transport.iceCandidates.every((candidate) => candidate.ip === '203.0.113.10')).toBe(true);
    } finally {
      externalSfu.onModuleDestroy();
      externalWorkers.onModuleDestroy();
    }
  });

  it('produces, consumes, resumes, pauses, restarts ICE and closes native resources', async () => {
    const source = await producer();
    const receive = await sfu.createTransport('room', 'viewer', 'recv');
    const input = { transportId: receive.id, producerId: source.producerId, rtpCapabilities: capabilities };
    const consumer = await sfu.consume('room', 'viewer', input);
    const duplicate = await sfu.consume('room', 'viewer', input);
    expect(duplicate.id).toBe(consumer.id);
    expect(consumer).toMatchObject({ peerId: 'sender', mediaTag: 'audio', kind: 'audio' });
    expect(await sfu.resumeConsumer('room', 'viewer', consumer.id)).toEqual({ resumed: true });
    expect(await sfu.setProducerPaused('room', 'sender', source.producerId, true)).toEqual({ paused: true });
    expect(await sfu.setProducerPaused('room', 'sender', source.producerId, false)).toEqual({ paused: false });
    const restarted = await sfu.restartIce('room', 'viewer', receive.id);
    expect(restarted.iceParameters.usernameFragment).not.toBe(receive.iceParameters.usernameFragment);
    const notification = jest.fn();
    sfu.onNotification(notification);
    const consumerClosed = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { unsubscribe(); reject(new Error('consumer_closed was not emitted')); }, 2_000);
      const unsubscribe = sfu.onNotification((event) => {
        if (event.event !== 'consumer_closed') return;
        clearTimeout(timer); unsubscribe(); resolve();
      });
    });
    await sfu.closeResource('room', 'sender', 'producer', source.producerId);
    await consumerClosed;
    expect(notification).toHaveBeenCalledWith(expect.objectContaining({ event: 'producer_closed' }));
    expect(sfu.listProducers('room', 'viewer')).toEqual([]);
    await sfu.leave('room', 'sender');
    await sfu.leave('room', 'viewer');
    expect((await workers.getWorker().dump()).routerIds).toEqual([]);
  });

  it('rejects cross-peer transports, wrong directions and foreign producers', async () => {
    const send = await sfu.createTransport('room', 'sender', 'send');
    await expect(sfu.produce('room', 'viewer', { transportId: send.id, kind: 'audio', mediaTag: 'audio', rtpParameters: audio }))
      .rejects.toThrow('Transport');
    const receive = await sfu.createTransport('room', 'sender', 'recv');
    await expect(sfu.produce('room', 'sender', { transportId: receive.id, kind: 'audio', mediaTag: 'audio', rtpParameters: audio }))
      .rejects.toThrow('direction');
    const source = await producer();
    await sfu.join('other', 'stranger');
    const foreign = await sfu.createTransport('other', 'stranger', 'recv');
    await expect(sfu.consume('other', 'stranger', { transportId: foreign.id, producerId: source.producerId, rtpCapabilities: capabilities }))
      .rejects.toThrow('cannot be consumed');
  });

  it('cleans up a producer created concurrently with leave', async () => {
    const send = await sfu.createTransport('room', 'sender', 'send');
    await Promise.all([
      sfu.produce('room', 'sender', { transportId: send.id, kind: 'audio', mediaTag: 'audio', rtpParameters: audio }),
      sfu.leave('room', 'sender'),
    ]);
    expect(sfu.listProducers('room', 'viewer')).toEqual([]);
    await sfu.leave('room', 'viewer');
    expect((await workers.getWorker().dump()).routerIds).toEqual([]);
  });

  it('allows a closed transport to be recreated and rejects duplicate media sources', async () => {
    const first = await sfu.createTransport('room', 'sender', 'send');
    await producer();
    await expect(sfu.produce('room', 'sender', { transportId: first.id, kind: 'audio', mediaTag: 'audio', rtpParameters: audio }))
      .rejects.toThrow('existing producer');
    await sfu.closeResource('room', 'sender', 'transport', first.id);
    const second = await sfu.createTransport('room', 'sender', 'send');
    expect(second.id).not.toBe(first.id);
    expect(sfu.listProducers('room', 'viewer')).toEqual([]);
    await producer();
    expect(sfu.listProducers('room', 'viewer')).toHaveLength(1);
  });

  it('notifies calls when a Worker closes and rejects stale media operations', async () => {
    const notification = jest.fn();
    sfu.onNotification(notification);
    workers.getWorker().close();
    expect(notification).toHaveBeenCalledWith(expect.objectContaining({ event: 'media_room_closed', roomId: 'room' }));
    await expect(sfu.createTransport('room', 'sender', 'send')).rejects.toThrow('not joined');
  });
});
