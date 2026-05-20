import { Injectable } from '@nestjs/common';
import { CoreHttpService } from 'src/core-http/core-http.service';
import { GetCallParticipantsResponse } from './dto/core/response/GetCallParticipantsResponse.interface';
import { JoinCallResponse } from './dto/core/response/JoinCallResponse.interface';
import { LeaveCallResponse } from './dto/core/response/LeaveCallResponse.interface';
import { ConfigService } from '@nestjs/config';
import WebSocket, { RawData } from 'ws';
import type { Server, Socket } from 'socket.io';
import { Logger } from 'nestjs-pino';
import { disconnectWithAuthError } from 'src/common/ws-error.util';
import { AiMessageDto } from './dto/ai-message.dto';

@Injectable()
export class CallsService {
  private readonly AI_WS_URL: string;

  private readonly clients = new Map<string, Socket>();
  private readonly clientParticipants = new Map<number, number>();

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

    const participantRoomIdx = this.clientParticipants.get(client.data.user.idx);

    if (participantRoomIdx !== callRoomIdx) {
      disconnectWithAuthError(client, 'CALL_002');

      return;
    }

    client.join(`call_room:${callRoomIdx}`);
  }

  public disconnectSocket(
    client: Socket
  ) {
    this.clients.delete(client.id);
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

    if (typeof text !== 'string' || text.length === 0 || !Number.isInteger(callRoomIdx)) {
      this.logger.warn({ parseData }, 'Dropped invalid AI message');

      return;
    }

    if (!this.server) {
      this.logger.warn('Server not initialized; message dropped');

      return;
    }
    
    this.server.to(`call_room:${callRoomIdx}`).emit('translation', {
      text,
      callRoomIdx
    });
  }

  public sendFrame(
    frame: object,
    client: Socket
  ) {
    if (!this.aiSocket || this.aiSocket.readyState !== WebSocket.OPEN) {
      this.logger.warn('AI WebSocket is not open; frame dropped');

      return;
    }

    this.aiSocket.send(
      JSON.stringify({
        frame,
        callRoomIdx: client.data.callRoomIdx,
      }),
      (error) => {
        if (error) {
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
}
