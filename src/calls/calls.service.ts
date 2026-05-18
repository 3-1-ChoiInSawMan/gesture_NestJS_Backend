import { Injectable } from '@nestjs/common';
import { CoreResponse } from 'src/common/core-response.interface';
import { CoreHttpService } from 'src/core-http/core-http.service';
import { GetCallParticipants } from './dto/core/response/GetCallParticipants.interface';
import { JoinCall } from './dto/core/response/JoinCall.interface';
import { LeaveCall } from './dto/core/response/LeaveCall.interface';

@Injectable()
export class CallsService {
  constructor(
    private readonly coreHttpService: CoreHttpService,
  ) { };

  async joinCall(
    roomIdx: number,
    userIdx: number,
  ) {
    const response = await this.coreHttpService.post<CoreResponse<JoinCall>>(`/calls/${roomIdx}/join`, undefined, {
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
    const response = await this.coreHttpService.post<CoreResponse<LeaveCall>>(`/calls/${roomIdx}/leave`, undefined, {
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
    const response = await this.coreHttpService.get<CoreResponse<GetCallParticipants>>(`/calls/${roomIdx}/participants`, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }
}
