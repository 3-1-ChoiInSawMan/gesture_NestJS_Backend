import { BadRequestException, Injectable } from '@nestjs/common';
import { CoreHttpService } from 'src/core-http/core-http.service';
import { RedisStreamService } from 'src/redis/redis-stream.service';
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

interface DirectMessageRoom extends ChatRoomDetail {
  roomType: 'dm';
  targetUserIdx: number;
}

interface DirectMessageSummary extends ChatRoomSummary {
  roomType?: 'dm';
  targetUserIdx?: number;
}

interface NotificationResponse {
  idx: number;
  type: string;
  content: string;
  targetId?: string;
  actor?: {
    idx: number;
  };
  createdAt?: string;
  read?: boolean;
}

@Injectable()
export class ChatRoomsService {
  private readonly directMessageNamePrefix = '__dm:';
  private readonly directMessageRedisPrefix = 'chat:dm';

  constructor(
    private readonly coreHttpService: CoreHttpService,
    private readonly redisStreamService: RedisStreamService,
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
    const response = await this.coreHttpService.get<ChatRoomSummary[]>('/chat-rooms', {
      headers: {
        'X-User-Id': userIdx,
      },
    });

    response.data = await Promise.all(
      response.data.map((chatRoom) => this.decorateChatRoomSummary(chatRoom, userIdx)),
    );

    return response;
  }

  async getChatRoom(
    chatRoomIdx: number,
    userIdx: number,
  ) {
    const response = await this.coreHttpService.get<ChatRoomDetail>(`/chat-rooms/${chatRoomIdx}`, {
      headers: {
        'X-User-Id': userIdx,
      },
    });

    response.data = this.decorateChatRoomDetail(response.data, userIdx);

    return response;
  }

  async getOrCreateDirectMessageRoom(
    targetUserIdx: number,
    userIdx: number,
  ) {
    if (targetUserIdx === userIdx) {
      throw new BadRequestException('자기 자신과의 DM은 생성할 수 없습니다.');
    }

    const pair = this.getDirectMessagePair(userIdx, targetUserIdx);
    const redisKey = this.getDirectMessageRedisKey(pair.low, pair.high);
    const cachedChatRoomIdx = await this.getCachedDirectMessageRoomIdx(redisKey);

    if (cachedChatRoomIdx) {
      return this.getDecoratedDirectMessageRoom(cachedChatRoomIdx, userIdx, targetUserIdx);
    }

    const lockKey = `${redisKey}:lock`;
    const lockValue = `${process.pid}:${Date.now()}`;
    const hasLock = await this.redisStreamService.setIfAbsent(lockKey, lockValue, 5000);

    if (!hasLock) {
      const chatRoomIdx = await this.waitForDirectMessageRoomIdx(redisKey);

      if (chatRoomIdx) {
        return this.getDecoratedDirectMessageRoom(chatRoomIdx, userIdx, targetUserIdx);
      }

      throw new Error(`Direct message room creation is already in progress: ${redisKey}`);
    }

    try {
      const existingChatRoomIdx = await this.findExistingDirectMessageRoomIdx(pair.low, pair.high, userIdx);

      if (existingChatRoomIdx) {
        await this.redisStreamService.set(redisKey, String(existingChatRoomIdx));

        return this.getDecoratedDirectMessageRoom(existingChatRoomIdx, userIdx, targetUserIdx);
      }

      const name = this.getDirectMessageRoomName(pair.low, pair.high);
      const created = await this.coreHttpService.post<ChatRoomDetail>('/chat-rooms', {
        name,
        participant_ids: [targetUserIdx],
      }, {
        headers: {
          'X-User-Id': userIdx,
        },
      });

      await this.acceptDirectMessageInvitation(created.data.chatRoomIdx, userIdx, targetUserIdx, created.data.createdAt);
      await this.redisStreamService.set(redisKey, String(created.data.chatRoomIdx));

      return this.getDecoratedDirectMessageRoom(created.data.chatRoomIdx, userIdx, targetUserIdx);
    } finally {
      if (hasLock) {
        await this.redisStreamService.del(lockKey);
      }
    }
  }

