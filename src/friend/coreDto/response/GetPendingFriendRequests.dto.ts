/* Example Response
{
  "success": true,
    "data": [
      {
        "friend_request_idx": 1,
        "requester_idx": 1,
        "requester_id": "yoon123",
        "requester_nickname": "YoonJeong",
        "status": "PENDING",
        "created_at": "2026-04-23T01:03:34.38508"
      },
      {
        "friend_request_idx": 2,
        "requester_idx": 6,
        "requester_id": "test4",
        "requester_nickname": "두쫀쿠냠냠",
        "status": "PENDING",
        "created_at": "2026-04-23T01:04:23.648232"
      }
    ],
      "message": "조회되었습니다."
}
*/

// 친구 목록 조회 응답 DTO

import { FriendStatus } from "src/friend/enum/FriendStatus.enum"

export interface GetPendingFriendRequestsDto {
  success: boolean,
  data: {
    friend_request_idx: number,
    requester_idx: number,
    requester_id: string,
    requester_nickname: string,
    status: FriendStatus,
    created_at: Date,
  }[],
  message: string
}
