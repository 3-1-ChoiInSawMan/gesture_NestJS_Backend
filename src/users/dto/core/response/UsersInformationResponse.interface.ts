/*
{
  "success": true,
  "data": {
    "idx": 1,
    "id": "yoon123",
    "nickname": "윤정",
    "profile_url": null,
    "status_message": null,
    "is_deactivated": false,
    "created_at": "2026-04-15T07:13:16.130731"
  },
  "message": "조회되었습니다."
}

*/

export interface UsersInformationResponse {
  idx: number;
  id: string;
  profileUrl: string;
  statusMessage: string;
  isDeactivated: boolean;
  createdAt: Date;
}

/*
{
  "success": true,
  "data": {
    "idx": 1,
    "nickname": "두쫀쿠냠냠",
    "profile_url": "https://2026capstone-cig.s3.ap-northeast-2.amazonaws.com/uploads/1/0651d668-44ed-4d1c-ae37-f07a63f48d6e.jpg",
    "status_message": "두쫀쿠먹고시퍼요",
    "updated_at": "2026-04-21T11:01:58"
  },
  "message": "수정되었습니다."
}
*/

export interface UpdatedUsersInformationResponse {
  idx: number;
  nickname: string;
  profileUrl: string;
  statusMessage: string;
  updatedAt: Date;
}

/*
{
  "success": true,
  "data": [
    {
      "idx": 8,
      "id": "swim1",
      "nickname": "swim",
      "profileUrl": null,
      "statusMessage": "adffa",
      "provider": null,
      "isDeactivated": false
    },
    {
      "idx": 9,
      "id": "swim2",
      "nickname": "swim1",
      "profileUrl": null,
      "statusMessage": null,
      "provider": null,
      "isDeactivated": false
    }
  ],
  "message": "요청이 성공적으로 처리되었습니다."
}
*/

export interface SearchedUsersInformationResponse {
  idx: number;
  id: string;
  nickname: string;
  profileUrl: string;
  statusMessage: string;
  provider: string;
  isDeactivated: boolean;
}