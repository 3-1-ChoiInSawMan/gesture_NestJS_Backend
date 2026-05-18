/*
{
  "success": true,
  "data": {
    "room_idx": 5,
    "title": "두바이 쫀득 쿠키",
    "category": "study",
    "max_participant": 3,
    "current_participant": 1,
    "is_public": true,
    "has_password": false,
    "thumbnail_url": "https://2026capstone-cig.s3.ap-northeast-2.amazonaws.com/uploads/1/d582d8d1-7b5e-479a-9e74-7f66f1499995.jpg",
    "host_user_idx": 1,
    "created_at": "2026-05-07T19:32:03.1137736"
  },
  "message": "요청이 성공적으로 처리되었습니다."
}
*/

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