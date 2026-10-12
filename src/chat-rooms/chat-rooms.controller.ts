import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/decorators/get-user.decorator';
import { JwtGuard } from 'src/guards/jwt.guard';
import type { JwtPayload } from 'src/common/jwt-payload.interface';
import { ChatRoomsService } from './chat-rooms.service';
import { GetChatMessagesQueryDto } from './dto/request/get-chat-messages-query.dto';
import { SendChatMessageDto } from './dto/request/send-chat-message.dto';
import { ReadChatRoomDto } from './dto/request/read-chat-room.dto';
import { ReplyChatRoomInvitationDto } from './dto/request/reply-chat-room-invitation.dto';
import { CreateDirectMessageRoomDto } from './dto/request/create-direct-message-room.dto';

@Controller({ path: '/chat-rooms', version: '1' })
export class ChatRoomsController {
  constructor(
    private readonly chatRoomsService: ChatRoomsService,
  ) {};

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

  @UseGuards(JwtGuard)
  @Post('/dm')
  async handleGetOrCreateDirectMessageRoom(
    @Body() body: CreateDirectMessageRoomDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.chatRoomsService.getOrCreateDirectMessageRoom(body.targetUserIdx, user.idx);

    return {
      data,
      message,
    };
  }

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
