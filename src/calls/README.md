# calls / sfu 개발 가이드

## 도메인 경계

```text
calls/
  rooms/                 영속 통화방 생성·검색·수정·삭제·멤버십 API
  calls.controller.ts    Core 통화 입장·퇴장·참가자 API, 실시간 상태 조회
  calls.gateway.ts       /calls Socket.IO 이벤트·인증·입력 검증
  calls.service.ts       참가 권한 확인, 세션 전환, SFU 요청, 클라이언트 알림
  call-state.service.ts  연결된 참가자와 waiting/active/ended 상태
  call-ai.service.ts     기존 AI 프레임·오디오 번역 프로토콜

sfu/
  worker-manager.service.ts  Worker 생성·분배·장애 시 교체·종료
  sfu.service.ts             Router, Transport, Producer, Consumer 수명 관리
  sfu.config.ts              코덱·미디어 포트·외부 주소 설정
  sfu.types.ts               미디어 요청·응답·리소스 타입
```

호출 방향은 `CallsGateway → CallsService → SfuService → WorkerManager`이다.
SFU는 Socket.IO, JWT, Core API, 사용자 정보에 의존하지 않는다.
기존 `/chat` 프로토콜은 별도 `chat/` 도메인으로 이동했다.
CallsService가 확인한 `roomId`와 연결별 `peerId`만 받는다.
방 단위 직렬 실행으로 Router/Transport/Consumer 중복 생성과 퇴장 중 생성 경합을 막는다.
한 연결에서 send/recv Transport는 각각 최대 한 개, Producer는 audio/camera/screen별 최대 한 개이다.

`/api/v1/call-rooms`와 `/api/v1/calls`의 기존 REST 경로는 유지한다.
방 생성·멤버십·통화 참가의 영속 상태는 기존 Core 서버가 관리한다.
`GET /api/v1/calls/:roomIdx/state`는 참가 권한을 확인한 뒤 이 SFU 프로세스의 연결 상태를 반환한다.
`waiting`은 연결된 참가자 1명, `active`는 2명 이상, `ended`는 0명이다.
실제 RTP 수신이나 영속 통화 기록의 상태를 뜻하지 않는다.

## 클라이언트 연결 순서

1. 기존 REST API로 방 멤버십과 통화 참가를 완료한다.
2. `/calls`에 JWT로 연결하고 `calls_ready`를 기다린다.
3. `join_call` → `rtpCapabilities`, `existingProducers`, `state`를 받는다.
4. `mediasoup-client` Device를 load하고 send/recv Transport를 각각 생성한다.
5. Transport의 `connect` 이벤트에서 `connect_transport`를 요청한다.
6. send Transport의 `produce` 이벤트에서 `produce`를 요청한다.
7. 기존 Producer와 `new_producer` 알림을 수신한다. `consume` → 클라이언트 `recvTransport.consume()` → `resume_consumer` 순서로 실행한다.
8. 나갈 때 `leave_call`을 요청하고 로컬 Transport/트랙도 닫는다.

참가자는 `peerId`(Socket ID)로 연결하고, 카메라/화면 공유는 `mediaTag`로 구분한다.
`new_producer` 리스너를 입장 전에 등록하고 recv Transport 준비 전 알림은 버퍼링한다.
`existingProducers`와 알림을 `producerId`로 중복 제거한다. `get_producers`로 재동기화할 수 있다.
`offer`, `answer`, `ice_candidate` Mesh 이벤트는 제거했다.

모든 요청 ACK는 다음 형식이다. 기존 직접 반환값을 기대하던 클라이언트도 수정해야 한다.

```ts
async function request(event: string, payload = {}) {
  const result = await socket.timeout(10000).emitWithAck(event, payload);
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

const joined = await request('join_call', { callRoomIdx });
await device.load({ routerRtpCapabilities: joined.rtpCapabilities });
```

성공은 `{ ok: true, data }`, 실패는 `{ ok: false, error: { code, message } }`이다.
ACK가 없는 오류 요청에는 `ws_error`를 보낸다. 인증 실패는 `ws_error` 후 연결을 종료한다.

