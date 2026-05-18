/*
{
  "success": true,
  "data": {
    "idx": 1,
    "id": "yoon123",
    "nickname": "윤정",
    "is_deactivated": false
  },
  "message": "요청이 성공적으로 처리되었습니다."
}
*/

export interface UsersWithdrawResponse {
  idx: number;
  id: string;
  nickname: string;
  isDeactivated: boolean;
}
