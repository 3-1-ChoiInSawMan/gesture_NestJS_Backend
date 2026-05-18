/*
{
  "success": true,
  "data": {
    "call_idx": 1,
    "room_idx": 1,
    "user_idx": 1,
    "joined_at": "2026-05-11T19:51:27.5331563",
    "current_participant": 1,
    "max_participant": 10
  },
  "message": "요청이 성공적으로 처리되었습니다."
}
*/

export interface JoinCall {
  callIdx: number;
  roomIdx: number;
  userIdx: number;
  joinedAt: Date;
  currentParticipant: number;
  maxParticipant: number;
}
