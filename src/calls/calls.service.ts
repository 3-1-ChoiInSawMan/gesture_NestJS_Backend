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

type SignalingEvent = 'offer' | 'answer' | 'ice_candidate';

@Injectable()
export class CallsService {
  private readonly AI_WS_URL: string;

  private readonly clients = new Map<string, Socket>();
  private readonly clientParticipants = new Map<number, number>();
  private readonly pendingFrameUserIdxs = new Map<number, number[]>();

  private aiSocket?: WebSocket;
  private server?: Server;

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

    const userIdx = this.shiftPendingFrameUserIdx(callRoomIdx);

    if (!Number.isInteger(userIdx)) {
      this.logger.warn({ parseData }, 'Dropped AI message without matching frame sender');

      return;
    }

    if (!this.server) {
      this.logger.warn('Server not initialized; message dropped');

      return;
    }
    
    this.server.to(this.getCallRoomName(callRoomIdx)).emit('translation', {
      text,
      callRoomIdx,
      userIdx,
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

    this.pushPendingFrameUserIdx(callRoomIdx, userIdx);

    this.aiSocket.send(
      JSON.stringify({
        frame,
        callRoomIdx,
      }),
      (error) => {
        if (error) {
          this.removePendingFrameUserIdx(callRoomIdx, userIdx);
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

  private pushPendingFrameUserIdx(
    callRoomIdx: number,
    userIdx: number
  ) {
    const userIdxs = this.pendingFrameUserIdxs.get(callRoomIdx) ?? [];

    userIdxs.push(userIdx);
    this.pendingFrameUserIdxs.set(callRoomIdx, userIdxs);
  }

  private shiftPendingFrameUserIdx(
    callRoomIdx: number
  ) {
    const userIdxs = this.pendingFrameUserIdxs.get(callRoomIdx);

    if (!userIdxs || userIdxs.length === 0) {
      return;
    }

    const userIdx = userIdxs.shift();

    if (userIdxs.length === 0) {
      this.pendingFrameUserIdxs.delete(callRoomIdx);
    }

    return userIdx;
  }

  private removePendingFrameUserIdx(
    callRoomIdx: number,
    userIdx: number
  ) {
    const userIdxs = this.pendingFrameUserIdxs.get(callRoomIdx);

    if (!userIdxs) {
      return;
    }

    const index = userIdxs.indexOf(userIdx);

    if (index !== -1) {
      userIdxs.splice(index, 1);
    }

    if (userIdxs.length === 0) {
      this.pendingFrameUserIdxs.delete(callRoomIdx);
    }
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
