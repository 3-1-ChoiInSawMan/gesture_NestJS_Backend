import { Injectable } from '@nestjs/common';
import { CreateCallRoomDto } from './dto/request/create-call-room.dto';
import { JoinCallRoomDto } from './dto/request/join-call-room.dto';
import { GetCallRoomsQueryDto } from './dto/request/get-call-rooms-query.dto';
import { GetCallRoomsByKeywordQueryDto } from './dto/request/get-call-room-by-keyword-query.dto';
import { UpdateCallRoomDto } from './dto/request/update-call-room.dto';
import { MediasService } from 'src/medias/medias.service';
import { CoreHttpService } from 'src/core-http/core-http.service';

import { CoreResponse } from 'src/common/core-response.interface';
import { CreateCallRoom } from './dto/core/response/CreateCallRoom.interface';
import { JoinRoom } from './dto/core/response/JoinRoom.interface';
import { GetCallRooms } from './dto/core/response/GetCallRooms.interface';

@Injectable()
export class CallRoomsService {
  constructor(
    private readonly coreHttpService: CoreHttpService,
    private readonly mediasService: MediasService,
  ) { };

  async joinCallRoom(
    body: JoinCallRoomDto,
    roomIdx: number,
    userIdx: number
  ) {
    const response = await this.coreHttpService.post<CoreResponse<JoinRoom>>(`/rooms/${roomIdx}/join`, body, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async createCallRoom(
    file: Express.Multer.File | undefined,
    body: CreateCallRoomDto,
    userIdx: number
  ) {
    const _file = file ? await this.mediasService.uploadMedia(file, userIdx) : undefined;

    const response = await this.coreHttpService.post<CoreResponse<CreateCallRoom>>('/rooms', {
      ...body,
      thumbnail_uuid: _file?.data.mediaUuid ?? null,
    }, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return {
      response,
      fileUUID: _file?.data.mediaUuid ?? null,
    };
  }

  async getCallRooms(
    query: GetCallRoomsQueryDto
  ) {
    const response = await this.coreHttpService.get<CoreResponse<GetCallRooms>>('/rooms', {
      params: query
    })

    return response;
  }

  async getCallRoomsByKeyword(
    query: GetCallRoomsByKeywordQueryDto
  ) {
    const response = await this.coreHttpService.get<CoreResponse<GetCallRooms>>('/rooms/search', {
      params: query
    })

    return response;
  }

  async getCallRoomById(
    roomIdx: number,
  ) {
    const response = await this.coreHttpService.get<CoreResponse<CreateCallRoom>>(`/rooms/${roomIdx}`)

    return response;
  }

  async updateCallRoomById(
    file: Express.Multer.File | undefined,
    body: UpdateCallRoomDto,
    roomIdx: number,
    userIdx: number,
  ) {
    const _file = file ? await this.mediasService.uploadMedia(file, userIdx) : undefined;

    const response = await this.coreHttpService.patch<CoreResponse<CreateCallRoom>>(`/rooms/${roomIdx}`, {
      ...body,
      thumbnail_uuid: _file?.data.mediaUuid ?? null,
    }, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return {
      response,
      fileUUID: _file?.data.mediaUuid ?? null,
    };
  }

  async deleteCallRoomById(
    roomIdx: number,
    userIdx: number
  ) {
    const response = await this.coreHttpService.delete<CoreResponse<CreateCallRoom>>(`/rooms/${roomIdx}`, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async leaveCallRoomById(
    roomIdx: number,
    userIdx: number
  ) {
    const response = await this.coreHttpService.delete<CoreResponse<JoinRoom>>(`/rooms/${roomIdx}/leave`, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }
}
