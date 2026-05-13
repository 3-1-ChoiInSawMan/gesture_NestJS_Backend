import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from 'src/common/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly publicKey: string;

  constructor (
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.publicKey = this.configService.getOrThrow<string>('SECURITY_PUBLIC_KEY').replace(/\\n/g, '\n');
  };

  public async verifyToken(
    token: string
  ): Promise<JwtPayload> {
    return await this.jwtService.verifyAsync<JwtPayload>(token, {
      publicKey: this.publicKey,
      algorithms: ['RS256'],
    });
  }

  public async registerEmail() {
    
  }
}
