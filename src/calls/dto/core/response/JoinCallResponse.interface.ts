
export interface JoinCallResponse {
  callIdx: number;
  roomIdx: number;
  userIdx: number;
  joinedAt: Date;
  currentParticipant: number;
  maxParticipant: number;
}
