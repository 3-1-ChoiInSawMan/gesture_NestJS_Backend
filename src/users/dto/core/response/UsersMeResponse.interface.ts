/*
{
  "success": true,
  "data": {
    "idx": 6,
    "id": "test4",
    "email": "[test4@gmail.com](mailto:test4@gmail.com)",
    "nickname": "테스트4",
    "profile_url": null,
    "status_message": null,
    "is_deactivated": false,
    "created_at": "2026-04-16T06:51:37.346969",
    "updated_at": "2026-04-16T06:51:37.346969"
  } 
  "message": "조회되었습니다."
}
*/

export interface UsersMeResponse {
  idx: number;
  id: string;
  email: string;
  nickname: string;
  profileUrl: string;
  statusMessage: string;
  isDeactivated: boolean;
  createdAt: Date;
  updatedAt: Date;
}