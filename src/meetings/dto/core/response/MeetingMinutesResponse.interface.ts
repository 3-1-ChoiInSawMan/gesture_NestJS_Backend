export interface MeetingMinutesResponse {
  minutesIdx: number;
  callIdx: number;
  roomIdx: number;
  title?: string;
  meetingDate?: Date;
  participants?: string[];
  content?: string;
  aiSummary?: string | null;
  conclusion?: unknown[];
  status: 'IN_PROGRESS' | 'ENDED';
  startedAt?: Date;
  endedAt?: Date | null;
}
