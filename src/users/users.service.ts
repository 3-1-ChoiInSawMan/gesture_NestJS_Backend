import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    private readonly httpService: HttpService,
  ) { };

  async withdrawAccount(
    userId: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.delete(`${process.env.SPRING_SERVER_URL}/users/withdraw`, {
        headers: {
          'X-User-Id': userId
        }
      })
    );

    return {
      data: data.data,
      message: data.message
    };
  }

  async getMyInformation(
    userId: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${process.env.SPRING_SERVER_URL}/users/me`, {
        headers: {
          'X-User-Id': userId
        }
      })
    );

    return {
      data: data.data,
      message: data.message
    };
  }

  async getUserInformation(
    userId: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${process.env.SPRING_SERVER_URL}/users/${userId}`)
    );

    return {
      data: data.data,
      message: data.message
    };
  }
}
