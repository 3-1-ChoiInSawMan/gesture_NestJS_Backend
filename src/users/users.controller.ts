import { Controller, Delete, Get, NotImplementedException, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetUser } from 'src/decorators/get-user.decorator';
import { type JwtPayload } from 'src/common/jwt-payload.interface';
import { JwtGuard } from 'src/guards/jwt.guard';

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

    const _user = {
      idx: data.idx,
      nickname: data.nickname,
      id: data.id,
      is_deactivated: data.is_deactivated
    };

    return {
      data: {
        user: _user
      },
      message
    };
  }

  @UseGuards(JwtGuard)
  @Get('/me')
  async handleGetMyInformation(
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.usersService.getMyInformation(user.idx);

    const _user = {
      idx: data.idx,
      nickname: data.nickname,
      id: data.id,
      status_message: data.status_message,
      profile_url: data.profile_url
    };

    return {
      data: {
        user: _user
      },
      message
    };
  }

  @Get('/:userId')
  async handleGetUserInformation(
    @Param('userId', ParseIntPipe) userId: number
  ) {
    const { data, message } = await this.usersService.getUserInformation(userId);

    const user = {
      idx: data.idx,
      nickname: data.nickname,
      id: data.id,
      status_message: data.status_message,
      profile_url: data.profile_url
    };

    return {
      data: {
        user
      },
      message
    };
  }

  @Patch()
  handleUpdateMyInformation() {
    throw new NotImplementedException();
  }

  @Patch('password')
  handleUpdatePassword() {
    throw new NotImplementedException();
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
      message
    };
  }
}