| 요청 이벤트 | payload | data |
| --- | --- | --- |
| `join_call` | `callRoomIdx` | `rtpCapabilities`, `existingProducers`, `state` |
| `leave_call` | `callRoomIdx` | `left`, 선택적 `coreSynced` |
| `get_call_state` | 없음 | 상태와 연결된 참가자 |
| `get_producers` | 없음 | 다른 참가자의 Producer 배열 |
| `create_transport` | `direction: send/recv` | `id`, `iceParameters`, `iceCandidates`, `dtlsParameters` |
| `connect_transport` | `transportId`, `dtlsParameters` | `connected` |
| `restart_ice` | `transportId` | `iceParameters` (클라이언트 `transport.restartIce()`에 전달) |
| `close_transport` | `transportId` | `closed` |
| `produce` | `transportId`, `kind`, `rtpParameters`, `mediaTag` | `id` |
| `set_producer_paused` | `producerId`, `paused` | `paused` |
| `close_producer` | `producerId` | `closed` |
| `consume` | `transportId`, `producerId`, `rtpCapabilities` | `id`, `producerId`, `kind`, `rtpParameters`, `producerPaused`, `peerId`, `mediaTag` |
| `resume_consumer` | `consumerId` | `resumed` |
| `close_consumer` | `consumerId` | `closed` |
| `set_preferred_layers` | `consumerId`, `spatialLayer`, 선택적 `temporalLayer` | `preferredLayers` |
| `send_frame` / `send_audio` | 기존 payload | `accepted` |

서버 알림: `calls_ready`, `existing_participants`, `user_joined`, `user_left`, `call_left`,
`call_state`, `new_producer`, `producer_closed`, `producer_paused`, `producer_resumed`,
`consumer_closed`, `transport_closed`, `media_room_closed`, `frame_translation`, `audio_translation`.

Producer/Consumer/Transport 종료 알림을 받으면 해당 로컬 객체를 닫는다.
`media_room_closed`는 Worker 장애에 따른 세션 무효화다. 로컬 객체를 정리한 뒤 지연 재시도로
`join_call`부터 다시 시작한다. 같은 사용자의 새 연결이 입장하면 이전 연결은 `call_left`를 받는다.
소켓 재연결에서는 새로운 peerId로 미디어를 재생성해야 한다. Core 참가가 해제되었으면 REST 입장도 다시 수행한다.

## 실행 설정과 검증

`.env.example`의 SFU 설정을 사용한다. 원격 접속에서는 `WEBRTC_LISTEN_IP=0.0.0.0`,
`WEBRTC_ANNOUNCED_IP=<클라이언트에서 도달 가능한 서버 IP>`를 설정한다.
Docker Compose는 컨테이너 내부에서 wildcard 주소에 바인딩하고 미디어 UDP/TCP 포트 범위를 매핑한다.
같은 범위가 서버 방화벽/NAT에서도 전달되어야 한다. HTTPS 리버스 프록시는 미디어 UDP 포트를 대신 전달하지 않는다.

`npm test -- --runInBand`는 Core/AI 모킹 테스트와 실제 Socket.IO 및 native mediasoup Worker 테스트를 실행한다.
테스트용 미디어 포트는 24000–25999이다. native Worker 바이너리 설치가 필요한 npm 환경에서는
`npm install-scripts approve mediasoup` 후 `npm rebuild mediasoup`를 실행한다.
`npm run build`는 NestJS 빌드다. 프로세스 종료 훅에서 모든 Worker를 닫는다.

현재 참가자/SFU 상태는 단일 프로세스 메모리에 있다. 여러 BFF 인스턴스로 확장할 때는
통화방을 특정 SFU 인스턴스에 배정하는 라우팅이 추가로 필요하다.
Core 서버가 퇴장 요청을 거부하거나 응답하지 않아도 로컬 미디어는 정리하며,
소켓 퇴장의 `coreSynced: false`와 서버 로그로 실패를 알린다. 이후 REST 퇴장을 재시도할 수 있다.
AI 서버가 요청 ID를 반환하지 않아 방별 응답 순서를 가정한다. 세션 ID로 이전 통화의 지연 결과를 차단하지만,
같은 세션에서 AI가 응답 순서를 바꾸는 경우에는 AI 프로토콜에도 요청 ID가 필요하다.

mediasoup 통신 규칙: https://mediasoup.org/documentation/v3/communication-between-client-and-server/
리소스 수명 규칙: https://mediasoup.org/documentation/v3/mediasoup/garbage-collection/
