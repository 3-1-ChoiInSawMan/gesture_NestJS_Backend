

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
