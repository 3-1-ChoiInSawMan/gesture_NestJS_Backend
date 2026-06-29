export interface GetChatMessagesResponse {
  messages: ChatMessage[];
  nextCursor: number | null;
  hasNext: boolean;
}

export interface ChatMessage {
  messageIdx: number;
  sender: ChatMessageSender;
  message: string | null;
  type: ChatMessageType;
  isDeleted: boolean;
  fileUrl: string | null;
  createdAt: string;
  deleted: boolean;
}

export interface ChatMessageSender {
  userIdx: number;
  nickname: string;
  userId: string;
  profileImageUrl: string | null;
}

export type ChatMessageType = 'TEXT' | 'FILE';
