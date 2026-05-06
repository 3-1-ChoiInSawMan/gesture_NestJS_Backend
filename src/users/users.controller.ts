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

    return {
      data: {
        user: data
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

    return {
      data: {
        user: data
      },
      message
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
