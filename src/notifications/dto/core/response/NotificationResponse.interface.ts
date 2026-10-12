
export interface NotificationResponse {
  idx: number;
  type: string;
  isRead: boolean;
  content: string;
  actor: {
    idx: number;
    nickname: string;
    userId: string;
    profileImageUrl: string;
  };
  targetId: string;
  createdAt: number;
  read: boolean;
}
