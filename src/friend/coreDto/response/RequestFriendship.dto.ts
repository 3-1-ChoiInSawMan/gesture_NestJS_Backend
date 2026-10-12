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
