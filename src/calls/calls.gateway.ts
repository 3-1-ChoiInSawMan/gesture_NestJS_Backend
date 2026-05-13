import { UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Logger } from 'nestjs-pino';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { disconnectWithAuthError } from 'src/common/ws-error.util';
import { WsGuard } from 'src/guards/ws.guard';

@WebSocketGateway({
  namespace: '/calls'
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: Logger,
  ) { };

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
      disconnectWithAuthError(client, 'AUTH_007');

      return;
    }

    try {
      const payload = await this.authService.verifyToken(token);

      if (!payload) {
        disconnectWithAuthError(client, 'AUTH_001');

        return;
      }

      client.data.user = payload;
      
      this.logger.log(`Connected: ${client.id}`);

      return;
    } catch {
      disconnectWithAuthError(client, 'AUTH_001');

      return;
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected: ${client.id}`);
  }
}
