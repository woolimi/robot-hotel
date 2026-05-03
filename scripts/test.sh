#!/usr/bin/env bash
# 프로젝트 전체 테스트 진입점 — 새 테스트 모듈 추가 시 이 파일에 기록한다.
#
# [server/ai] LLM 통합 테스트 — Ollama 서버가 로컬에서 실행 중이어야 합니다.
# 사용법:
#   bash scripts/test.sh               # 전체
#   bash scripts/test.sh -k gogoping   # 특정 케이스만
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AI_DIR="$REPO_ROOT/server/ai"

if ! curl -sf http://localhost:11434/api/tags > /dev/null; then
  echo "오류: Ollama 서버가 실행 중이지 않습니다 (http://localhost:11434)."
  exit 1
fi

echo "Ollama OK. 테스트 시작..."
cd "$AI_DIR"
conda run -n jazzy pytest tests/ -v "$@"
