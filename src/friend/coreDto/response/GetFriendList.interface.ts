/*
{
  "success": true,
  "data": [
    {
      "friend_idx": 6,
      "friend_id": "test4",
      "friend_nickname": "두쫀쿠냠냠"
    },
    {
      "friend_idx": 12,
      "friend_id": "swim5",
      "friend_nickname": "swim5"
    }
  ],
  "message": "조회되었습니다."
}
*/

export interface FriendData {
  friendIdx: number;
  friendId: string;
  friendNickname: string;
}