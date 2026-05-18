/*
  {
  "success": true,
  "data": [
    {
    "type": "FRIEND",
    "enabled": true
    },
    {
    "type": "SERVICE_NOTICE",
    "enabled": true
    },
    {
    "type": "CALL_ROOM",
    "enabled": true
    },
    {
    "type": "CHAT_NOTICE",
    "enabled": true
    },
    {
    "type": "MENTION",
    "enabled": true
    }
  ],
  "message": "요청이 성공적으로 처리되었습니다."
} 
*/

export interface NotificationSettingStatusResponse {
  type: string;
  enabled: boolean;
}

/*
{
  "success": true,
  "data": {
    "notification_setting_id": 4,
    "type": "CHAT_NOTICE",
    "enabled": false,
    "updated_at": "2026-04-28T17:33:33.99765"
  },
  "message": "설정이 변경되었습니다."
}
*/

export interface NotificationSettingUpdateResponse {
  notificationSettingId: number;
  type: string;
  enabled: boolean;
  updatedAt: Date;
}