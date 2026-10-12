
export interface UsersInformationResponse {
  idx: number;
  id: string;
  profileUrl: string;
  statusMessage: string;
  isDeactivated: boolean;
  createdAt: Date;
}


export interface UpdatedUsersInformationResponse {
  idx: number;
  nickname: string;
  profileUrl: string;
  statusMessage: string;
  updatedAt: Date;
}


export interface SearchedUsersInformationResponse {
  idx: number;
  id: string;
  nickname: string;
  profileUrl: string;
  statusMessage: string;
  provider: string;
  isDeactivated: boolean;
}
