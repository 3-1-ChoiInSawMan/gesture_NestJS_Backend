import { FriendStatus } from "src/friend/enum/FriendStatus.enum";

export class RequestFriendshipResponse {
  success: boolean;


  data: {
    friend_request_idx: number;
    requester_idx: number;
    receiver_idx: number;
    status: FriendStatus;
    created_at: Date;
  };

  message: string;
}

/**
 * {
"success": true,
"data": {
"friend_request_idx": 1,
"requester_idx": 1,
"receiver_idx": 10,
"status": "PENDING",
"created_at": "2026-04-23T01:03:34.385080274"
},
"message": "친구 요청이 발송되었습니다."
}
 */