/*
{
  "success": true,
  "data": [
    {
      "idx": 4,
      "name": "떵개2",
      "description": "배고프다",
      "icon_uuid": "41fc7edd-02cf-4552-82ff-4d6a72c4cadd",
      "icon_url": "https://2026capstone-cig.s3.ap-northeast-2.amazonaws.com/quick-slots/1/41fc7edd-02cf-4552-82ff-4d6a72c4cadd.mp4",
      "order": 0,
      "created_at": "2026-05-07T00:30:32.388541"
    },
    {
      "idx": 5,
      "name": "떵개3",
      "description": "배고프다",
      "icon_uuid": "41fc7edd-02cf-4552-82ff-4d6a72c4cadd",
      "icon_url": "https://2026capstone-cig.s3.ap-northeast-2.amazonaws.com/quick-slots/1/41fc7edd-02cf-4552-82ff-4d6a72c4cadd.mp4",
      "order": 1,
      "created_at": "2026-05-07T10:45:55.973538"
    }
  ],
  "message": "조회되었습니다."
}
*/

export interface UploadedQuickSlotResponse {
  idx: number;
  name: string;
  description: string;
  iconUuid: string;
  iconUrl: string;
  order: number;
  createdAt: string;
}

export type GetUploadedQuickSlotsResponse = UploadedQuickSlotResponse[];
