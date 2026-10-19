import { CallsService } from './calls.service';
import { CallStateService } from './call-state.service';
import type { Socket } from 'socket.io';
import type { SfuNotification } from '../sfu/sfu.types';
import type { Translation } from './call-ai.service';

function socket(id: string, userIdx = 11) {
  const client = {
    id, connected: true, rooms: new Set([id]),
    data: { user: { idx: userIdx, exp: Date.now() / 1000 + 3600 }, callRoomIdx: undefined as number | undefined },
    emit: jest.fn(), to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    join: jest.fn((room: string) => { client.rooms.add(room); }),
    leave: jest.fn((room: string) => { client.rooms.delete(room); }),
  };
  return client as typeof client & Socket;
}

describe('CallsService lifecycle', () => {
  const setup = () => {
    const state = new CallStateService();
    let mediaListener: (event: SfuNotification) => void;
    let aiListener: (event: Translation) => void;
    const sfu = {
      join: jest.fn().mockResolvedValue({ rtpCapabilities: {}, existingProducers: [] }),
      leave: jest.fn().mockResolvedValue(undefined), closeRoom: jest.fn(), listProducers: jest.fn().mockReturnValue([]),
      createTransport: jest.fn().mockResolvedValue({ id: 'transport' }),
      produce: jest.fn(),
      setProducerPaused: jest.fn(),
      onNotification: jest.fn((listener) => { mediaListener = listener; return jest.fn(); }),
    };
    const ai = { send: jest.fn(), onTranslation: jest.fn((listener) => { aiListener = listener; return jest.fn(); }) };
    const core = {
      get: jest.fn().mockResolvedValue({ data: { participants: [{ userIdx: 11, nickname: 'A' }, { userIdx: 12, nickname: 'B' }] } }),
      post: jest.fn().mockResolvedValue({ data: {}, message: 'ok' }),
    };
    const service = new CallsService(core as never, sfu as never, state, ai as never, { error: jest.fn() } as never);
    const emit = jest.fn();
    service.setServer({ to: () => ({ emit }) } as never);
    service.onModuleInit();
    return { service, state, sfu, core, emit, media: (event: SfuNotification) => mediaListener(event), ai: (event: Translation) => aiListener(event) };
  };

  it('transitions waiting -> active -> waiting -> ended', async () => {
    const { service, state, sfu } = setup();
    const a = socket('a'); const b = socket('b', 12);
    await service.joinSession(a, 7);
    expect(state.snapshot(7).status).toBe('waiting');
    await service.joinSession(b, 7);
    expect(state.snapshot(7).status).toBe('active');
    await service.leaveSession(a, 7);
    expect(state.snapshot(7).status).toBe('waiting');
    await service.leaveSession(b, 7);
    expect(state.snapshot(7)).toMatchObject({ status: 'ended', sessionId: null, participants: [] });
    expect(sfu.leave).toHaveBeenCalledTimes(2);
  });

  it('rejects nonparticipants without evicting their current call', async () => {
    const { service, state, core, sfu } = setup();
    const a = socket('a');
    await service.joinSession(a, 7);
    core.get.mockResolvedValueOnce({ data: { participants: [] } });
    await expect(service.joinSession(a, 8)).rejects.toThrow('REST API');
    expect(state.forSocket('a')?.callRoomIdx).toBe(7);
    expect(sfu.leave).not.toHaveBeenCalled();
  });

  it('replaces the old socket without an old disconnect removing the replacement', async () => {
    const { service, state, core } = setup();
    const old = socket('old'); const replacement = socket('new');
    await service.joinSession(old, 7);
    await service.joinSession(replacement, 7);
    old.connected = false;
    await service.disconnectSocket(old);
    expect(state.snapshot(7).participants.map((peer) => peer.socketId)).toEqual(['new']);
    expect(core.post).not.toHaveBeenCalled();
  });

  it('cleans up even when Socket.IO has already cleared its rooms', async () => {
    const { service, state, sfu, core } = setup();
    const a = socket('a');
    await service.joinSession(a, 7);
    a.rooms.clear(); a.connected = false;
    core.post.mockRejectedValueOnce(new Error('core offline'));
    await service.disconnectSocket(a);
    expect(sfu.leave).toHaveBeenCalledWith('7', 'a');
    expect(state.snapshot(7).status).toBe('ended');
  });

  it('rolls back media when the socket disconnects during allocation', async () => {
    const { service, state, sfu, core } = setup();
    const a = socket('a');
    sfu.join.mockImplementationOnce(async () => { a.connected = false; return {}; });
    await expect(service.joinSession(a, 7)).rejects.toThrow('disconnected');
    expect(sfu.leave).toHaveBeenCalledWith('7', 'a');
    expect(state.forSocket('a')).toBeUndefined();
    expect(core.post).toHaveBeenCalledWith('/calls/7/leave', undefined, { headers: { 'X-User-Id': 11 } });
  });

  it('releases Core membership when disconnect happens during authorization', async () => {
    const { service, core, sfu } = setup(); const a = socket('a');
    core.get.mockImplementationOnce(async () => {
      a.connected = false;
      return { data: { participants: [{ userIdx: 11, nickname: 'A' }] } };
    });
    await expect(service.joinSession(a, 7)).rejects.toThrow('disconnected');
    expect(sfu.join).not.toHaveBeenCalled();
    expect(core.post).toHaveBeenCalledWith('/calls/7/leave', undefined, { headers: { 'X-User-Id': 11 } });
  });

  it('prevents an in-flight authorized join from reviving a deleted room', async () => {
    const { service, sfu, state } = setup(); const a = socket('a');
    sfu.join.mockImplementationOnce(async () => {
      await service.closeRoom(7);
      return { rtpCapabilities: {}, existingProducers: [] };
    });
    await expect(service.joinSession(a, 7)).rejects.toThrow('deleted');
    expect(state.snapshot(7).status).toBe('ended');
    expect(sfu.leave).toHaveBeenCalledWith('7', 'a');
  });

  it('rejects media operations before join and after leave', async () => {
    const { service, sfu } = setup(); const a = socket('a');
    await expect(service.createTransport(a, { direction: 'send' })).rejects.toThrow('Join a call first');
    await service.joinSession(a, 7);
    await service.createTransport(a, { direction: 'send' });
    expect(sfu.createTransport).toHaveBeenCalledWith('7', 'a', 'send');
    await service.leaveSession(a, 7);
    await expect(service.createTransport(a, { direction: 'send' })).rejects.toThrow('Join a call first');
  });

  it('announces a camera started after both peers joined and exposes it for resync', async () => {
    const { service, sfu, media, emit } = setup();
    const sender = socket('a'); const viewer = socket('b', 12);
    await service.joinSession(sender, 7);
    await service.joinSession(viewer, 7);
    const producer = { producerId: 'camera-1', peerId: 'a', kind: 'video', mediaTag: 'camera', paused: false };
    sfu.produce.mockResolvedValueOnce(producer);
    sfu.listProducers.mockReturnValue([producer]);

    expect(await service.produce(sender, { transportId: 'send', kind: 'video', mediaTag: 'camera', rtpParameters: {} } as never))
      .toEqual({ id: 'camera-1' });
    expect(sender.to('call_room:7').emit).toHaveBeenCalledWith('new_producer', producer);
    expect(await service.listProducers(viewer)).toEqual([producer]);

    media({ roomId: '7', event: 'producer_resumed', data: { producerId: 'camera-1', peerId: 'a' } });
    expect(emit).toHaveBeenCalledWith('producer_resumed', {
      callRoomIdx: 7, producerId: 'camera-1', peerId: 'a',
    });
  });

  it('HTTP leave also removes the active media session', async () => {
    const { service, state, sfu } = setup();
    await service.joinSession(socket('a'), 7);
    await service.leaveCall(7, 11);
    expect(sfu.leave).toHaveBeenCalledWith('7', 'a');
    expect(state.snapshot(7).status).toBe('ended');
  });

  it('invalidates sessions when a media worker closes its router', async () => {
    const { service, state, media } = setup(); const a = socket('a');
    await service.joinSession(a, 7);
    media({ roomId: '7', event: 'media_room_closed', data: {} });
    expect(state.snapshot(7).status).toBe('ended');
    expect(a.emit).toHaveBeenCalledWith('media_room_closed', { callRoomIdx: 7 });
  });

  it('does not publish a translation from an ended session into a new call', async () => {
    const { service, state, ai, emit } = setup(); const a = socket('a');
    await service.joinSession(a, 7);
    const previousId = state.snapshot(7).sessionId!;
    await service.leaveSession(a, 7);
    await service.joinSession(a, 7);
    emit.mockClear();
    ai({ source: 'audio', callRoomIdx: 7, sessionId: previousId, text: 'late' });
    expect(emit).not.toHaveBeenCalled();
  });
});
