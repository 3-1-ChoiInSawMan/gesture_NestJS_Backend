/*
{
  "success": true,
  "data": {
    "user_idx": 1,
    "quick_slots": [
      {
      "quick_slot_id": 4,
      "name": "떵개2",
      "order": 1
      },
      {
      "quick_slot_id": 5,
      "name": "떵개3",
      "order": 2
      }
    ],
    "updated_at": "2026-05-07T10:51:02.868692"
  },
  "message": "요청이 성공적으로 처리되었습니다."
}
*/

export interface PresetQuickSlotResponse {
  quickSlotId: number;
  name: string;
  order: number;
}

export interface SetPresetResponse {
  userIdx: number;
  quickSlots: PresetQuickSlotResponse[];
  updatedAt: string;
}
