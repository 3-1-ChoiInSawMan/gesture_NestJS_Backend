import { Injectable } from '@nestjs/common';
import { UpdatePasswordDto } from './dto/client/request/update-password.dto';
import { UpdateMyInformationDto } from './dto/client/request/update-my-information.dto';
import { MediasService } from 'src/medias/medias.service';
import { CoreHttpService } from 'src/core-http/core-http.service';

import { UsersWithdrawResponse } from './dto/core/response/UsersWithdrawResponse.interface';
import { UsersMeResponse } from './dto/core/response/UsersMeResponse.interface';
import { SearchedUsersInformationResponse, UpdatedUsersInformationResponse, UsersInformationResponse } from './dto/core/response/UsersInformationResponse.interface';
import { UsersPasswordResponse } from './dto/core/response/UsersPasswordResponse.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly mediasService: MediasService,
    private readonly coreHttpService: CoreHttpService,
  ) { };

  async withdrawAccount(
    userIdx: number
  ) {
    const response = await this.coreHttpService.delete<UsersWithdrawResponse>('/users/withdraw', {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async getMyInformation(
    userIdx: number
  ) {
    const response = await this.coreHttpService.get<UsersMeResponse>(`/users/me`, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async getUserInformation(
    userIdx: number
  ) {
    const response = await this.coreHttpService.get<UsersInformationResponse>(`/users/${userIdx}`);

    return response;
  }

  async updateMyInformation(
    file: Express.Multer.File | undefined,
    body: UpdateMyInformationDto,
    userIdx: number
  ) {
    const _file = file ? await this.mediasService.uploadMedia(file, userIdx) : undefined;

    const response = await this.coreHttpService.patch<UpdatedUsersInformationResponse>('/users/me', {
      ...body,
      profile_image_uuid: _file?.data.mediaUuid ?? null
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

  async updatePassword(
    body: UpdatePasswordDto,
    userIdx: number
  ) {
    const response = await this.coreHttpService.patch<UsersPasswordResponse>('/users/password', body, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async getSpecifyUserInformation(
    userId: string
  ) {
    const response = await this.coreHttpService.get<SearchedUsersInformationResponse[]>(`/users?userId=${userId}`)

    return response;
  }
}
