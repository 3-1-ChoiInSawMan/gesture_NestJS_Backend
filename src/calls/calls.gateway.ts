import { UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ErrorCode } from 'src/common/error-code';
import { JwtPayload } from 'src/common/jwt-payload.interface';
import { WsGuard } from 'src/guards/ws.guard';

@WebSocketGateway(80, {
  namespace: '/calls'
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly publicKey: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.publicKey = this.configService.getOrThrow<string>('SECURITY_PUBLIC_KEY').replace(/\\n/g, '\n');
  };

  @UseGuards(WsGuard)
  @SubscribeMessage('frame')
  handleMessage(
    @MessageBody() frame: Buffer,
    @ConnectedSocket() client: Socket,
  ) {
    // AI 서버 프레임 전송 로직 구현 예정
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      client.emit('error', {
        statusCode: 'AUTH_007',
        message: ErrorCode.AUTH_007,
      });

      client.disconnect();

      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        publicKey: this.publicKey,
        algorithms: ['RS256'],
      });

      client.data.user = payload;

      console.log(`Connected: ${client.id}`);

      return;
    } catch {
      client.emit('error', {
        statusCode: 'AUTH_001',
        message: ErrorCode.AUTH_001,
      });

      client.disconnect();

      return;
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Disconnection: ${client.id}`);
  }
}
