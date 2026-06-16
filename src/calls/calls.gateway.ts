import { UseGuards } from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Logger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { disconnectWithAuthError } from 'src/common/ws-error.util';
import { WsGuard } from 'src/guards/ws.guard';
import { CallsService } from './calls.service';
import { CallRoomPayloadDto, SignalingPayloadDto } from './dto/call-signaling.dto';
import { SendFrameDto } from './dto/send-frame.dto';

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
    @MessageBody() payload: SendFrameDto,
    @ConnectedSocket() client: Socket
  ) {
    this.callsService.sendFrame(payload, client);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('join_call')
  async handleJoinCall(
    @MessageBody() payload: CallRoomPayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    const { callRoomIdx } = payload;

    if (!this.callsService.isValidCallRoomIdx(callRoomIdx)) {
      disconnectWithAuthError(client, 'COMMON_400');

      return;
    }

    await this.callsService.joinSignalingRoom(client, callRoomIdx);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() payload: SignalingPayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    this.callsService.relaySignalingMessage('offer', payload, client);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() payload: SignalingPayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    this.callsService.relaySignalingMessage('answer', payload, client);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('ice_candidate')
  handleIceCandidate(
    @MessageBody() payload: SignalingPayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    this.callsService.relaySignalingMessage('ice_candidate', payload, client);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('leave_call')
  handleLeaveCall(
    @MessageBody() payload: CallRoomPayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    const { callRoomIdx } = payload;

    if (!this.callsService.isValidCallRoomIdx(callRoomIdx)) {
      disconnectWithAuthError(client, 'COMMON_400');

      return;
    }

    this.callsService.leaveSignalingRoom(client, callRoomIdx);
  }

  async handleConnection(client: Socket) {
    const handshake = client.handshake;
    const token: string | undefined = handshake.auth?.token || handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      disconnectWithAuthError(client, 'AUTH_007');

      return;
    }

    try {
      const payload = await this.authService.verifyToken(token);

      client.data.user = payload;
      
      this.logger.log(`Connected: ${client.id}`);

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
