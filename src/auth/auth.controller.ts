import { Body, Controller, Delete, NotImplementedException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { EmailVerificationDto } from './dto/request/email-verification.dto';
import { RegisterDto } from './dto/request/register.dto';
import { EmailSendDto } from './dto/request/email-send.dto';
import { RefreshTokenDto } from './dto/request/refresh-token.dto';

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
  async handleSendEmail(@Body() body: EmailSendDto) {
    const { data, message } = await this.authService.sendEmailVerification(body);

    return {
      data: {
        data
      },
      message
    }
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

  @Post('refresh')
  async handleRefresh(
    @Body() body: RefreshTokenDto,
  ) {
    const { data, message } = await this.authService.refreshToken(body);

    return {
      data,
      message,
    };
  }

  @Delete('refresh-token')
  async handleDeleteRefreshToken(
    @Body() body: RefreshTokenDto,
  ) {
    const { data, message } = await this.authService.deleteRefreshToken(body);

    return {
      data,
      message,
    };
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
