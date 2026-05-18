import { BadRequestException, Injectable } from '@nestjs/common';
import FormData from 'form-data';
import { CoreResponse } from 'src/common/core-response.interface';
import { CoreHttpService } from 'src/core-http/core-http.service';
import { MediaUpload } from './dto/core/response/MediaUpload.interface';
import { MediaUrl } from './dto/core/response/MediaUrl.interface';

@Injectable()
export class MediasService {

  constructor(
    private readonly coreHttpService: CoreHttpService,
  ) { };

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

    const response = await this.coreHttpService.post<CoreResponse<MediaUpload>>(`/medias/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-User-Id': userIdx
        }
      }
    )

    return response;
  }

  async getMediaByUUID(
    mediaUUID: string,
    userIdx: number
  ) {
    const _mediaUUID = encodeURIComponent(mediaUUID);

    const response = await this.coreHttpService.get<CoreResponse<MediaUrl>>(`/medias/${_mediaUUID}`, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }
}
