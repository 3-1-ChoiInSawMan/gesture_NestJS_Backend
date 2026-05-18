/*
{
  "success": true,
  "data": {
    "room_member_idx": 14,
    "room_idx": 2,
    "user_idx": 10,
    "role": "MEMBER",
    "joined_at": "2026-04-23T00:43:39.504865051",
    "current_participant": 2,
    "max_participant": 10
  },
  "message": "요청이 성공적으로 처리되었습니다."
}
*/
export interface JoinRoom {
  roomMemberIdx: number;
  roomIdx: number;
  userIdx: number;
  role: string;              // Enum으로 대체 가능
  joinedAt: Date;
  currentParticipant: number;
  maxParticipant: number;
}