import { Controller, NotImplementedException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller({ path: '/auth', version: '1' })
export class AuthControllerV1 {
  constructor (
    private readonly authService: AuthService,
  ) { };
  /* 계정 관련 로직 */

  @Post('login')
  handleLogin() {
    throw new NotImplementedException();
  }

  @Post('email-send')
  handleSendEmail() {
    throw new NotImplementedException();
  }

  @Post('email-verification')
  handleVerifyEmail() {
    throw new NotImplementedException();
  }

  @Post('register')
  handleRegister() {
    throw new NotImplementedException();
  }

  // 쿠키 기반 인증 시스템 사용 할건지 합의 필요
  @Post('refresh')
  handleRefresh() {
    throw new NotImplementedException();
  }

  /**
   * 계정 복구
   */
  @Post('recover')
  handleRecoverAccount() {
    throw new NotImplementedException();
  }  

  @Post('logout')
  handleLogout() {
    throw new NotImplementedException(); 
  }  


}
