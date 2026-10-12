import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface CallParticipant {
  socketId: string;
  userIdx: number;
  nickname: string;
  joinedAt: string;
  callRoomIdx: number;
}
interface CallSession {
  id: string;
  startedAt: string;
  participants: Map<string, CallParticipant>;
}

@Injectable()
export class CallStateService {
  private readonly rooms = new Map<number, CallSession>();
  private readonly bySocket = new Map<string, CallParticipant>();
  private readonly byUser = new Map<number, CallParticipant>();

  add(participant: CallParticipant): void {
    let room = this.rooms.get(participant.callRoomIdx);
    if (!room) {
      room = { id: randomUUID(), startedAt: new Date().toISOString(), participants: new Map() };
      this.rooms.set(participant.callRoomIdx, room);
    }
    room.participants.set(participant.socketId, participant);
    this.bySocket.set(participant.socketId, participant);
    this.byUser.set(participant.userIdx, participant);
  }

  remove(socketId: string): CallParticipant | undefined {
    const participant = this.bySocket.get(socketId);
    if (!participant) return;
    this.bySocket.delete(socketId);
    if (this.byUser.get(participant.userIdx)?.socketId === socketId) this.byUser.delete(participant.userIdx);
    const room = this.rooms.get(participant.callRoomIdx);
    room?.participants.delete(socketId);
    if (room?.participants.size === 0) this.rooms.delete(participant.callRoomIdx);
    return participant;
  }

  forSocket(socketId: string) { return this.bySocket.get(socketId); }
  forUser(userIdx: number) { return this.byUser.get(userIdx); }

  snapshot(callRoomIdx: number) {
    const room = this.rooms.get(callRoomIdx);
    const participants = [...(room?.participants.values() ?? [])].map((participant) => ({ ...participant }));
    return {
      callRoomIdx, sessionId: room?.id ?? null, startedAt: room?.startedAt ?? null,
      status: participants.length === 0 ? 'ended' as const : participants.length === 1 ? 'waiting' as const : 'active' as const,
      participants,
    };
  }
}
