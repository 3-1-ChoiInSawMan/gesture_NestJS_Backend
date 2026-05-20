import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetUser } from 'src/decorators/get-user.decorator';
import type { JwtPayload } from 'src/common/jwt-payload.interface';
import { JwtGuard } from 'src/guards/jwt.guard';
import { UpdatePasswordDto } from './dto/client/request/update-password.dto';
import { UpdateMyInformationDto } from './dto/client/request/update-my-information.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller({ path: '/users', version: '1' })
export class UsersControllerV1 {
  constructor (
    private readonly usersService: UsersService,
  ) { };

  @UseGuards(JwtGuard)
  @Delete('/withdraw')
  async handleWithdrawAccount(
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.usersService.withdrawAccount(user.idx);

    return {
      data: {
        user: data
      },
      message,
    };
  }

  @UseGuards(JwtGuard)
  @Get('/me')
  async handleGetMyInformation(
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.usersService.getMyInformation(user.idx);

    return {
      data: {
        user: data
      },
      message,
    };
  }

  @Get('/:userIdx')
  async handleGetUserInformation(
    @Param('userIdx', new ParseIntPipe()) userIdx: number
  ) {
    const { data, message } = await this.usersService.getUserInformation(userIdx);

    return {
      data: {
        user: data
      },
      message,
    };
  }

  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('profile_image'))
  @Patch('/me')
  async handleUpdateMyInformation(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UpdateMyInformationDto,
    @GetUser() user: JwtPayload
  ) {
    const { response, fileUUID } = await this.usersService.updateMyInformation(file, body, user.idx);

    const _user = {
      ...response.data,
      profileUUID: fileUUID
    };

    return {
      data: {
        user: _user
      },
      message: response.message,
    };
  }

  @UseGuards(JwtGuard)
  @Patch('/password')
  async handleUpdatePassword(
    @Body() body: UpdatePasswordDto,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.usersService.updatePassword(body, user.idx);

    return {
      data: {
        user: data
      },
      message,
    };
  }

  @Get()
  async handleGetSpecifyUserInformation(
    @Query('userId') userId: string
  ) {
    const { data, message } = await this.usersService.getSpecifyUserInformation(userId);

    return {
      data: {
        users: data
      },
      message,
    };
  }
}
