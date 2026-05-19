export interface LoginResponse {
  idx: number;
  id: string;
  email: string;
  nickname: string;
  profileUrl: string | null;
  statusMessage: string | null;
  provider: string | null;
  isDeactivated: boolean;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;
}
