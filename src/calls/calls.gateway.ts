import { UseGuards } from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Logger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { disconnectWithAuthError } from 'src/common/ws-error.util';
import { WsGuard } from 'src/guards/ws.guard';
import { CallsService } from './calls.service';

@WebSocketGateway({
  namespace: '/calls'
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(
    private readonly authService: AuthService,
    private readonly callsService: CallsService,
    private readonly logger: Logger,
  ) { };

  afterInit(server: Server) {
    this.callsService.setServer(server);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('send_frame')
  handleSendFrame(
    @MessageBody() frame: object,
    @ConnectedSocket() client: Socket
  ) {
    this.callsService.sendFrame(frame, client);
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];
    const callRoomIdx = Number(client.handshake.query.call_room_idx);

    if (!token) {
      disconnectWithAuthError(client, 'AUTH_007');

      return;
    }

    if (!callRoomIdx || !Number.isInteger(callRoomIdx) || callRoomIdx <= 0) {
      disconnectWithAuthError(client, 'COMMON_400');

      return;
    }

    try {
      const payload = await this.authService.verifyToken(token);

      client.data.user = payload;
      client.data.callRoomIdx = callRoomIdx;
      
      this.logger.log(`Connected: ${client.id}`);

      this.callsService.connectSocket(client, callRoomIdx);

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
