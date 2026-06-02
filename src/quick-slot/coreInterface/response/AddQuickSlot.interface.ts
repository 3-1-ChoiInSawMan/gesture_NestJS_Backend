/*
{
  "success": true,
  "data": {
    "idx": 5,
    "name": "떵개3",
    "description": "배고프다",
    "user_idx": 1,
    "icon_uuid": "41fc7edd-02cf-4552-82ff-4d6a72c4cadd",
    "icon_url": "https://2026capstone-cig.s3.ap-northeast-2.amazonaws.com/quick-slots/1/41fc7edd-02cf-4552-82ff-4d6a72c4cadd.mp4",
    "created_at": "2026-05-07T10:45:55.9735381"
  },
  "message": "등록되었습니다."
}
*/
export interface AddQuickSlotResponse {
  idx: number;
  name: string;
  description: string;
  userIdx: number;
  iconUuid: string;
  iconUrl: string;
  createdAt: string;
}
