/*
{
  "success": true,
  "data": {
    "call_idx": 2,
    "room_idx": 3,
    "user_idx": 5,
    "left_at": "2026-05-12T00:57:01.9206471",
    "current_participant": 1,
    "call_ended": false
  },
  "message": "요청이 성공적으로 처리되었습니다."
}
*/

export interface LeaveCallResponse {
  callIdx: number;
  roomIdx: number;
  userIdx: number;
  leftAt: Date;
  currentParticipant: number;
  callEnded: boolean;
}
