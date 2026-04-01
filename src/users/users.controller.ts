import { Controller, Delete, Get, NotImplementedException, Param, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller({ path: '/api/users' })
export class UsersController {
  constructor (
    private readonly usersService: UsersService,
  ) { };


  @Delete('withdraw')
  handleWithdrawAccount() {
    throw new NotImplementedException();
  }

  @Get('withdraw')
  handleConfirmWithdrawAccount(@Query('confirmationCode') code: string) {
    throw new NotImplementedException();
  }

  @Get(':userId')
  handleGetUserInformation(@Param('userId') userId: string) {
    throw new NotImplementedException();
  }

  @Get()
  handleGetMyInformation() {
    throw new NotImplementedException();
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
  handleGetSpecifyUserInformation(@Query('userId') userId: string) {
    throw new NotImplementedException();
  }
}
