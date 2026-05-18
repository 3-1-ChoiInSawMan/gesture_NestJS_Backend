import { Injectable } from '@nestjs/common';
import { CreateCallRoomDto } from './dto/request/create-call-room.dto';
import { JoinCallRoomDto } from './dto/request/join-call-room.dto';
import { GetCallRoomsQueryDto } from './dto/request/get-call-rooms-query.dto';
import { GetCallRoomsByKeywordQueryDto } from './dto/request/get-call-room-by-keyword-query.dto';
import { UpdateCallRoomDto } from './dto/request/update-call-room.dto';
import { MediasService } from 'src/medias/medias.service';
import { CoreHttpService } from 'src/core-http/core-http.service';

import { CreateCallRoomResponse } from './dto/core/response/CreateCallRoomResponse.interface';
import { JoinRoomResponse } from './dto/core/response/JoinRoomResponse.interface';
import { GetCallRoomsResponse } from './dto/core/response/GetCallRoomsResponse.interface';

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
    const response = await this.coreHttpService.post<JoinRoomResponse>(`/rooms/${roomIdx}/join`, body, {
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

    const response = await this.coreHttpService.post<CreateCallRoomResponse>('/rooms', {
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
    const response = await this.coreHttpService.get<GetCallRoomsResponse>('/rooms', {
      params: query
    })

    return response;
  }

  async getCallRoomsByKeyword(
    query: GetCallRoomsByKeywordQueryDto
  ) {
    const response = await this.coreHttpService.get<GetCallRoomsResponse>('/rooms/search', {
      params: query
    })

    return response;
  }

  async getCallRoomById(
    roomIdx: number,
  ) {
    const response = await this.coreHttpService.get<CreateCallRoomResponse>(`/rooms/${roomIdx}`)

    return response;
  }

  async updateCallRoomById(
    file: Express.Multer.File | undefined,
    body: UpdateCallRoomDto,
    roomIdx: number,
    userIdx: number,
  ) {
    const _file = file ? await this.mediasService.uploadMedia(file, userIdx) : undefined;

    const response = await this.coreHttpService.patch<CreateCallRoomResponse>(`/rooms/${roomIdx}`, {
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
    const response = await this.coreHttpService.delete<CreateCallRoomResponse>(`/rooms/${roomIdx}`, {
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
    const response = await this.coreHttpService.delete<JoinRoomResponse>(`/rooms/${roomIdx}/leave`, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }
}
