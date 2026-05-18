import { Injectable } from '@nestjs/common';
import { UpdatePasswordDto } from './dto/client/request/update-password.dto';
import { UpdateMyInformationDto } from './dto/client/request/update-my-information.dto';
import { MediasService } from 'src/medias/medias.service';
import { CoreHttpService } from 'src/core-http/core-http.service';

import { CoreResponse } from 'src/common/core-response.interface';
import { UsersWithdraw } from './dto/core/response/UsersWithdraw.interface';
import { UsersMe } from './dto/core/response/UsersMe.interface';
import { SearchedUsersInformation, UpdatedUsersInformation, UsersInformation } from './dto/core/response/UsersInformation.interface';
import { UsersPassword } from './dto/core/response/UsersPassword.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly mediasService: MediasService,
    private readonly coreHttpService: CoreHttpService,
  ) { };

  async withdrawAccount(
    userIdx: number
  ) {
    const response = await this.coreHttpService.delete<CoreResponse<UsersWithdraw>>('/users/withdraw', {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async getMyInformation(
    userIdx: number
  ) {
    const response = await this.coreHttpService.get<CoreResponse<UsersMe>>(`/users/me`, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async getUserInformation(
    userIdx: number
  ) {
    const response = await this.coreHttpService.get<CoreResponse<UsersInformation>>(`/users/${userIdx}`);

    return response;
  }

  async updateMyInformation(
    file: Express.Multer.File | undefined,
    body: UpdateMyInformationDto,
    userIdx: number
  ) {
    const _file = file ? await this.mediasService.uploadMedia(file, userIdx) : undefined;

    const response = await this.coreHttpService.patch<CoreResponse<UpdatedUsersInformation>>('/users/me', {
      ...body,
      profile_image_uuid: _file.data.file_uuid
    }, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return {
      response,
      fileUUID: _file.data.file_uuid,
    };
  }

  async updatePassword(
    body: UpdatePasswordDto,
    userIdx: number
  ) {
    const response = await this.coreHttpService.patch<CoreResponse<UsersPassword>>('/users/password', body, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async getSpecifyUserInformation(
    userId: string
  ) {
    const response = await this.coreHttpService.get<CoreResponse<SearchedUsersInformation[]>>(`/users?userId=${userId}`)

    return response;
  }
}
