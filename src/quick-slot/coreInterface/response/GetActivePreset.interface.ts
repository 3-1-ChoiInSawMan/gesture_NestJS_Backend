/*
{
  "success": true,
  "data": {
    "user_idx": 1,
    "quick_slots": [
      {
      "quick_slot_id": 5,
      "name": "떵개3",
      "icon_uuid": "41fc7edd-02cf-4552-82ff-4d6a72c4cadd",
      "icon_url": "https://2026capstone-cig.s3.ap-northeast-2.amazonaws.com/quick-slots/1/41fc7edd-02cf-4552-82ff-4d6a72c4cadd.mp4",
      "order": 1
      },
      {
      "quick_slot_id": 6,
      "name": "떵개6",
      "icon_uuid": "41fc7edd-02cf-4552-82ff-4d6a72c4cadd",
      "icon_url": "https://2026capstone-cig.s3.ap-northeast-2.amazonaws.com/quick-slots/1/41fc7edd-02cf-4552-82ff-4d6a72c4cadd.mp4",
      "order": 2
      }
    ],
    "updated_at": "2026-05-07T11:01:55.996851"
  },
  "message": "조회되었습니다."
}
*/

export interface ActivePresetQuickSlotResponse {
  quickSlotId: number;
  name: string;
  iconUuid: string;
  iconUrl: string;
  order: number;
}

export interface GetActivePresetResponse {
  userIdx: number;
  quickSlots: ActivePresetQuickSlotResponse[];
  updatedAt: string;
}
