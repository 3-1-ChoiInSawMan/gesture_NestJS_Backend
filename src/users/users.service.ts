import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { UpdatePasswordDto } from './dto/request/update-password.dto';
import { UpdateMyInformationDto } from './dto/request/update-my-information.dto';
import { MediasService } from 'src/medias/medias.service';

@Injectable()
export class UsersService {
  private readonly SPRING_SERVER_URL: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly mediasService: MediasService,
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

    return data;
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

    return data;
  }

  async getUserInformation(
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/users/${userIdx}`)
    );

    return data;
  }

  async updateMyInformation(
    file: Express.Multer.File | undefined,
    body: UpdateMyInformationDto,
    userIdx: number
  ) {
    const _file = file ? await this.mediasService.uploadMedia(file, userIdx) : undefined;

    const { data } = await firstValueFrom(
      this.httpService.patch(`${this.SPRING_SERVER_URL}/users/me`, {
        ...body,
        profile_image_uuid: _file.data.file_uuid
      }, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return {
      ...data,
      fileUUID: _file.data.file_uuid
    };
  }

  async updatePassword(
    body: UpdatePasswordDto,
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.patch(`${this.SPRING_SERVER_URL}/users/password`, body, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );

    return data;
  }

  async getSpecifyUserInformation(
    userId: string
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/users?userId=${userId}`)
    );

    return data;
  }
}
