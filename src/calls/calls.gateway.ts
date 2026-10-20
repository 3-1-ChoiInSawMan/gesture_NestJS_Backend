import { Logger, UseFilters, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import type { JwtPayload } from '../common/jwt-payload.interface';
import { disconnectWithAuthError } from '../common/ws-error.util';
import { WsGuard } from '../guards/ws.guard';
import { CallsService } from './calls.service';
import { CallWsExceptionFilter, CallWsResponseInterceptor } from './call-ws-response';
import { CallRoomPayloadDto } from './dto/call-signaling.dto';
import { SendFrameDto } from './dto/send-frame.dto';
import { SendAudioDto } from './dto/send-audio.dto';
import { ConnectTransportDto, ConsumeDto, ConsumerIdDto, CreateTransportDto, PreferredLayersDto, ProduceDto, ProducerIdDto, SetProducerPausedDto, TransportIdDto } from './dto/sfu-signaling.dto';

@WebSocketGateway({ namespace: '/calls' })
@UseGuards(WsGuard)
@UseFilters(CallWsExceptionFilter)
@UseInterceptors(CallWsResponseInterceptor)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(
    private readonly authService: AuthService,
    private readonly calls: CallsService,
  ) {}
  private readonly logger = new Logger(CallsGateway.name);

  afterInit(server: Server): void { this.calls.setServer(server); }

  @SubscribeMessage('join_call')
  join(
    @MessageBody() body: CallRoomPayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.joinSession(client, body.callRoomIdx);
  }
  
  @SubscribeMessage('leave_call')
  leave(
    @MessageBody() body: CallRoomPayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.leaveSession(client, body.callRoomIdx);
  }

  @SubscribeMessage('get_call_state')
  state(@ConnectedSocket() client: Socket) {
    return this.calls.sessionState(client);
  }

  @SubscribeMessage('get_producers')
  producers(@ConnectedSocket() client: Socket) {
    return this.calls.listProducers(client);
  }

  @SubscribeMessage('create_transport')
  createTransport(
    @MessageBody() body: CreateTransportDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.createTransport(client, body);
  }

  @SubscribeMessage('connect_transport')
  connectTransport(
    @MessageBody() body: ConnectTransportDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.connectTransport(client, body);
  }
  
  @SubscribeMessage('restart_ice')
  restartIce(
    @MessageBody() body: TransportIdDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.restartIce(client, body.transportId);
  }
  
  @SubscribeMessage('close_transport')
  closeTransport(
    @MessageBody() body: TransportIdDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.closeResource(client, 'transport', body.transportId);
  }
  
  @SubscribeMessage('produce')
  produce(
    @MessageBody() body: ProduceDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.produce(client, body);
  }
  
  @SubscribeMessage('set_producer_paused')
  setProducerPaused(
    @MessageBody() body: SetProducerPausedDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.setProducerPaused(client, body);
  }
  
  @SubscribeMessage('close_producer')
  closeProducer(
    @MessageBody() body: ProducerIdDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.closeResource(client, 'producer', body.producerId);
  }
  
  @SubscribeMessage('consume')
  consume(
    @MessageBody() body: ConsumeDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.consume(client, body);
  }
  
  @SubscribeMessage('resume_consumer')
  resumeConsumer(
    @MessageBody() body: ConsumerIdDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.resumeConsumer(client, body.consumerId);
  }
  
  @SubscribeMessage('close_consumer')
  closeConsumer(
    @MessageBody() body: ConsumerIdDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.closeResource(client, 'consumer', body.consumerId);
  }
  
  @SubscribeMessage('set_preferred_layers')
  setPreferredLayers(
    @MessageBody() body: PreferredLayersDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.setPreferredLayers(client, body);
  }
  
  @SubscribeMessage('send_frame')
  sendFrame(
    @MessageBody() body: SendFrameDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.sendFrame(body, client);
  }

  @SubscribeMessage('send_audio')
  sendAudio(
    @MessageBody() body: SendAudioDto,
    @ConnectedSocket() client: Socket
  ) {
    return this.calls.sendAudio(body, client);
  }

  async handleConnection(client: Socket): Promise<void> {
    const token: unknown = client.handshake.auth?.token ?? client.handshake.headers.authorization?.split(' ')[1];
    if (typeof token !== 'string' || !token) {
      disconnectWithAuthError(client, 'AUTH_007');
      return;
    }
    try {
      const user = await this.authService.verifyToken(token);
      if (!client.connected) return;
      (client.data as { user?: JwtPayload }).user = user;
      client.emit('calls_ready', { socketId: client.id });
    } catch (error) {
      disconnectWithAuthError(client, error instanceof TokenExpiredError ? 'AUTH_002' : 'AUTH_001');
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    try { await this.calls.disconnectSocket(client); }
    catch (error: unknown) { this.logger.error({ err: error, socketId: client.id }, 'Call disconnect cleanup failed'); }
  }
}
