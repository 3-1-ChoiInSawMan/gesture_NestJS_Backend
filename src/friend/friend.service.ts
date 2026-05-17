import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RequestFriendshipResponse } from './coreDto/response/RequestFriendship.dto';
import { GetPendingFriendRequestsDto } from './coreDto/response/GetPendingFriendRequests.dto';
import { Logger } from 'nestjs-pino';
import { FriendStatus } from './enum/FriendStatus.enum';

@Injectable()
export class FriendService {
  private SPRING_SERVER_URL;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.SPRING_SERVER_URL = configService.getOrThrow<string>('SPRING_SERVER_URL')
  }

  public async sendFriendRequest(targetUserIdx: number, sendUserIdx: number) {
    this.logger.debug('BFF → Core POST | 친구 요청 전송', {
      targetUserIdx,
      sendUserIdx,
    });

    const { data } = await firstValueFrom(
      this.httpService.post<RequestFriendshipResponse>(`${this.SPRING_SERVER_URL}/friends/${targetUserIdx}`, undefined, {
        headers: {
          'X-User-Id': sendUserIdx
        }
      }
      )
    );

    this.logger.debug('Core → BFF RES | 친구 요청 전송 성공');
    return data;
  }

  public async getPendingFriendRequests(userIdx: number) {
    /**
     * BFF > Core 조회 요청 
     * 응답 수신
     * BFF > Client 요청 목록 반환
     * 
     */
    this.logger.debug('BFF → Core GET | 친구 요청 목록 조회');

    const { data } = await firstValueFrom(
      this.httpService.get<GetPendingFriendRequestsDto>(`${this.SPRING_SERVER_URL}/friends`, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    this.logger.debug({ response: data }, 'Core 응답 수신');
    this.logger.log(data.data, '친구 요청 목록 조회 완료');
    return data;
  }

  private async sendFriendRequestResponse(accepted: boolean, userIdx: number, friendshipIdx: number) {
    this.logger.debug('BFF → Core PATCH | 친구 요청 응답 전송');

    const { data } = await firstValueFrom(
      this.httpService.patch<GetPendingFriendRequestsDto>(`${this.SPRING_SERVER_URL}/friends/${friendshipIdx}`, {
        status: accepted ? FriendStatus.ACCEPTED : FriendStatus.REJECTED,
      }, {
        headers: {
          'X-User-Id': userIdx
        },
      })
    );

    this.logger.debug({ response: data }, 'Core 응답 수신');
    this.logger.log(data.data, '친구 요청 응답 완료');
    return data;
  }

  public async acceptFriendRequest(userIdx: number, friendshipIdx: number) {
    return await this.sendFriendRequestResponse(true, userIdx, friendshipIdx);
  }

  public async rejectFriendRequest(userIdx: number, friendshipIdx: number) {
    return await this.sendFriendRequestResponse(false, userIdx, friendshipIdx);
  }
}
