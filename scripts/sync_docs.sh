#!/usr/bin/env bash
# 대화형으로 Confluence 페이지를 docs/ 디렉토리에 마크다운으로 동기화.
#
# 메뉴:
#   0. URL 직접 입력 (등록되지 않은 페이지를 임시로 받기)
#   1~10. 미리 등록된 Design 섹션 페이지
#   a. 전체 (1~10)
#   q. 종료
#
# 사용법:
#   scripts/sync_docs.sh                # 메뉴 표시
#   scripts/sync_docs.sh <번호>         # 즉시 실행
#   scripts/sync_docs.sh 1,3,5          # 다중 선택
#   scripts/sync_docs.sh 0 <URL>        # URL 직접 입력
#   scripts/sync_docs.sh a              # 전체
#
# 같은 이름의 .md 파일이 있으면 덮어쓴다. .assets/ 폴더는 매번 새로 채워진다.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SYNC_DIR="$SCRIPT_DIR/confluence_sync"
BASE_URL="https://woolimi.atlassian.net"
SPACE_KEY="FN"

# Python: 가상환경 우선
if [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
  PY="$ROOT_DIR/.venv/bin/python"
else
  PY="python3"
fi

# (page_id | URL slug | 출력 파일명 | 표시 라벨)
PAGES=(
  "41058328|User+Requirements|user-requirements|사용자 요구사항 (User Requirements)"
  "40763414|System+Requirements|system-requirements|System Requirements"
  "41189416|System+Architecture|system-architecture|System Architecture"
  "40927273|Map|map|Map"
  "40796220|ERD|erd|ERD"
  "40927253|Interface+Specification|interface-specification|Interface Specification"
  "40992866|Sequence+Diagram|sequence-diagram|Sequence Diagram"
  "41189397|GUI|gui|GUI"
  "40927292|State+Diagram|state-diagram|State Diagram"
  "40763394|Directory+Structure|directory-structure|Directory Structure"
)

show_help() {
  sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
}

print_menu() {
  echo
  echo "📚 동기화할 Confluence 페이지를 선택하세요:"
  echo
  printf "   0. URL 직접 입력\n"
  for i in "${!PAGES[@]}"; do
    IFS='|' read -r _ _ _ label <<< "${PAGES[$i]}"
    printf "  %2d. %s\n" $((i+1)) "$label"
  done
  echo
  echo "   a. 전체 (1~${#PAGES[@]})"
  echo "   q. 종료"
  echo
}

# Python sync 호출 — output-name 이 비어있으면 자동(페이지 제목 sanitize)
run_sync() {
  local url="$1" name="${2:-}"
  if [[ -n "$name" ]]; then
    (cd "$SYNC_DIR" && "$PY" sync_one_page.py "$url" --output-name "$name")
  else
    (cd "$SYNC_DIR" && "$PY" sync_one_page.py "$url")
  fi
}

# 도움말
if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  show_help
  exit 0
fi

# 인자 처리: 0 + URL 형태 먼저 분기
if [[ ${1:-} == "0" && $# -ge 2 ]]; then
  run_sync "$2"
  exit 0
fi

# 입력 결정
if [[ $# -ge 1 ]]; then
  choice="$1"
else
  print_menu
  read -rp "선택 [번호 / 1,3,5 / 0 / a / q]: " choice
fi

choice="${choice// /}"
if [[ -z "$choice" ]]; then
  echo "취소됨." >&2
  exit 0
fi

# 선택지 분기
case "$choice" in
  q|Q)
    echo "취소됨."
    exit 0
    ;;
  0)
    read -rp "Confluence 페이지 URL: " url
    url="${url//[[:space:]]/}"
    if [[ -z "$url" ]]; then
      echo "❌ URL이 비어있습니다." >&2
      exit 1
    fi
    run_sync "$url"
    exit 0
    ;;
  a|A)
    indices=()
    for i in "${!PAGES[@]}"; do indices+=("$i"); done
    ;;
  *)
    indices=()
    IFS=',' read -ra parts <<< "$choice"
    for p in "${parts[@]}"; do
      if ! [[ "$p" =~ ^[0-9]+$ ]] || (( p < 1 || p > ${#PAGES[@]} )); then
        echo "❌ 잘못된 선택: '$p' (0, 1~${#PAGES[@]}, 'a', 'q' 만 허용)" >&2
        exit 1
      fi
      indices+=("$((p-1))")
    done
    ;;
esac

total=${#indices[@]}
ok=0
for n in "${!indices[@]}"; do
  i=${indices[$n]}
  IFS='|' read -r pid slug name label <<< "${PAGES[$i]}"
  echo
  echo "═══ [$((n+1))/$total] $label ═══"
  if run_sync "${BASE_URL}/wiki/spaces/${SPACE_KEY}/pages/${pid}/${slug}" "$name"; then
    ok=$((ok+1))
  fi
done

echo
echo "결과: $ok/$total 성공"
