import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import { ErrorCode } from 'src/common/error-code';
import type { JwtPayload } from 'src/common/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly publicKey: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.publicKey = this.configService.getOrThrow<string>('SECURITY_PUBLIC_KEY').replace(/\\n/g, '\n');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(ErrorCode.AUTH_007);
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        publicKey: this.publicKey,
        algorithms: ['RS256'],
      });

      request.user = payload;

      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(ErrorCode.AUTH_002);
      }

      throw new UnauthorizedException(ErrorCode.AUTH_001);
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization;
    const rawHeader = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (!rawHeader) {
      return null;
    }

    const [scheme, token] = rawHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
