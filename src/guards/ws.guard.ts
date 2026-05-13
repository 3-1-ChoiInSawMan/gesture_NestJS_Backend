import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from 'socket.io';
import { ErrorCode } from "src/common/error-code";
import { JwtPayload } from "src/common/jwt-payload.interface";

@Injectable()
export class WsGuard implements CanActivate {
  private readonly publicKey: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.publicKey = this.configService.getOrThrow<string>('SECURITY_PUBLIC_KEY').replace(/\\n/g, '\n');
  };

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context
      .switchToWs()
      .getClient();

    const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      client.emit('error', {
        statusCode: 'AUTH_007',
        message: ErrorCode.AUTH_007,
      });

      client.disconnect();
      throw new WsException(ErrorCode.AUTH_007);
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        publicKey: this.publicKey,
        algorithms: ['RS256'],
      });

      client.data.user = payload;
      return true;
    } catch {
      client.emit('error', {
        statusCode: 'AUTH_001',
        message: ErrorCode.AUTH_001,
      });

      client.disconnect(true);
      throw new WsException(ErrorCode.AUTH_001);
    }
  }
}