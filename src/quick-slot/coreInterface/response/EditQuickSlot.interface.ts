/*
{
  "success": true,
  "data": {
    "idx": 4,
    "name": "아배고파",
    "description": "급식빨리",
    "icon_uuid": "41fc7edd-02cf-4552-82ff-4d6a72c4cadd",
    "icon_url": "https://2026capstone-cig.s3.ap-northeast-2.amazonaws.com/quick-slots/1/41fc7edd-02cf-4552-82ff-4d6a72c4cadd.mp4",
    "order": 0,
    "created_at": "2026-05-07T00:30:32.388541"
  },
  "message": "수정되었습니다."
}
*/

export interface EditQuickSlotResponse {
  idx: number;
  name: string;
  description: string;
  iconUuid: string;
  iconUrl: string;
  order: number;
  createdAt: string;
}
