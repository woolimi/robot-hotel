#!/usr/bin/env bash
# scripts/run_server.sh — tmux 로 Control + AI Hub 두 서비스를 한 번에 실행.
#
# 사용:
#   scripts/run_server.sh           # 세션 시작·attach (이미 떠있으면 attach)
#   scripts/run_server.sh down      # 세션 종료
#   scripts/run_server.sh status    # 세션 상태
#
# 의존:
#   - tmux
#   - host 에 ollama 가 떠있어야 한다 (`ollama serve` 또는 macOS 앱)
set -euo pipefail

SESSION="pingdergarten"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ACTION="${1:-up}"

if ! command -v tmux &>/dev/null; then
  echo "[run_server] tmux 가 설치되어 있지 않습니다 (brew install tmux)" >&2
  exit 1
fi

case "$ACTION" in
  up|"")
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      echo "[run_server] 세션 '$SESSION' 이미 떠있음 — attach"
      exec tmux attach -t "$SESSION"
    fi

    # ai-hub :8001  (왼쪽 pane)
    tmux new-session -d -s "$SESSION" -n servers -c "$REPO_ROOT/server/ai" \
      'uvicorn hub:app --host 0.0.0.0 --port 8001 --reload'

    # control :8000 (오른쪽 pane)
    tmux split-window -h -t "$SESSION:servers" -c "$REPO_ROOT/server/control" \
      'uvicorn main:app --host 0.0.0.0 --port 8000 --reload'

    tmux set -t "$SESSION" pane-border-status top
    tmux select-pane -t "$SESSION:servers.0" -T "ai-hub :8001"
    tmux select-pane -t "$SESSION:servers.1" -T "control :8000"

    echo "[run_server] 세션 '$SESSION' 시작 — attach"
    exec tmux attach -t "$SESSION"
    ;;
  down)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      tmux kill-session -t "$SESSION"
      echo "[run_server] 세션 '$SESSION' 종료"
    else
      echo "[run_server] 세션 '$SESSION' 없음"
    fi
    ;;
  status)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      echo "[run_server] '$SESSION' 실행 중"
      tmux list-windows -t "$SESSION"
    else
      echo "[run_server] '$SESSION' 없음"
    fi
    ;;
  *)
    echo "usage: $0 [up|down|status]" >&2
    exit 2
    ;;
esac
