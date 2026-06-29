export interface ChatRoomSummary {
  chatRoomIdx: number;
  name: string;
  imageUrl: string | null;
  participantCount: number;
  createdAt: string;
}

export interface ChatRoomDetail {
  chatRoomIdx: number;
  name: string;
  imageUrl: string | null;
  participants: ChatRoomParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomParticipant {
  userIdx: number;
  nickname: string;
  userId: string;
  profileImageUrl: string | null;
  lastReadMessageIdx: number | null;
}

export interface ChatRoomReadResponse {
  chatRoomIdx: number;
  lastReadMessageIdx: number;
}

export interface ChatRoomInvitationResponse {
  invitationIdx: number;
  chatRoomIdx: number;
  status: 'ACCEPTED' | 'REJECTED' | string;
}
