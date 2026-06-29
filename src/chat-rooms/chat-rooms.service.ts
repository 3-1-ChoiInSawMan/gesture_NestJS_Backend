import { Injectable } from '@nestjs/common';
import { CoreHttpService } from 'src/core-http/core-http.service';
import { convertKeysToSnakeCase } from 'src/utils/convert-snake';
import { GetChatMessagesQueryDto } from './dto/request/get-chat-messages-query.dto';
import { GetChatMessagesResponse } from './dto/core/response/GetChatMessagesResponse.interface';
import { SendChatMessageDto } from './dto/request/send-chat-message.dto';
import { ReadChatRoomDto } from './dto/request/read-chat-room.dto';
import { ReplyChatRoomInvitationDto } from './dto/request/reply-chat-room-invitation.dto';
import {
  ChatRoomDetail,
  ChatRoomInvitationResponse,
  ChatRoomReadResponse,
  ChatRoomSummary,
} from './dto/core/response/ChatRoomResponse.interface';
import { ChatMessage } from './dto/core/response/GetChatMessagesResponse.interface';

@Injectable()
export class ChatRoomsService {
  constructor(
    private readonly coreHttpService: CoreHttpService,
  ) {};

  async createChatRoom(
    body: Record<string, unknown>,
    userIdx: number,
  ) {
    return this.coreHttpService.post<ChatRoomDetail>('/chat-rooms', convertKeysToSnakeCase(body ?? {}), {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async getChatRooms(
    userIdx: number,
  ) {
    return this.coreHttpService.get<ChatRoomSummary[]>('/chat-rooms', {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async getChatRoom(
    chatRoomIdx: number,
    userIdx: number,
  ) {
    return this.coreHttpService.get<ChatRoomDetail>(`/chat-rooms/${chatRoomIdx}`, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async getMessages(
    chatRoomIdx: number,
    query: GetChatMessagesQueryDto,
    userIdx: number,
  ) {
    return this.coreHttpService.get<GetChatMessagesResponse>(`/chat-rooms/${chatRoomIdx}/messages`, {
      headers: {
        'X-User-Id': userIdx,
      },
      params: {
        cursor: query.cursor,
        size: query.size,
      },
    });
  }

  async sendMessage(
    chatRoomIdx: number,
    body: SendChatMessageDto,
    userIdx: number,
  ) {
    return this.coreHttpService.post<ChatMessage>(`/chat-rooms/${chatRoomIdx}/messages`, this.normalizeSendMessageBody(body), {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async readChatRoom(
    chatRoomIdx: number,
    body: ReadChatRoomDto,
    userIdx: number,
  ) {
    return this.coreHttpService.patch<ChatRoomReadResponse>(`/chat-rooms/${chatRoomIdx}/read`, {
      last_read_message_idx: body.last_read_message_idx ?? body.lastReadMessageIdx,
    }, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async replyInvitation(
    invitationIdx: number,
    body: ReplyChatRoomInvitationDto,
    userIdx: number,
  ) {
    return this.coreHttpService.patch<ChatRoomInvitationResponse>(`/chat-rooms/invitations/${invitationIdx}`, {
      accept: body.accept,
    }, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  private normalizeSendMessageBody(
    body: SendChatMessageDto,
  ) {
    if (body.type === 'FILE') {
      return {
        type: body.type,
        file_uuid: body.file_uuid ?? body.fileUuid,
      };
    }

    return {
      type: body.type,
      message: body.message,
    };
  }
}
