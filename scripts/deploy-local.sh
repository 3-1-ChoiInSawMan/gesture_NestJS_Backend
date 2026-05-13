#!/usr/bin/env bash
# 로컬 변경 사항(working tree)을 로컬 도커로 띄운다.
# - git clone 대신 현재 디렉토리(작업 중인 코드)를 그대로 빌드
# - .secrets / .vars 의 값을 환경변수로 로드해서 컨테이너에 주입
# - SSH/EC2 안 거침. 맥/리눅스 어디서든 도커 데몬만 떠 있으면 됨.
#
# 사용법:
#   ./scripts/deploy-local.sh                       # 기본 컨테이너명/포트로 띄움
#   CONTAINER=bff-test PORT=4000 ./scripts/deploy-local.sh
#   ./scripts/deploy-local.sh --logs                # 띄운 뒤 로그 follow

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || { echo "[!] $file 없음"; exit 1; }
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

load_env_file ".secrets"
load_env_file ".vars"

: "${SECURITY_PUBLIC_KEY:?SECURITY_PUBLIC_KEY 누락}"
: "${SECURITY_CORS_ORIGIN:?SECURITY_CORS_ORIGIN 누락}"
: "${SPRING_SERVER_URL:?SPRING_SERVER_URL 누락}"
: "${SERVER_PORT:?SERVER_PORT 누락}"

CONTAINER="${CONTAINER:-gesture-bff-local}"
PORT="${PORT:-$SERVER_PORT}"
IMAGE="${CONTAINER}:local"

if ! docker info > /dev/null 2>&1; then
  echo "Cannot connect to Docker Daemon."
  exit 1
fi

echo "Build: image=$IMAGE"
docker build -t "$IMAGE" .

echo "Removing container: $CONTAINER"
docker rm -f "$CONTAINER" > /dev/null 2>&1 || true

echo "Running container: $CONTAINER on $PORT"
docker run --name "$CONTAINER" \
  -e "NODE_ENV=${NODE_ENV}" \
  -e "SECURITY_PUBLIC_KEY=${SECURITY_PUBLIC_KEY}" \
  -e "SECURITY_CORS_ORIGIN=${SECURITY_CORS_ORIGIN}" \
  -e "SPRING_SERVER_URL=${SPRING_SERVER_URL}" \
  -e "SERVER_PORT=${PORT}" \
  --restart unless-stopped \
  -d -p "${PORT}:${PORT}" \
  "$IMAGE" > /dev/null

# Health check
echo "Health check"
for attempt in 1 2 3 4 5; do
  if curl -fsS "http://localhost:${PORT}/api/v1" > /dev/null; then
    echo "attempt $attempt success. BFF is healthy."
    if [[ "${1:-}" == "--logs" ]]; then
      echo "Following log. (To exit tty, press Ctrl+C, container will not stop)"
      docker logs -f "$CONTAINER"
    fi
    exit 0
  fi
  echo "    attempt $attempt failed. retrying..."
  sleep 3
done

echo "BFF is not Healthy"
echo "=== docker ps ==="
docker ps -a --filter "name=${CONTAINER}"
echo "=== docker logs ==="
docker logs "$CONTAINER" || true
exit 1
