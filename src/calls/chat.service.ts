import { Injectable } from "@nestjs/common";
import type { Socket } from 'socket.io';
import type { JwtPayload } from "src/common/jwt-payload.interface";
import { disconnectWithAuthError } from "src/common/ws-error.util";
import { ChatMessagePayloadDto, ChatRoomPayloadDto, ChatRoomType } from "./dto/chat-message.dto";

@Injectable()
export class ChatService {
  /**
   * roomType에 따라 SocketIO 룸 이름 생성
   * - call: 통화방 번호 그대로 사용 → "chat:call:42"
   * - dm:   두 유저 번호를 정렬해 한 쌍이 항상 같은 룸을 갖도록 함 → "chat:dm:7:13"
   */
  public getRoomName(roomType: ChatRoomType, targetIdx: number, userIdx: number) {
    if (roomType === 'call') {
      return `chat:call:${targetIdx}`;
    }

    const [low, high] = userIdx < targetIdx ? [userIdx, targetIdx] : [targetIdx, userIdx];

    return `chat:dm:${low}:${high}`;
  }

  public isValidIdx(idx: unknown): idx is number {
    return Number.isInteger(idx) && Number(idx) > 0;
  }

  /**
   * socket.io의 client.data는 기본 타입이 any이므로, 인증된 유저 정보를 좁혀서 꺼낸다.
   */
  private getUser(client: Socket): JwtPayload | undefined {
    return (client.data as { user?: JwtPayload }).user;
  }

  public joinRoom(client: Socket, payload: ChatRoomPayloadDto) {
    const userIdx = this.getUser(client)?.idx;

    if (!this.isValidIdx(payload.targetIdx) || !this.isValidIdx(userIdx)) {
      disconnectWithAuthError(client, 'CHAT_001');

      return;
    }

    const roomName = this.getRoomName(payload.roomType, payload.targetIdx, userIdx);

    if (client.rooms.has(roomName)) {
      return;
    }

    void client.join(roomName);
  }

  public leaveRoom(client: Socket,payload: ChatRoomPayloadDto) {
    const userIdx = this.getUser(client)?.idx;

    if (!this.isValidIdx(payload.targetIdx) || !this.isValidIdx(userIdx)) {
      return;
    }

    const roomName = this.getRoomName(payload.roomType, payload.targetIdx, userIdx);

    if (!client.rooms.has(roomName)) {
      return;
    }

    void client.leave(roomName);
  }

  /**
   * 보낸 사람이 실제로 해당 룸에 들어와 있을 때만, 같은 룸의 '나를 제외한' 상대에게 중계한다.
   * 저장은 하지 않는다(실시간 전달 전용).
   */
  public relayMessage(client: Socket,payload: ChatMessagePayloadDto) {
    const userIdx = this.getUser(client)?.idx;

    if (!this.isValidIdx(payload.targetIdx) || !this.isValidIdx(userIdx)) {
      disconnectWithAuthError(client, 'CHAT_001');

      return;
    }

    const roomName = this.getRoomName(payload.roomType, payload.targetIdx, userIdx);

    if (!client.rooms.has(roomName)) {
      disconnectWithAuthError(client, 'CHAT_001');

      return;
    }

    client.to(roomName).emit('receive_message', {
      roomType: payload.roomType,
      targetIdx: payload.targetIdx,
      message: payload.message,
      fromSocketId: client.id,
      fromUserIdx: userIdx,
    });
  }
}
