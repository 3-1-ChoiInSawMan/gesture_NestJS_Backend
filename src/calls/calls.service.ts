import { Injectable } from '@nestjs/common';
import { CoreHttpService } from 'src/core-http/core-http.service';
import { GetCallParticipantsResponse } from './dto/core/response/GetCallParticipantsResponse.interface';
import { JoinCallResponse } from './dto/core/response/JoinCallResponse.interface';
import { LeaveCallResponse } from './dto/core/response/LeaveCallResponse.interface';
import { ConfigService } from '@nestjs/config';
import WebSocket, { RawData } from 'ws';
import type { Server, Socket } from 'socket.io';
import { Logger } from 'nestjs-pino';
import { disconnectWithAuthError, emitWsError } from 'src/common/ws-error.util';
import { AiMessageDto } from './dto/ai-message.dto';
import { SignalingPayloadDto } from './dto/call-signaling.dto';
import { SendFrameDto } from './dto/send-frame.dto';
import { SendAudioDto } from './dto/send-audio.dto';

type SignalingEvent = 'offer' | 'answer' | 'ice_candidate';
type AiRequestSource = 'frame' | 'audio';

type PendingAiRequest = {
  requestId: number;
  sequence: number;
  source: AiRequestSource;
};

@Injectable()
export class CallsService {
  private readonly AI_WS_URL: string;

  private readonly clients = new Map<string, Socket>();
  private readonly clientParticipants = new Map<number, number>();
  private readonly pendingFrameRequests = new Map<number, PendingAiRequest[]>();
  private readonly pendingAudioRequests = new Map<number, PendingAiRequest[]>();

  private aiSocket?: WebSocket;
  private server?: Server;

  private nextFrameRequestId = 0;
  private nextAudioRequestId = 0;
  private nextAiRequestSequence = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private isShuttingDown = false;

  private readonly AI_RECONNECT_BASE_DELAY = 1000;
  private readonly AI_RECONNECT_MAX_DELAY = 30000;

  constructor(
    private readonly coreHttpService: CoreHttpService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.AI_WS_URL = this.configService.getOrThrow<string>('AI_WS_URL');

    this.connectAiSocket();
  };

  private connectAiSocket() {
    if (this.isShuttingDown) {
      return;
    }

    if (
      this.aiSocket &&
      (
        this.aiSocket.readyState == WebSocket.OPEN ||
        this.aiSocket.readyState == WebSocket.CONNECTING
      )
    ) {
      return;
    }

    const url = `${this.AI_WS_URL}/cc?debug=1&ignore_hands_down=1`;

    this.logger.log({ url }, 'Connecting to AI WebSocket');

    this.aiSocket = new WebSocket(url);

    this.aiSocket.on('open', () => {
      this.reconnectAttempts = 0;

      this.logger.log('AI WebSocket connected');
    });

    this.aiSocket.on('message', (data: RawData) => {
      this.handleAiMessage(data);
    });

    this.aiSocket.on('error', (error) => {
      this.logger.error({ err: error }, 'AI WebSocket error');
    });

    this.aiSocket.on('close', (code, reason) => {
      this.logger.warn(
        {
          code,
          reason: reason.toString(),
        },
        'AI WebSocket closed',
      );

      this.aiSocket = undefined;
      this.clearPendingAiRequests();

      this.scheduleAiReconnect();
    });
  }

