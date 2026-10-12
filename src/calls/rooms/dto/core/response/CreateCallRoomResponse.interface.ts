
export interface CreateCallRoomResponse {
  roomIdx: number;
  title: string;
  category: string;
  maxParticipant: number;
  currentParticipant: number;
  isPublic: boolean;
  hasPassword: boolean;
  thumbnailUrl: string;
  hostUserIdx: number;
  createdAt: Date;
}
