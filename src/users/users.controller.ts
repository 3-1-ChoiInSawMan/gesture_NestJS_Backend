import { Controller, Delete, Get, NotImplementedException, Param, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller({ path: '/api/users' })
export class UsersController {
  constructor (
    private readonly usersService: UsersService,
  ) { };

  /**
   * 회원 탈퇴 컨트롤러
   */
  @Delete('withdraw')
  handleWithdrawAccount() {
    throw new NotImplementedException();
  }

  /**
   * 회원 탈퇴 확인 컨트롤러
   * @param code handleWithdrawAccount에 요청했을 때 생성된 UUID
   */
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
