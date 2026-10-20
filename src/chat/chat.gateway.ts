import { Logger, UseGuards } from "@nestjs/common";
import { TokenExpiredError } from "@nestjs/jwt";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import type { Socket } from 'socket.io';
import { AuthService } from "src/auth/auth.service";
import { disconnectWithAuthError } from "src/common/ws-error.util";
import { WsGuard } from "src/guards/ws.guard";
import { ChatService } from "./chat.service";
import { ChatMessagePayloadDto, ChatRoomPayloadDto } from "./dto/chat-message.dto";

@WebSocketGateway({
  namespace: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor (
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) { };
  private readonly logger = new Logger(ChatGateway.name);

  @UseGuards(WsGuard)
  @SubscribeMessage('join_chat')
  handleJoinChat(
    @MessageBody() payload: ChatRoomPayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    this.chatService.joinRoom(client, payload);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('send_message')
  handleSendMessage(
    @MessageBody() payload: ChatMessagePayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    this.chatService.relayMessage(client, payload);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @MessageBody() payload: ChatRoomPayloadDto,
    @ConnectedSocket() client: Socket
  ) {
    this.chatService.leaveRoom(client, payload);
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
      
      this.logger.log({ socketId: client.id, userIdx: payload.idx }, 'Chat socket connected');

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
    this.logger.log({ socketId: client.id, userIdx: (client.data as { user?: { idx?: number } }).user?.idx }, 'Chat socket disconnected');
  }
}
