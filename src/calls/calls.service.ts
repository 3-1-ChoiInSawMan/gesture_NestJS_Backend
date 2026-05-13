import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CallsService {
  private readonly SPRING_SERVER_URL: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.SPRING_SERVER_URL = this.configService.getOrThrow<string>('SPRING_SERVER_URL');
  };

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
