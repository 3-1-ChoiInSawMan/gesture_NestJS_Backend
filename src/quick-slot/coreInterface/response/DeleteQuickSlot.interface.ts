/*
{
  "success": true,
  "data": {
    "quick_slot_idx": 4,
    "deleted": true,
    "deleted_at": "2026-05-07T10:59:33.9722892"
  },
  "message": "삭제되었습니다."
}
*/

export interface DeleteQuickSlotResponse {
  quickSlotIdx: number;
  deleted: boolean;
  deletedAt: string;
}
