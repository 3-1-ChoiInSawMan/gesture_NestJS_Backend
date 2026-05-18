import { Injectable } from '@nestjs/common';
import { RequestFriendshipResponse } from './coreDto/response/RequestFriendship.dto';
import { GetPendingFriendRequestsDto } from './coreDto/response/GetPendingFriendRequests.dto';
import { Logger } from 'nestjs-pino';
import { FriendStatus } from './enum/FriendStatus.enum';
import { CoreHttpService } from 'src/core-http/core-http.service';

@Injectable()
export class FriendService {

  constructor(
    private readonly coreHttpService: CoreHttpService,
    private readonly logger: Logger,
  ) { };

  public async sendFriendRequest(targetUserIdx: number, sendUserIdx: number) {
    this.logger.debug('BFF → Core POST | 친구 요청 전송', {
      targetUserIdx,
      sendUserIdx,
    });

    const response = await this.coreHttpService.post<RequestFriendshipResponse>(`/friends/${targetUserIdx}`, undefined, {
      headers: {
        'X-User-Id': sendUserIdx
      }
    }
    )

    this.logger.debug('Core → BFF RES | 친구 요청 전송 성공');
    return response;
  }

  public async getPendingFriendRequests(userIdx: number) {
    /**
     * BFF > Core 조회 요청 
     * 응답 수신
     * BFF > Client 요청 목록 반환
     * 
     */
    this.logger.debug('BFF → Core GET | 친구 요청 목록 조회');

    const response = await this.coreHttpService.get<GetPendingFriendRequestsDto>(`/friends`, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  private async sendFriendRequestResponse(accepted: boolean, userIdx: number, friendshipIdx: number) {
    this.logger.debug('BFF → Core PATCH | 친구 요청 응답 전송');

    const response = await this.coreHttpService.patch<GetPendingFriendRequestsDto>(`/friends/${friendshipIdx}`, {
      status: accepted ? FriendStatus.ACCEPTED : FriendStatus.REJECTED,
    }, {
      headers: {
        'X-User-Id': userIdx
      },
    })

    return response;
  }

  public async acceptFriendRequest(userIdx: number, friendshipIdx: number) {
    return await this.sendFriendRequestResponse(true, userIdx, friendshipIdx);
  }

  public async rejectFriendRequest(userIdx: number, friendshipIdx: number) {
    return await this.sendFriendRequestResponse(false, userIdx, friendshipIdx);
  }
}
