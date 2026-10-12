
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
