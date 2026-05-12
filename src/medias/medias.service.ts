import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MediasService {
  private readonly SPRING_SERVER_URL: string;
    
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.SPRING_SERVER_URL = this.configService.getOrThrow<string>('SPRING_SERVER_URL');
  };

  async uploadMedia(
    file: Express.Multer.File | undefined,
    userIdx: number
  ) {
    if (!file) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    const formData = new FormData();

    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const { data } = await firstValueFrom(
      this.httpService.post(`${this.SPRING_SERVER_URL}/medias/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'X-User-Id': userIdx
          }
        }
      )
    );

    return data;
  }

  async getMediaByUUID(
    mediaUUID: string,
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/medias/${mediaUUID}`, {
        headers: {
          'X-User-Id': userIdx
        }}
      )
    );

    return data;
  }
}
