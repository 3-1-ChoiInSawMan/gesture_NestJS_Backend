import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/decorators/get-user.decorator';
import { JwtGuard } from 'src/guards/jwt.guard';
import type { JwtPayload } from 'src/common/jwt-payload.interface';
import { ChatRoomsService } from './chat-rooms.service';
import { GetChatMessagesQueryDto } from './dto/request/get-chat-messages-query.dto';
import { SendChatMessageDto } from './dto/request/send-chat-message.dto';
import { ReadChatRoomDto } from './dto/request/read-chat-room.dto';
import { ReplyChatRoomInvitationDto } from './dto/request/reply-chat-room-invitation.dto';

@Controller({ path: '/chat-rooms', version: '1' })
export class ChatRoomsController {
  constructor(
    private readonly chatRoomsService: ChatRoomsService,
  ) {};

  // 채팅방 생성
  @UseGuards(JwtGuard)
  @Post()
  async handleCreateChatRoom(
    @Body() body: Record<string, unknown>,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.chatRoomsService.createChatRoom(body, user.idx);

    return {
      data,
      message,
    };
  }

  // 내 채팅방 목록 조회
  @UseGuards(JwtGuard)
  @Get()
  async handleGetChatRooms(
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.chatRoomsService.getChatRooms(user.idx);

    return {
      data,
      message,
    };
  }

  // 채팅방 초대 수락/거절
  @UseGuards(JwtGuard)
  @Patch('/invitations/:invitationIdx')
  async handleReplyInvitation(
    @Param('invitationIdx', new ParseIntPipe()) invitationIdx: number,
    @Body() body: ReplyChatRoomInvitationDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.chatRoomsService.replyInvitation(invitationIdx, body, user.idx);

    return {
      data,
      message,
    };
  }

  // 채팅방 상세 조회
  @UseGuards(JwtGuard)
  @Get('/:chatRoomIdx')
  async handleGetChatRoom(
    @Param('chatRoomIdx', new ParseIntPipe()) chatRoomIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.chatRoomsService.getChatRoom(chatRoomIdx, user.idx);

    return {
      data,
      message,
    };
  }

  // 메시지 목록 조회
  @UseGuards(JwtGuard)
  @Get('/:chatRoomIdx/messages')
  async handleGetMessages(
    @Param('chatRoomIdx', new ParseIntPipe()) chatRoomIdx: number,
    @Query() query: GetChatMessagesQueryDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.chatRoomsService.getMessages(chatRoomIdx, query, user.idx);

    return {
      data,
      message,
    };
  }

  // 메시지 전송
  @UseGuards(JwtGuard)
  @Post('/:chatRoomIdx/messages')
  async handleSendMessage(
    @Param('chatRoomIdx', new ParseIntPipe()) chatRoomIdx: number,
    @Body() body: SendChatMessageDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.chatRoomsService.sendMessage(chatRoomIdx, body, user.idx);

    return {
      data,
      message,
    };
  }

  // 메시지 읽음 처리
  @UseGuards(JwtGuard)
  @Patch('/:chatRoomIdx/read')
  async handleReadChatRoom(
    @Param('chatRoomIdx', new ParseIntPipe()) chatRoomIdx: number,
    @Body() body: ReadChatRoomDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.chatRoomsService.readChatRoom(chatRoomIdx, body, user.idx);

    return {
      data,
      message,
    };
  }
}
