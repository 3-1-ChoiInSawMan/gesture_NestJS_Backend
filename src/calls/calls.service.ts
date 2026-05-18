import { Injectable } from '@nestjs/common';

import { CoreHttpService } from 'src/core-http/core-http.service';
import { GetCallParticipantsResponse } from './dto/core/response/GetCallParticipantsResponse.interface';
import { JoinCallResponse } from './dto/core/response/JoinCallResponse.interface';
import { LeaveCallResponse } from './dto/core/response/LeaveCallResponse.interface';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { Socket } from 'socket.io';
import { Logger } from 'nestjs-pino';

@Injectable()
export class CallsService {
  private readonly AI_WS_URL: string;
  private aiSocket: WebSocket;
  private readonly clients = new Map<string, Socket>();

  constructor(
    private readonly coreHttpService: CoreHttpService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.AI_WS_URL = this.configService.getOrThrow<string>('AI_WS_URL');
    this.aiSocket = new WebSocket(`${this.AI_WS_URL}/cc?debug=1&ignore_hands_down=1`);

    this.aiSocket.on('error', (error) => {
      this.logger.error({ error }, 'AI WebSocket closed');
    });

    this.aiSocket.on('close', (code, reason) => {
      this.logger.warn({ code, reason: reason.toString() }, 'AI WebSocket closed');
    });

    this.aiSocket.on('open', () => {
      this.logger.log('AI WebSocket Connected');
    });

    this.aiSocket.on('message', (data) => {
      this.handleAiMessage(data);
    });
  };

  public connectSocket(
    client: Socket
  ) {
    this.clients.set(client.id, client);
  }

  public disconnectSocket(
    client: Socket
  ) {
    this.clients.delete(client.id);
  }

  private handleAiMessage(
    data: WebSocket.RawData
  ) {
    const text = data.toString();

    try {
      JSON.parse(text);
    } catch {
      for (const [clientId, client] of this.clients) {
        if (!client.connected) {
          this.clients.delete(clientId);
          continue;
        }

        client.emit('translation', {
          userIdx: client.data.user.idx,
          text
        });
      }
    }
  }

  public sendFrame(
    frame: object
  ) {
    if (this.aiSocket.readyState !== WebSocket.OPEN) {
      this.logger.warn('AI WebSocket is not open; frame dropped');
      return;
    }

    this.aiSocket.send(JSON.stringify(frame), (error) => {
      if (error) {
        this.logger.error('AI WebSocket send failed:', error);
      }
    });
  }

  async joinCall(
    roomIdx: number,
    userIdx: number,
  ) {
    const response = await this.coreHttpService.post<JoinCallResponse>(`/calls/${roomIdx}/join`, undefined, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async leaveCall(
    roomIdx: number,
    userIdx: number,
  ) {
    const response = await this.coreHttpService.post<LeaveCallResponse>(`/calls/${roomIdx}/leave`, undefined, {
      headers: {
        'X-User-Id': userIdx
      }
    })
    return response;
  }

  async getParticipantsByRoomIdx(
    roomIdx: number,
    userIdx: number,
  ) {
    const response = await this.coreHttpService.get<GetCallParticipantsResponse>(`/calls/${roomIdx}/participants`, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }
}
