export interface MeetingMinutesSummaryResponse {
  minutesIdx: number;
  callIdx: number;
  title: string;
  meetingDate: Date;
  status: 'IN_PROGRESS' | 'ENDED';
}
