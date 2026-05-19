import { Body, Controller, NotImplementedException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { EmailVerificationDto } from './dto/request/email-verification.dto';
import { RegisterDto } from './dto/request/register.dto';

@Controller({ path: '/auth', version: '1' })
export class AuthControllerV1 {
  constructor (
    private readonly authService: AuthService,
  ) { };
  /* 계정 관련 로직 */

  @Post('login')
  async handleLogin(
    @Body() body: LoginDto,
  ) {
    const { data, message } = await this.authService.login(body);

    return {
      data: {
        user: data
      },
      message,
    };
  }

  @Post('email-send')
  handleSendEmail() {
    throw new NotImplementedException();
  }

  @Post('email-verification')
  async handleVerifyEmail(
    @Body() body: EmailVerificationDto,
  ) {
    const { data, message } = await this.authService.verifyEmail(body);

    return {
      data: {
        email_verification: data
      },
      message,
    };
  }

  @Post('register')
  async handleRegister(
    @Body() body: RegisterDto,
  ) {
    const { data, message } = await this.authService.register(body);

    return {
      data: {
        user: data
      },
      message,
    };
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
