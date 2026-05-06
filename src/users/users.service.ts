import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  private readonly SPRING_SERVER_URL: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.SPRING_SERVER_URL = this.configService.getOrThrow<string>('SPRING_SERVER_URL');
  };

  async withdrawAccount(
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.delete(`${this.SPRING_SERVER_URL}/users/withdraw`, {
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

  async getMyInformation(
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/users/me`, {
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

  async getUserInformation(
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/users/${userIdx}`)
    );

    return {
      data: data.data,
      message: data.message
    };
  }

  async getSpecifyUserInformation(
    userId: string
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/users?userId=${userId}`)
    );

    return {
      data: data.data,
      message: data.message
    };
  }
}
