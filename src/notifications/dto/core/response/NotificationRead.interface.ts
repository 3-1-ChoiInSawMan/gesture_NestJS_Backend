/*
{
  "success": true,
  "data": {
    "notification_id": 2,
    "is_read": true,
    "updated_at": "2026-04-28T15:52:43.699541",
    "read": true
  },
  "message": "요청이 성공적으로 처리되었습니다."
}
*/

export interface NotificationRead {
  notificationId: number;
  isRead: boolean;
  updatedAt: Date;
  read: boolean;
}