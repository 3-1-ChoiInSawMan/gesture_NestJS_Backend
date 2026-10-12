export interface JoinRoomResponse {
  roomMemberIdx: number;
  roomIdx: number;
  userIdx: number;
  role: string;
  joinedAt: Date;
  currentParticipant: number;
  maxParticipant: number;
}
