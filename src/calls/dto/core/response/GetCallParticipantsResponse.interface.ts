/*
{
  "success": true,
  "data": {
    "call_idx": 2,
    "room_idx": 3,
    "participants": [
      {
        "user_idx": 4,
        "nickname": "난널버리지않아~~",
        "joined_at": "2026-05-11T19:55:10.785478",
        "is_host": true,
        "host": true
      },
      {
        "user_idx": 5,
        "nickname": "빅나티를 변기에 넣고서 내려",
        "joined_at": "2026-05-11T19:55:18.398873",
        "is_host": false,
        "host": false
      }
    ],
    "current_participant": 2
  },
  "message": "요청이 성공적으로 처리되었습니다."
}
*/

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
