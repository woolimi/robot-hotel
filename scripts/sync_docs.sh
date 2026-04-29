#!/usr/bin/env bash
# 대화형으로 Confluence 의 Design 섹션 고정 페이지를 골라 docs/ 에 마크다운으로 동기화.
#
# 번호를 입력하면 해당 페이지만 받고, 쉼표로 다중 선택 가능, 'a' 는 전체, 'q' 는 종료.
# 인자로 번호를 넘기면 프롬프트 없이 즉시 실행:  scripts/sync_docs.sh 1
# 같은 이름의 .md 파일이 있으면 덮어쓰고, .assets 폴더는 매번 새로 채워진다.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SYNC="$ROOT_DIR/scripts/sync_confluence_page.sh"
BASE_URL="https://woolimi.atlassian.net"
SPACE_KEY="FN"

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
  cat <<EOF
사용법:
  scripts/sync_docs.sh           # 대화형 선택 메뉴
  scripts/sync_docs.sh <번호>    # 특정 페이지 즉시 동기화
  scripts/sync_docs.sh 1,3,5     # 여러 페이지 동시 동기화
  scripts/sync_docs.sh a         # 전체 일괄 동기화
  scripts/sync_docs.sh -h        # 도움말
EOF
}

print_menu() {
  echo
  echo "📚 동기화할 Confluence 페이지를 선택하세요:"
  echo
  for i in "${!PAGES[@]}"; do
    IFS='|' read -r _ _ _ label <<< "${PAGES[$i]}"
    printf "  %2d. %s\n" $((i+1)) "$label"
  done
  echo
  echo "   a. 전체"
  echo "   q. 종료"
  echo
}

# 도움말
if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  show_help
  exit 0
fi

# 입력 결정 — 인자 우선, 없으면 프롬프트
if [[ $# -ge 1 ]]; then
  choice="$1"
else
  print_menu
  read -rp "선택 [번호 / 1,3,5 / a / q]: " choice
fi

# 공백 제거
choice="${choice// /}"

if [[ -z "$choice" ]]; then
  echo "취소됨." >&2
  exit 0
fi

# 선택지 → 인덱스 배열로 변환
case "$choice" in
  q|Q)
    echo "취소됨."
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
        echo "❌ 잘못된 선택: '$p' (1~${#PAGES[@]} 범위, 'a', 'q' 만 허용)" >&2
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
  if "$SYNC" "${BASE_URL}/wiki/spaces/${SPACE_KEY}/pages/${pid}/${slug}" --output-name "$name"; then
    ok=$((ok+1))
  fi
done

echo
echo "결과: $ok/$total 성공"
