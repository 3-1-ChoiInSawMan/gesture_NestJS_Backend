import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCallRoomDto } from './dto/request/create-call-room.dto';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CallRoomCategory } from './enums/call-room-category.enum';
import { CallRoomSort } from './enums/call-room-sort.enum';
import { JoinCallRoomDto } from './dto/request/join-call-room.dto';
import { GetCallRoomsQueryDto } from './dto/request/get-call-rooms-query.dto';
import { GetCallRoomsByKeywordQueryDto } from './dto/request/get-call-room-by-keyword-query.dto';

@Injectable()
export class CallRoomsService {
  private readonly SPRING_SERVER_URL: string;
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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

    return {
      data: data.data,
      message: data.message
    };
  }

  // form-data 전송 로직 필요
  async createCallRoom(
    file: Express.Multer.File | undefined,
    body: CreateCallRoomDto,
    userIdx: number
  ) {
    if (!file) {}
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.SPRING_SERVER_URL}/rooms`, body, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return {
      data: data.data,
      message: data.message
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

    return {
      data: data.data,
      message: data.message
    };
  }

  async getCallRoomsByKeyword(
    query: GetCallRoomsByKeywordQueryDto
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/rooms/search`, {
        params: query
      })
    );

    return {
      data: data.data,
      message: data.message
    };
  }

  async getCallRoomById(
    roomIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/rooms/${roomIdx}`)
    );

    return {
      data: data.data,
      message: data.message
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

    return {
      data: data.data,
      message: data.message
    };
  }
}