  async sendDirectMessage(
    targetUserIdx: number,
    message: string,
    userIdx: number,
  ) {
    const { data: room } = await this.getOrCreateDirectMessageRoom(targetUserIdx, userIdx);
    const response = await this.sendMessage(room.chatRoomIdx, {
      type: 'TEXT',
      message,
    }, userIdx);

    return {
      data: {
        ...response.data,
        chatRoomIdx: room.chatRoomIdx,
      },
      message: response.message,
    };
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

  private async getDecoratedDirectMessageRoom(
    chatRoomIdx: number,
    userIdx: number,
    targetUserIdx: number,
  ) {
    const response = await this.getChatRoom(chatRoomIdx, userIdx);

    return {
      ...response,
      data: {
        ...response.data,
        roomType: 'dm',
        targetUserIdx,
      } satisfies DirectMessageRoom,
    };
  }

  private async decorateChatRoomSummary(
    chatRoom: ChatRoomSummary,
    userIdx: number,
  ): Promise<DirectMessageSummary> {
    const pair = this.parseDirectMessageRoomName(chatRoom.name);

    if (!pair) {
      return chatRoom;
    }

    try {
      const detail = await this.getChatRoom(chatRoom.chatRoomIdx, userIdx);
      const peer = this.getDirectMessagePeer(detail.data.participants, userIdx);

      if (!peer) {
        return chatRoom;
      }

      return {
        ...chatRoom,
        name: peer.nickname,
        roomType: 'dm',
        targetUserIdx: peer.userIdx,
      };
    } catch {
      return chatRoom;
    }
  }

  private decorateChatRoomDetail(
    chatRoom: ChatRoomDetail,
    userIdx: number,
  ): ChatRoomDetail | DirectMessageRoom {
    const pair = this.parseDirectMessageRoomName(chatRoom.name);

    if (!pair) {
      return chatRoom;
    }

    const peer = this.getDirectMessagePeer(chatRoom.participants, userIdx);

    return {
      ...chatRoom,
      name: peer?.nickname ?? 'DM',
      roomType: 'dm',
      targetUserIdx: peer?.userIdx ?? (pair.low === userIdx ? pair.high : pair.low),
    };
  }

  private getDirectMessagePeer(
    participants: ChatRoomDetail['participants'],
    userIdx: number,
  ) {
    return participants.find((participant) => participant.userIdx !== userIdx);
  }

  private getDirectMessagePair(
    userIdx: number,
    targetUserIdx: number,
  ) {
    const [low, high] = userIdx < targetUserIdx ? [userIdx, targetUserIdx] : [targetUserIdx, userIdx];

    return {
      low,
      high,
    };
  }

  private getDirectMessageRedisKey(
    low: number,
    high: number,
  ) {
    return `${this.directMessageRedisPrefix}:${low}:${high}`;
  }

  private getDirectMessageRoomName(
    low: number,
    high: number,
  ) {
    return `${this.directMessageNamePrefix}${low}:${high}`;
  }

  private parseDirectMessageRoomName(
    name: string,
  ) {
    if (!name.startsWith(this.directMessageNamePrefix)) {
      return null;
    }

    const [low, high] = name.slice(this.directMessageNamePrefix.length).split(':').map(Number);

    if (!Number.isInteger(low) || !Number.isInteger(high)) {
      return null;
    }

    return {
      low,
      high,
    };
  }

  private async getCachedDirectMessageRoomIdx(
    redisKey: string,
  ) {
    const value = await this.redisStreamService.get(redisKey);
    const chatRoomIdx = Number(value);

    return Number.isInteger(chatRoomIdx) && chatRoomIdx > 0 ? chatRoomIdx : null;
  }

  private async waitForDirectMessageRoomIdx(
    redisKey: string,
  ) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await this.sleep(100);

      const chatRoomIdx = await this.getCachedDirectMessageRoomIdx(redisKey);

      if (chatRoomIdx) {
        return chatRoomIdx;
      }
    }

    return null;
  }

  private async findExistingDirectMessageRoomIdx(
    low: number,
    high: number,
    userIdx: number,
  ) {
    const name = this.getDirectMessageRoomName(low, high);
    const { data } = await this.coreHttpService.get<ChatRoomSummary[]>('/chat-rooms', {
      headers: {
        'X-User-Id': userIdx,
      },
    });

    return data.find((chatRoom) => chatRoom.name === name)?.chatRoomIdx ?? null;
  }

  private async acceptDirectMessageInvitation(
    chatRoomIdx: number,
    inviterUserIdx: number,
    inviteeUserIdx: number,
    createdAt: string,
  ) {
    const { data: notifications } = await this.coreHttpService.get<NotificationResponse[]>('/notifications', {
      headers: {
        'X-User-Id': inviteeUserIdx,
      },
    });
    const createdAtTime = new Date(createdAt).getTime();
    const invitations = notifications
      .filter((notification) => notification.type === 'CHAT_ROOM_INVITATION')
      .filter((notification) => notification.actor?.idx === inviterUserIdx)
      .filter((notification) => {
        if (!notification.createdAt) {
          return true;
        }

        return new Date(notification.createdAt).getTime() >= createdAtTime - 5000;
      })
      .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime());

    for (const invitation of invitations) {
      if (!invitation.targetId) {
        continue;
      }

      const response = await this.replyInvitation(Number(invitation.targetId), {
        accept: true,
      }, inviteeUserIdx);

      if (response.data.chatRoomIdx === chatRoomIdx) {
        return;
      }
    }

    throw new Error(`Failed to accept direct message invitation for chat room ${chatRoomIdx}`);
  }

  private async sleep(
    ms: number,
  ) {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
