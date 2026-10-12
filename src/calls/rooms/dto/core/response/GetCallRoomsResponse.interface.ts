/*
{
  "success": true,
  "data": {
    "content": [
      {
        "room_idx": 1,
        "title": "두쫀쿠 내 입에 넣어줘",
        "category": "study",
        "current_participant": 3,
        "max_participant": 10,
        "is_public": true,
        "has_password": false,
        "thumbnail_url": null,
        "host_user_idx": 1
      },
      {
        "room_idx": 2,
        "title": "빅나티를 변기에 넣고서 내려",
        "category": "basic",
        "current_participant": 1,
        "max_participant": 10,
        "is_public": true,
        "has_password": false,
        "thumbnail_url": null,
        "host_user_idx": 9
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "sorted": false,
        "empty": true,
        "unsorted": true
      },
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalPages": 1,
    "totalElements": 5,
    "last": true,
    "size": 20,
    "number": 0,
    "sort": {
    "sorted": false,
    "empty": true,
    "unsorted": true
    },
    "numberOfElements": 5,
    "first": true,
    "empty": false
  },
  "message": "요청이 성공적으로 처리되었습니다."
}
*/

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
