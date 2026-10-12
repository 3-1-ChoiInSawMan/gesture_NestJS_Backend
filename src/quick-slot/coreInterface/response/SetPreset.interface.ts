
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
