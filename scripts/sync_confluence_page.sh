#!/usr/bin/env bash
# Confluence 페이지 1개를 docs/ 디렉토리에 마크다운으로 동기화한다.
#
# URL 의 page_id 를 추출해 해당 페이지만 받고, 이미지/drawio/mermaid 는
# docs/<title>.assets/ 폴더에 저장된다. 임시 다운로드 파일은 종료 시 자동 삭제.
# 같은 이름의 파일이 있으면 업데이트(덮어쓰기).
#
# 사용법:
#   scripts/sync_confluence_page.sh <Confluence 페이지 URL>
#   scripts/sync_confluence_page.sh <URL> --output-name user-requirements
#
# 예:
#   scripts/sync_confluence_page.sh \
#     https://woolimi.atlassian.net/wiki/spaces/FN/pages/41058328/User+Requirements

set -euo pipefail

if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
    sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/confluence_sync"

# 가상환경 우선, 없으면 시스템 python3
if [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
    PY="$ROOT_DIR/.venv/bin/python"
else
    PY="python3"
fi

exec "$PY" sync_one_page.py "$@"
