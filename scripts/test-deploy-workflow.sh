#!/usr/bin/env bash
# 호환용 래퍼: 로컬 배포는 deploy-local.sh가 act workflow를 실행한다.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

exec ./scripts/deploy-local.sh "$@"
