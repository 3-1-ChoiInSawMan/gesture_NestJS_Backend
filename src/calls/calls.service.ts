import { ForbiddenException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../common/jwt-payload.interface';
import { KeyedSerialExecutor } from '../common/keyed-serial-executor';
import { CoreHttpService } from '../core-http/core-http.service';
import { SfuService } from '../sfu/sfu.service';
import type { SfuNotification } from '../sfu/sfu.types';
import { CallAiService } from './call-ai.service';
import { CallStateService, type CallParticipant } from './call-state.service';
import type { GetCallParticipantsResponse } from './dto/core/response/GetCallParticipantsResponse.interface';
import type { JoinCallResponse } from './dto/core/response/JoinCallResponse.interface';
import type { LeaveCallResponse } from './dto/core/response/LeaveCallResponse.interface';
import type { ConnectTransportDto, ConsumeDto, CreateTransportDto, PreferredLayersDto, ProduceDto, SetProducerPausedDto } from './dto/sfu-signaling.dto';
import type { SendFrameDto } from './dto/send-frame.dto';
import type { SendAudioDto } from './dto/send-audio.dto';

@Injectable()
export class CallsService implements OnModuleInit, OnModuleDestroy {
  private readonly clients = new Map<string, Socket>();
  private readonly operations = new KeyedSerialExecutor();
  private readonly deletedRooms = new Set<number>();
  private server?: Server;
  private unsubscribeMedia?: () => void;
  private unsubscribeAi?: () => void;

  constructor(
    private readonly core: CoreHttpService,
    private readonly sfu: SfuService,
    private readonly state: CallStateService,
    private readonly ai: CallAiService,
    private readonly logger: Logger,
  ) {}

  onModuleInit(): void {
    this.unsubscribeMedia = this.sfu.onNotification((event) => this.mediaNotification(event));
    this.unsubscribeAi = this.ai.onTranslation((translation) => {
      if (this.state.snapshot(translation.callRoomIdx).sessionId !== translation.sessionId) return;
      this.server?.to(this.roomName(translation.callRoomIdx)).emit(`${translation.source}_translation`, {
        callRoomIdx: translation.callRoomIdx, text: translation.text,
      });
    });
  }

  onModuleDestroy(): void {
    this.unsubscribeMedia?.();
    this.unsubscribeAi?.();
  }

  setServer(server: Server): void { this.server = server; }

  joinCall(roomIdx: number, userIdx: number) {
    return this.operations.run(String(userIdx), () =>
      this.core.post<JoinCallResponse>(`/calls/${roomIdx}/join`, undefined, this.headers(userIdx)));
  }

  leaveCall(roomIdx: number, userIdx: number) {
    return this.operations.run(String(userIdx), async () => {
      const result = await this.core.post<LeaveCallResponse>(`/calls/${roomIdx}/leave`, undefined, this.headers(userIdx));
      const participant = this.state.forUser(userIdx);
      if (participant?.callRoomIdx === roomIdx) await this.detach(participant);
      return result;
    });
  }

  leaveActiveCall(roomIdx: number, userIdx: number): Promise<void> {
    return this.operations.run(String(userIdx), async () => {
      const participant = this.state.forUser(userIdx);
      if (participant?.callRoomIdx !== roomIdx) return;
      await this.detach(participant);
      await this.syncCoreLeave(participant);
    });
  }

  getParticipantsByRoomIdx(roomIdx: number, userIdx: number) {
    return this.core.get<GetCallParticipantsResponse>(`/calls/${roomIdx}/participants`, this.headers(userIdx));
  }

  async getCallState(roomIdx: number, userIdx: number) {
    await this.authorize(roomIdx, userIdx);
    return this.state.snapshot(roomIdx);
  }

  joinSession(client: Socket, callRoomIdx: number) {
    const user = this.user(client);
    return this.operations.run(String(user.idx), async () => {
      const participantInfo = await this.authorize(callRoomIdx, user.idx);
      try {
        return await this.attachSession(client, callRoomIdx, user.idx, participantInfo.nickname);
      } catch (error) {
        if (!client.connected && !this.state.forUser(user.idx)) {
          await this.syncCoreLeave({ socketId: client.id, userIdx: user.idx, nickname: participantInfo.nickname,
            callRoomIdx, joinedAt: new Date().toISOString() });
        }
        throw error;
      }
    });
  }

  private async attachSession(client: Socket, callRoomIdx: number, userIdx: number, nickname: string) {
      this.assertConnected(client);
      const current = this.state.forSocket(client.id);
      if (current?.callRoomIdx === callRoomIdx) {
        const media = await this.sfu.join(String(callRoomIdx), client.id);
        return { ...media, state: this.state.snapshot(callRoomIdx) };
      }

      const media = await this.sfu.join(String(callRoomIdx), client.id);
      try {
        this.assertConnected(client);
        const previous = this.state.forUser(userIdx);
        if (previous) {
          await this.detach(previous);
          if (previous.callRoomIdx !== callRoomIdx) await this.syncCoreLeave(previous);
        }
        await client.join(this.roomName(callRoomIdx));
        this.assertConnected(client);
        if (this.deletedRooms.has(callRoomIdx)) throw new ForbiddenException('Call room has been deleted');
        const existingProducers = this.sfu.listProducers(String(callRoomIdx), client.id);
        const participant: CallParticipant = {
          socketId: client.id, userIdx, nickname,
          joinedAt: new Date().toISOString(), callRoomIdx,
        };
        this.clients.set(client.id, client);
        this.state.add(participant);
        const snapshot = this.state.snapshot(callRoomIdx);
        client.emit('existing_participants', {
          callRoomIdx, participants: snapshot.participants.filter((peer) => peer.socketId !== client.id),
        });
        client.to(this.roomName(callRoomIdx)).emit('user_joined', participant);
        this.emitState(callRoomIdx);
        return { ...media, existingProducers, state: snapshot };
      } catch (error) {
        await this.sfu.leave(String(callRoomIdx), client.id);
        await client.leave(this.roomName(callRoomIdx));
        throw error;
      }
  }

  leaveSession(client: Socket, callRoomIdx: number) {
    const user = this.user(client);
    return this.operations.run(String(user.idx), async () => {
      const participant = this.state.forSocket(client.id);
      if (!participant || participant.callRoomIdx !== callRoomIdx) return { left: true };
      await this.detach(participant);
      return { left: true, coreSynced: await this.syncCoreLeave(participant) };
    });
  }

  disconnectSocket(client: Socket): Promise<void> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user) return Promise.resolve();
    return this.operations.run(String(user.idx), async () => {
      const participant = this.state.forSocket(client.id);
      if (!participant) return;
      await this.detach(participant);
      await this.syncCoreLeave(participant);
    });
  }

  async closeRoom(callRoomIdx: number): Promise<void> {
    this.deletedRooms.add(callRoomIdx);
    for (const participant of this.state.snapshot(callRoomIdx).participants) {
      await this.operations.run(String(participant.userIdx), async () => {
        const current = this.state.forSocket(participant.socketId);
        if (current?.callRoomIdx === callRoomIdx) await this.detach(current);
      });
    }
    await this.sfu.closeRoom(String(callRoomIdx));
  }

  createTransport(client: Socket, input: CreateTransportDto) {
    return this.mediaRequest(client, (roomId) => this.sfu.createTransport(roomId, client.id, input.direction));
  }
  connectTransport(client: Socket, input: ConnectTransportDto) {
    return this.mediaRequest(client, (roomId) => this.sfu.connectTransport(roomId, client.id, input.transportId, input.dtlsParameters));
  }
  restartIce(client: Socket, transportId: string) {
    return this.mediaRequest(client, (roomId) => this.sfu.restartIce(roomId, client.id, transportId));
  }
  produce(client: Socket, input: ProduceDto) {
    return this.mediaRequest(client, async (roomId) => {
      const producer = await this.sfu.produce(roomId, client.id, input);
      client.to(this.roomName(Number(roomId))).emit('new_producer', producer);
      return { id: producer.producerId };
    });
  }
  consume(client: Socket, input: ConsumeDto) {
    return this.mediaRequest(client, (roomId) => this.sfu.consume(roomId, client.id, input));
  }
  resumeConsumer(client: Socket, consumerId: string) {
    return this.mediaRequest(client, (roomId) => this.sfu.resumeConsumer(roomId, client.id, consumerId));
  }
  setPreferredLayers(client: Socket, input: PreferredLayersDto) {
    return this.mediaRequest(client, (roomId) => this.sfu.setPreferredLayers(roomId, client.id, input.consumerId, input.spatialLayer, input.temporalLayer));
  }
  setProducerPaused(client: Socket, input: SetProducerPausedDto) {
    return this.mediaRequest(client, (roomId) => this.sfu.setProducerPaused(roomId, client.id, input.producerId, input.paused));
  }
  closeResource(client: Socket, kind: 'producer' | 'consumer' | 'transport', id: string) {
    return this.mediaRequest(client, (roomId) => this.sfu.closeResource(roomId, client.id, kind, id));
  }
  listProducers(client: Socket) {
    return this.mediaRequest(client, (roomId) => Promise.resolve(this.sfu.listProducers(roomId, client.id)));
  }
  sessionState(client: Socket) {
    const participant = this.requireParticipant(client);
    return this.state.snapshot(participant.callRoomIdx);
  }

  sendFrame(payload: SendFrameDto, client: Socket) {
    return this.sendAi(client, payload.callRoomIdx, 'frame', payload.frame);
  }
  sendAudio(payload: SendAudioDto, client: Socket) {
    return this.sendAi(client, payload.callRoomIdx, 'audio', payload.audio);
  }

  private sendAi(client: Socket, roomIdx: number, source: 'frame' | 'audio', content: unknown) {
    console.log(`sendA | roomIdx: ${roomIdx} | source: ${source} | content: ${content}`);
    const participant = this.requireParticipant(client);
    if (participant.callRoomIdx !== roomIdx) throw new ForbiddenException('Not a participant of this call');
    return this.ai.send(source, roomIdx, content, this.state.snapshot(roomIdx).sessionId!);
  }

  private mediaRequest<T>(client: Socket, operation: (roomId: string) => Promise<T>): Promise<T> {
    const user = this.user(client);
    return this.operations.run(String(user.idx), () => {
      this.assertConnected(client);
      const participant = this.requireParticipant(client);
      return operation(String(participant.callRoomIdx));
    });
  }

  private requireParticipant(client: Socket): CallParticipant {
    const user = this.user(client);
    const participant = this.state.forSocket(client.id);
    if (!participant || participant.userIdx !== user.idx) throw new ForbiddenException('Join a call first');
    return participant;
  }

  private async authorize(roomIdx: number, userIdx: number) {
    if (!Number.isInteger(roomIdx) || roomIdx <= 0) throw new ForbiddenException('Invalid call room');
    if (this.deletedRooms.has(roomIdx)) throw new ForbiddenException('Call room has been deleted');
    const { data } = await this.getParticipantsByRoomIdx(roomIdx, userIdx);
    const participant = data.participants.find((candidate) => candidate.userIdx === userIdx);
    if (!participant) throw new ForbiddenException('Join the call through the REST API first');
    return participant;
  }

  private async detach(participant: CallParticipant): Promise<void> {
    this.state.remove(participant.socketId);
    const client = this.clients.get(participant.socketId);
    this.clients.delete(participant.socketId);
    if (client) {
      try {
        await client.leave(this.roomName(participant.callRoomIdx));
      } catch (error: unknown) {
        this.logger.error({ err: error, socketId: client.id }, 'Socket room leave failed; disconnecting');
        client.disconnect(true);
      }
    }
    await this.sfu.leave(String(participant.callRoomIdx), participant.socketId);
    this.server?.to(this.roomName(participant.callRoomIdx)).emit('user_left', participant);
    client?.emit('call_left', { callRoomIdx: participant.callRoomIdx });
    this.emitState(participant.callRoomIdx);
  }

  private async syncCoreLeave(participant: CallParticipant): Promise<boolean> {
    try {
      await this.core.post<LeaveCallResponse>(`/calls/${participant.callRoomIdx}/leave`, undefined, this.headers(participant.userIdx));
      return true;
    } catch (error: unknown) {
      this.logger.error({ err: error, participant }, 'Call resources released but core leave failed');
      return false;
    }
  }

  private mediaNotification(event: SfuNotification): void {
    const roomIdx = Number(event.roomId);
    if (event.event === 'media_room_closed') {
      for (const participant of this.state.snapshot(roomIdx).participants) {
        this.state.remove(participant.socketId);
        const client = this.clients.get(participant.socketId);
        this.clients.delete(participant.socketId);
        if (client) {
          client.emit('media_room_closed', { callRoomIdx: roomIdx });
          void client.leave(this.roomName(roomIdx));
        }
      }
      return;
    }
    const target = event.peerId ?? this.roomName(roomIdx);
    this.server?.to(target).emit(event.event, { callRoomIdx: roomIdx, ...event.data });
  }

  private user(client: Socket): JwtPayload {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user || !Number.isInteger(user.idx) || user.idx <= 0 || !Number.isFinite(user.exp) || user.exp * 1000 <= Date.now()) {
      throw new ForbiddenException('Authentication required');
    }
    return user;
  }

  private assertConnected(client: Socket): void {
    if (!client.connected) throw new Error('Socket disconnected during the request');
  }
  private emitState(roomIdx: number): void {
    this.server?.to(this.roomName(roomIdx)).emit('call_state', this.state.snapshot(roomIdx));
  }
  private headers(userIdx: number) { return { headers: { 'X-User-Id': userIdx } }; }
  private roomName(roomIdx: number) { return `call_room:${roomIdx}`; }
}
