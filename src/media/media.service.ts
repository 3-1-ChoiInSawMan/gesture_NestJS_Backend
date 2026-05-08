import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MediaService {
  private readonly SPRING_SERVER_URL: string;
    
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.SPRING_SERVER_URL = this.configService.getOrThrow<string>('SPRING_SERVER_URL');
  };

  async mediaUpload(
    file: Express.Multer.File,
    userIdx: number
  ) {
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

    return data.data.media_uuid;
  }
}
