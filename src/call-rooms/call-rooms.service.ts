import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CreateCallRoomDto } from './dto/request/create-call-room.dto';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { JoinCallRoomDto } from './dto/request/join-call-room.dto';
import { GetCallRoomsQueryDto } from './dto/request/get-call-rooms-query.dto';
import { GetCallRoomsByKeywordQueryDto } from './dto/request/get-call-room-by-keyword-query.dto';
import { UpdateCallRoomDto } from './dto/request/update-call-room.dto';
import { MediaService } from 'src/media/media.service';

@Injectable()
export class CallRoomsService {
  private readonly SPRING_SERVER_URL: string;
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly mediaService: MediaService,
  ) {
    this.SPRING_SERVER_URL = this.configService.getOrThrow<string>('SPRING_SERVER_URL');
  };

  async joinCallRoom(
    body: JoinCallRoomDto,
    roomIdx: number,
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.SPRING_SERVER_URL}/rooms/${roomIdx}/join`, body, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return data;
  }

  async createCallRoom(
    file: Express.Multer.File | undefined,
    body: CreateCallRoomDto,
    userIdx: number
  ) {
    const fileUUID = file ? await this.mediaService.mediaUpload(file, userIdx) : undefined;
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.SPRING_SERVER_URL}/rooms`, {
        ...body,
        thumbnail_uuid: fileUUID
      }, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return {
      ...data,
      fileUUID
    };
  }

  async getCallRooms(
    query: GetCallRoomsQueryDto
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/rooms`, {
        params: query
      })
    );

    return data;
  }

  async getCallRoomsByKeyword(
    query: GetCallRoomsByKeywordQueryDto
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/rooms/search`, {
        params: query
      })
    );

    return data;
  }

  async getCallRoomById(
    roomIdx: number,
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/rooms/${roomIdx}`)
    );

    return data;
  }

  async updateCallRoomById(
    file: Express.Multer.File | undefined,
    body: UpdateCallRoomDto,
    roomIdx: number,
    userIdx: number,
  ) {
    const fileUUID = file ? await this.mediaService.mediaUpload(file, userIdx) : undefined;
    
    const { data } = await firstValueFrom(
      this.httpService.patch(`${this.SPRING_SERVER_URL}/rooms/${roomIdx}`, {
        ...body,
        thumbnail_uuid: fileUUID
      }, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return {
      ...data,
      fileUUID
    };
  }

  async deleteCallRoomById(
    roomIdx: number,
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.delete(`${this.SPRING_SERVER_URL}/rooms/${roomIdx}`, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return data;
  }
}
