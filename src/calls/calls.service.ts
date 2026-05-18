import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import WebSocket from 'ws';
import { Socket } from 'socket.io';
import { Logger } from 'nestjs-pino';

@Injectable()
export class CallsService {
  private readonly SPRING_SERVER_URL: string;
  private readonly AI_WS_URL: string;
  private aiSocket: WebSocket;
  private readonly clients = new Map<string, Socket>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.SPRING_SERVER_URL = this.configService.getOrThrow<string>('SPRING_SERVER_URL');
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
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.SPRING_SERVER_URL}/calls/${roomIdx}/join`, undefined, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return data;
  }

  async leaveCall(
    roomIdx: number,
    userIdx: number,
  ) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.SPRING_SERVER_URL}/calls/${roomIdx}/leave`, undefined, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return data;
  }

  async getParticipantsByRoomIdx(
    roomIdx: number,
    userIdx: number,
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/calls/${roomIdx}/participants`, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return data;
  }
}
