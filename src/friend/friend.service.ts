import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { FriendRequestResponse } from './coreDto/response/FriendRequestResponse.dto';

@Injectable()
export class FriendService {
  constructor (
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }
  async sendFriendRequest(targetUserIdx: number, sendUserIdx: number) {
    const { data } = await firstValueFrom(
      this.httpService.post<FriendRequestResponse>(`${this.configService.getOrThrow<string>('SPRING_SERVER_URL')}/friends/${targetUserIdx}`, {
        headers: {
          'X-User-Id': sendUserIdx
        }
      })
    );

    console.log(data);
  }

  async getFriendRequestList() {

  }
}
