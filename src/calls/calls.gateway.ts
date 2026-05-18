import { UseGuards } from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Logger } from 'nestjs-pino';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { disconnectWithAuthError } from 'src/common/ws-error.util';
import { WsGuard } from 'src/guards/ws.guard';
import { CallsService } from './calls.service';

@WebSocketGateway({
  namespace: '/calls'
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly authService: AuthService,
    private readonly callsService: CallsService,
    private readonly logger: Logger,
  ) { };

  @UseGuards(WsGuard)
  @SubscribeMessage('send_frame')
  handleSendFrame(
    @MessageBody() frame: object,
  ) {
    this.callsService.sendFrame(frame);
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      disconnectWithAuthError(client, 'AUTH_007');

      return;
    }

    try {
      const payload = await this.authService.verifyToken(token);

      client.data.user = payload;
      
      this.logger.log(`Connected: ${client.id}`);

      this.callsService.connectSocket(client);

      return;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        disconnectWithAuthError(client, 'AUTH_002');

        return;
      }
      
      disconnectWithAuthError(client, 'AUTH_001');

      return;
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected: ${client.id}`);
    this.callsService.disconnectSocket(client);
  }
}
