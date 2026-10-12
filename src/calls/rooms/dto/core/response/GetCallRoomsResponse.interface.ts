
export interface HostSummaryResponse {
  userIdx: number;
  userName: string;
  profileUrl: string;
}

export interface CallRoomSummaryResponse {
  roomIdx: number;
  title: string;
  category: string;
  currentParticipant: number;
  maxParticipant: number;
  isPublic: boolean;
  hasPassword: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
  host: HostSummaryResponse;
}

export interface PageSortResponse {
  sorted: boolean;
  empty: boolean;
  unsorted: boolean;
}

export interface PageableResponse {
  pageNumber: number;
  pageSize: number;
  sort: PageSortResponse;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface GetCallRoomsResponse {
  content: CallRoomSummaryResponse[];
  pageable: PageableResponse;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: PageSortResponse;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}
