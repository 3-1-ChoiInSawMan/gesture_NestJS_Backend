
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
