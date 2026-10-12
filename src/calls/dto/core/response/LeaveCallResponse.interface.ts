
export interface LeaveCallResponse {
  callIdx: number;
  roomIdx: number;
  userIdx: number;
  leftAt: Date;
  currentParticipant: number;
  callEnded: boolean;
}
