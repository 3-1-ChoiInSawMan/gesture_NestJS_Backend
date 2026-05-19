/*
{
  "success": true,
  "data": {
    "deleted": true,
    "user_idx": 10,
    "target_user_idx": 6,
    "deleted_at": "2026-04-23T01:20:55.894493609"
  },
  "message": "친구가 삭제되었습니다."
}
*/

export interface Unfriend {
  deleted: boolean;
  userIdx: number;
  targetUserIdx: number;
  deletedAt: Date;
}