#!/usr/bin/env bash
# act로 로컬 배포 workflow를 실행한다.
# - EC2/SSH 대신 로컬 Docker에 배포한다.
# - 환경값은 GitHub Actions와 같은 vars/secrets 컨텍스트로 주입한다.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ACT_IMAGE="${ACT_IMAGE:-catthehacker/ubuntu:act-24.04}"

[[ -f ".vars" ]] || { echo "[!] .vars 없음"; exit 1; }
[[ -f ".secrets" ]] || { echo "[!] .secrets 없음"; exit 1; }

ACT_ARGS=(
  workflow_dispatch
  -W .github/workflows/test-deploy-local.yml
  -j deploy
  -P "ubuntu-24.04=${ACT_IMAGE}"
  --var-file .vars
  --secret-file .secrets
  --env-file /dev/null
  --bind
)

for name in CONTAINER IMAGE PORT DEPLOY_DIR; do
  if [[ -n "${!name:-}" ]]; then
    ACT_ARGS+=(--env "${name}=${!name}")
  fi
done

act "${ACT_ARGS[@]}" "$@"
