import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from 'src/common/jwt-payload.interface';
import { CoreHttpService } from 'src/core-http/core-http.service';
import { LoginDto } from './dto/request/login.dto';
import { LoginResponse } from './dto/core/response/LoginResponse.interface';
import { EmailVerificationDto } from './dto/request/email-verification.dto';
import { EmailVerificationResponse } from './dto/core/response/EmailVerificationResponse.interface';
import { RegisterDto } from './dto/request/register.dto';
import { RegisterResponse } from './dto/core/response/RegisterResponse.interface';

@Injectable()
export class AuthService {
  private readonly publicKey: string;

  constructor (
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly coreHttpService: CoreHttpService,
  ) {
    this.publicKey = this.configService.getOrThrow<string>('SECURITY_PUBLIC_KEY').replace(/\\n/g, '\n');
  };

  public async login(body: LoginDto) {
    return await this.coreHttpService.post<LoginResponse>('/auth/login', body);
  }

  public async verifyEmail(body: EmailVerificationDto) {
    return await this.coreHttpService.post<EmailVerificationResponse>('/auth/email-verification', body);
  }

  public async register(body: RegisterDto) {
    return await this.coreHttpService.post<RegisterResponse>('/auth/register', body);
  }

  public async verifyToken(
    token: string
  ): Promise<JwtPayload> {
    return await this.jwtService.verifyAsync<JwtPayload>(token, {
      publicKey: this.publicKey,
      algorithms: ['RS256'],
    });
  }
}
