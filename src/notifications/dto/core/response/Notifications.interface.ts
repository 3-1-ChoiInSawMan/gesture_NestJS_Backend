/*
{
  "success": true,
  "data": [
    {
      "idx": 2,
      "type": "FRIEND",
      "is_read": false,
      "content": "테스트1(@yoon1234)님이 친구 요청을 보냈습니다.",
      "actor": {
        "idx": 1,
        "nickname": "테스트1",
        "user_id": "yoon1234",
        "profile_image_url": null
      },
      "target_id": "1",
      "created_at": "2026-04-28T15:12:29",
      "read": false
    }
  ],
  "message": "조회되었습니다."
}
*/

export interface Notification {
  idx: number;
  type: string;
  isRead: boolean;
  content: string;
  actor: {
    idx: number;
    nickname: string;
    userId: string;
    profileImageUrl: string;
  };
  targetId: string;
  createdAt: number;
  read: boolean;
} 