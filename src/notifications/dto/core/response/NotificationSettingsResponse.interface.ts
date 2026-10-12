
export interface NotificationSettingStatusResponse {
  type: string;
  enabled: boolean;
}


export interface NotificationSettingUpdateResponse {
  notificationSettingId: number;
  type: string;
  enabled: boolean;
  updatedAt: Date;
}
