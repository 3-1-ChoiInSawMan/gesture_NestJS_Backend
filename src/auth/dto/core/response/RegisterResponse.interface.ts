export interface RegisterResponse {
  idx: number;
  id: string;
  email: string;
  nickname: string;
  profileUrl: string | null;
  statusMessage: string | null;
  provider: string | null;
  isDeactivated: boolean;
  createdAt: Date;
}