  private scheduleAiReconnect() {
    if (this.isShuttingDown) {
      return;
    }

    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts += 1;

    const delay = Math.min(
      this.AI_RECONNECT_BASE_DELAY * 2 ** (this.reconnectAttempts - 1),
      this.AI_RECONNECT_MAX_DELAY,
    );

    this.logger.warn(
      {
        attempt: this.reconnectAttempts,
        delay,
      },
      'Scheduling AI WebSocket reconnect',
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connectAiSocket();
    }, delay);
  }

  public connectSocket(
    client: Socket,
    callRoomIdx: number
  ) {
    this.clients.set(client.id, client);

    this.joinSignalingRoom(client, callRoomIdx);
  }

  public disconnectSocket(
    client: Socket
  ) {
    this.leaveSignalingRoom(client);
    this.clients.delete(client.id);
  }

  public isValidCallRoomIdx(
    callRoomIdx: unknown
  ): callRoomIdx is number {
    return Number.isInteger(callRoomIdx) && Number(callRoomIdx) > 0;
  }

  public joinSignalingRoom(
    client: Socket,
    callRoomIdx: number
  ) {
    if (!this.isValidCallRoomIdx(callRoomIdx)) {
      disconnectWithAuthError(client, 'COMMON_400');

      return;
    }

    const previousCallRoomIdx = Number(client.data.callRoomIdx);

    if (this.isValidCallRoomIdx(previousCallRoomIdx) && previousCallRoomIdx !== callRoomIdx) {
      this.leaveSignalingRoom(client, previousCallRoomIdx);
    }

    const roomName = this.getCallRoomName(callRoomIdx);

    if (client.rooms.has(roomName)) {
      return;
    }

    client.data.callRoomIdx = callRoomIdx;
    this.clients.set(client.id, client);
    client.join(roomName);

    client.to(roomName).emit('user_joined', this.getSignalingUserPayload(client, callRoomIdx));
  }

  public leaveSignalingRoom(
    client: Socket,
    callRoomIdx?: number
  ) {
    const resolvedCallRoomIdx = callRoomIdx ?? this.getClientCallRoomIdx(client);

    if (!this.isValidCallRoomIdx(resolvedCallRoomIdx)) {
      return;
    }

    const roomName = this.getCallRoomName(resolvedCallRoomIdx);

    if (!client.rooms.has(roomName)) {
      return;
    }

    client.to(roomName).emit('user_left', this.getSignalingUserPayload(client, resolvedCallRoomIdx));
    client.leave(roomName);

    if (client.data.callRoomIdx === resolvedCallRoomIdx) {
      client.data.callRoomIdx = undefined;
    }
  }

  public relaySignalingMessage(
    event: SignalingEvent,
    payload: SignalingPayloadDto,
    client: Socket
  ) {
    const { callRoomIdx } = payload;

    if (!this.isValidCallRoomIdx(callRoomIdx) || !client.rooms.has(this.getCallRoomName(callRoomIdx))) {
      emitWsError(client, 'CALL_002');

      return;
    }

    client.to(this.getCallRoomName(callRoomIdx)).emit(event, {
      ...this.toRecord(payload),
      callRoomIdx,
      fromSocketId: client.id,
      fromUserIdx: client.data.user?.idx,
    });
  }

  private handleAiMessage(
    data: RawData
  ) {
    let parseData: Partial<AiMessageDto>;

    try {
      parseData = JSON.parse(data.toString());
    } catch {
      this.logger.warn('Dropped malformed AI message');

      return;
    }

    const { text, callRoomIdx } = parseData;

    if (
      typeof text !== 'string'
      || text.length === 0
      || !this.isValidCallRoomIdx(callRoomIdx)
    ) {
      return;
    }

    const pendingRequest = this.shiftNextPendingAiRequest(callRoomIdx);

    if (!pendingRequest) {
      this.logger.warn({ parseData }, 'Dropped AI message without matching request sender');

      return;
    }

    if (!this.server) {
      this.logger.warn('Server not initialized; message dropped');

      return;
    }
    
    this.server.to(this.getCallRoomName(callRoomIdx)).emit(this.getTranslationEvent(pendingRequest.source), {
      text,
      callRoomIdx,
    });
  }

  public sendFrame(
    payload: SendFrameDto,
    client: Socket
  ) {
    const { frame, callRoomIdx } = payload;
    const userIdx = this.getClientUserIdx(client);

    if (!Number.isInteger(userIdx)) {
      emitWsError(client, 'AUTH_001');

      return;
    }

    if (!this.isValidCallRoomIdx(callRoomIdx) || !client.rooms.has(this.getCallRoomName(callRoomIdx))) {
      emitWsError(client, 'CALL_002');

      return;
    }

    if (!this.aiSocket || this.aiSocket.readyState !== WebSocket.OPEN) {
      this.logger.warn('AI WebSocket is not open; frame dropped');

      return;
    }

    const requestId = this.pushPendingFrameRequest(callRoomIdx);

    this.aiSocket.send(
      JSON.stringify({
        frame,
        callRoomIdx,
      }),
      (error) => {
        if (error) {
          this.removePendingFrameRequest(callRoomIdx, requestId);
          this.logger.error({ err: error }, 'AI WebSocket send failed');
        }
      },
    );
  }

  public sendAudio(
    payload: SendAudioDto,
    client: Socket
  ) {
    const { audio, callRoomIdx } = payload;
    const userIdx = this.getClientUserIdx(client);

    if (!Number.isInteger(userIdx)) {
      emitWsError(client, 'AUTH_001');

      return;
    }

    if (!this.isValidCallRoomIdx(callRoomIdx) || !client.rooms.has(this.getCallRoomName(callRoomIdx))) {
      emitWsError(client, 'CALL_002');

      return;
    }

    if (!this.aiSocket || this.aiSocket.readyState !== WebSocket.OPEN) {
      this.logger.warn('AI WebSocket is not open; audio dropped');

      return;
    }

    const requestId = this.pushPendingAudioRequest(callRoomIdx);

    this.aiSocket.send(
      JSON.stringify({
        audio,
        callRoomIdx,
      }),
      (error) => {
        if (error) {
          this.removePendingAudioRequest(callRoomIdx, requestId);
          this.logger.error({ err: error }, 'AI WebSocket send failed');
        }
      },
    );
  }

  public async joinCall(
    roomIdx: number,
    userIdx: number,
  ) {
    const response = await this.coreHttpService.post<JoinCallResponse>(`/calls/${roomIdx}/join`, undefined, {
      headers: {
        'X-User-Id': userIdx
      }
    });

    this.clientParticipants.set(userIdx, roomIdx);

    return response;
  }

  public async leaveCall(
    roomIdx: number,
    userIdx: number,
  ) {
    const response = await this.coreHttpService.post<LeaveCallResponse>(`/calls/${roomIdx}/leave`, undefined, {
      headers: {
        'X-User-Id': userIdx
      }
    });

    this.clientParticipants.delete(userIdx);

    return response;
  }

  public async getParticipantsByRoomIdx(
    roomIdx: number,
    userIdx: number,
  ) {
    const response = await this.coreHttpService.get<GetCallParticipantsResponse>(`/calls/${roomIdx}/participants`, {
      headers: {
        'X-User-Id': userIdx
      }
    });

    return response;
  }

  public setServer(
    server: Server
  ) {
    this.server = server;
  }

  private getClientCallRoomIdx(
    client: Socket
  ) {
    const callRoomIdx = Number(client.data.callRoomIdx);

    if (this.isValidCallRoomIdx(callRoomIdx)) {
      return callRoomIdx;
    }
  }

  private getCallRoomName(
    callRoomIdx: number
  ) {
    return `call_room:${callRoomIdx}`;
  }

  private getSignalingUserPayload(
    client: Socket,
    callRoomIdx: number
  ) {
    return {
      callRoomIdx,
      socketId: client.id,
      userIdx: client.data.user?.idx,
    };
  }

  private getClientUserIdx(
    client: Socket
  ) {
    const userIdx = client.data.user?.idx;

    if (Number.isInteger(userIdx)) {
      return userIdx;
    }
  }

  private pushPendingFrameRequest(
    callRoomIdx: number
  ) {
    return this.pushPendingRequest(
      this.pendingFrameRequests,
      callRoomIdx,
      this.createFrameRequestId(),
      'frame',
    );
  }

  private pushPendingAudioRequest(
    callRoomIdx: number
  ) {
    return this.pushPendingRequest(
      this.pendingAudioRequests,
      callRoomIdx,
      this.createAudioRequestId(),
      'audio',
    );
  }

  private shiftPendingFrameRequest(
    callRoomIdx: number
  ) {
    return this.shiftPendingRequest(this.pendingFrameRequests, callRoomIdx);
  }

  private shiftPendingAudioRequest(
    callRoomIdx: number
  ) {
    return this.shiftPendingRequest(this.pendingAudioRequests, callRoomIdx);
  }

  private shiftNextPendingAiRequest(
    callRoomIdx: number
  ) {
    const pendingFrameRequest = this.peekPendingRequest(this.pendingFrameRequests, callRoomIdx);
    const pendingAudioRequest = this.peekPendingRequest(this.pendingAudioRequests, callRoomIdx);

    if (!pendingFrameRequest && !pendingAudioRequest) {
      return;
    }

    if (
      !pendingAudioRequest ||
      (
        pendingFrameRequest &&
        pendingFrameRequest.sequence <= pendingAudioRequest.sequence
      )
    ) {
      return this.shiftPendingFrameRequest(callRoomIdx);
    }

    return this.shiftPendingAudioRequest(callRoomIdx);
  }

  private removePendingFrameRequest(
    callRoomIdx: number,
    requestId: number
  ) {
    this.removePendingRequest(this.pendingFrameRequests, callRoomIdx, requestId);
  }

  private removePendingAudioRequest(
    callRoomIdx: number,
    requestId: number
  ) {
    this.removePendingRequest(this.pendingAudioRequests, callRoomIdx, requestId);
  }

  private pushPendingRequest(
    requestsByCallRoomIdx: Map<number, PendingAiRequest[]>,
    callRoomIdx: number,
    requestId: number,
    source: AiRequestSource,
  ) {
    const requests = requestsByCallRoomIdx.get(callRoomIdx) ?? [];

    requests.push({
      requestId,
      sequence: this.createAiRequestSequence(),
      source,
    });

    requestsByCallRoomIdx.set(callRoomIdx, requests);

    return requestId;
  }

  private peekPendingRequest(
    requestsByCallRoomIdx: Map<number, PendingAiRequest[]>,
    callRoomIdx: number,
  ) {
    return requestsByCallRoomIdx.get(callRoomIdx)?.[0];
  }

  private shiftPendingRequest(
    requestsByCallRoomIdx: Map<number, PendingAiRequest[]>,
    callRoomIdx: number,
  ) {
    const requests = requestsByCallRoomIdx.get(callRoomIdx);

    if (!requests || requests.length === 0) {
      return;
    }

    const request = requests.shift();

    if (requests.length === 0) {
      requestsByCallRoomIdx.delete(callRoomIdx);
    }

    return request;
  }

  private removePendingRequest(
    requestsByCallRoomIdx: Map<number, PendingAiRequest[]>,
    callRoomIdx: number,
    requestId: number
  ) {
    const requests = requestsByCallRoomIdx.get(callRoomIdx);

    if (!requests) {
      return;
    }

    const index = requests.findIndex((request) => request.requestId === requestId);

    if (index !== -1) {
      requests.splice(index, 1);
    }

    if (requests.length === 0) {
      requestsByCallRoomIdx.delete(callRoomIdx);
    }
  }

  private clearPendingAiRequests() {
    this.pendingFrameRequests.clear();
    this.pendingAudioRequests.clear();
  }

  private createFrameRequestId() {
    this.nextFrameRequestId = (this.nextFrameRequestId % Number.MAX_SAFE_INTEGER) + 1;

    return this.nextFrameRequestId;
  }

  private createAudioRequestId() {
    this.nextAudioRequestId = (this.nextAudioRequestId % Number.MAX_SAFE_INTEGER) + 1;

    return this.nextAudioRequestId;
  }

  private createAiRequestSequence() {
    this.nextAiRequestSequence = (this.nextAiRequestSequence % Number.MAX_SAFE_INTEGER) + 1;

    return this.nextAiRequestSequence;
  }

  private getTranslationEvent(
    source: AiRequestSource
  ) {
    return `${source}_translation`;
  }

  private toRecord(
    payload: unknown
  ) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return {};
    }

    return payload as Record<string, unknown>;
  }
}
