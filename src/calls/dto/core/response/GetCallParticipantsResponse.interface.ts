
export interface CallParticipantResponse {
  userIdx: number;
  nickname: string;
  joinedAt: Date;
  isHost: boolean;
  host: boolean;
}

export interface GetCallParticipantsResponse {
  callIdx: number;
  roomIdx: number;
  participants: CallParticipantResponse[];
  currentParticipant: number;
}
