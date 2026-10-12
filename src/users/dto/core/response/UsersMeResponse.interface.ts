
export interface UsersMeResponse {
  idx: number;
  id: string;
  email: string;
  nickname: string;
  profileUrl: string;
  statusMessage: string;
  isDeactivated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
