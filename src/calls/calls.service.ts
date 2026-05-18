import { Injectable } from '@nestjs/common';

import { CoreHttpService } from 'src/core-http/core-http.service';
import { GetCallParticipantsResponse } from './dto/core/response/GetCallParticipantsResponse.interface';
import { JoinCallResponse } from './dto/core/response/JoinCallResponse.interface';
import { LeaveCallResponse } from './dto/core/response/LeaveCallResponse.interface';

@Injectable()
export class CallsService {
  constructor(
    private readonly coreHttpService: CoreHttpService,
  ) { };

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
