# confluence_sync

Confluence Cloud 의 페이지를 로컬 마크다운으로 끌어오는 Python 모듈.
호출 진입점은 [`../sync_docs.sh`](../sync_docs.sh) 한 개로 통합되어 있다.

## 빠른 시작

대화형 메뉴로 페이지 선택:

```bash
scripts/sync_docs.sh
```

```
📚 동기화할 Confluence 페이지를 선택하세요:

   0. URL 직접 입력
   1. 사용자 요구사항 (User Requirements)
   2. System Requirements
   3. System Architecture
   4. Map
   5. ERD
   6. Interface Specification
   7. Sequence Diagram
   8. GUI
   9. State Diagram
  10. Directory Structure

   a. 전체 (1~10)
   q. 종료
```

### 인자로 즉시 실행

```bash
scripts/sync_docs.sh 1                  # User Requirements 만
scripts/sync_docs.sh 1,3,5              # 다중 선택
scripts/sync_docs.sh a                  # 전체 10개
scripts/sync_docs.sh 0 <URL>            # 임의 URL 직접 동기화
```

`0 <URL>` 형식은 등록되지 않은 페이지를 일회성으로 받을 때 사용:

```bash
scripts/sync_docs.sh 0 \
  https://woolimi.atlassian.net/wiki/spaces/FN/pages/40927292/State+Diagram
```

## 출력

| 종류 | 위치 |
|---|---|
| 마크다운 본문 | `docs/<name>.md` |
| 첨부 / 이미지 / drawio | `docs/<name>.assets/` |

`<name>` 은 등록 메뉴 항목이면 미리 정해진 kebab-case (예: `user-requirements`), `0. URL 직접 입력` 이면 페이지 제목 sanitize 결과 (예: `User-Requirements`). 기존 파일은 매번 덮어쓰며 `.assets/` 도 새로 채워진다 — Confluence 에서 첨부가 삭제됐을 때 stale 파일이 남지 않도록.

| 리소스 종류 | 본문 참조 형태 |
|---|---|
| 이미지 | `![alt](<name>.assets/<file>)` |
| drawio 원본 | `<name>.assets/<base>.drawio` |
| drawio PNG 프리뷰 | `<name>.assets/<base>.png` |
| mermaid (자동 변환) | 본문 인라인 ` ```mermaid ` 블록 + `<name>.assets/<base>.mmd` |

> drawio → mermaid 변환은 lossy: 노드/엣지만 보존되고 색·레이아웃·복잡 도형은 손실. 정밀 편집은 원본 `.drawio` 를 [diagrams.net](https://app.diagrams.net) 에서.

각 `.md` 상단에는 frontmatter 가 붙어 추후 push 시 페이지 ID/버전 추적이 가능:

```yaml
---
confluence_page_id: "41058328"
confluence_url: "https://..."
title: "User Requirements"
confluence_version: 6
last_synced: "2026-04-29T13:30:12"
---
```

## 페이지 목록 갱신

페이지 ID/슬러그가 바뀌었거나 메뉴 항목을 추가하려면 [`../sync_docs.sh`](../sync_docs.sh) 상단의 `PAGES=( ... )` 배열을 수정한다. 형식:

```
page_id|URL+slug|출력파일명|표시라벨
```

`|` 로 구분, 한 항목 = 한 줄.

## 폴더 구조

```
scripts/
  sync_docs.sh                    # 통합 진입점 (대화형)
  confluence_sync/
    sync_one_page.py              # 단일 페이지 → docs/<name>.md (sync_docs.sh 가 호출)
    pull_space.py                 # 스페이스 전체 트리 + storage HTML 캐시
    download_attachments.py       # 페이지별 첨부 다운로드
    build_html_md.py              # storage HTML → 브라우저용 HTML + 마크다운 빌드
    push_page.py                  # 로컬 MD → Confluence 페이지 업로드
    push_diagram.py               # mermaid/drawio → Confluence 다이어그램 업데이트
    confluence_sync.py            # status / tree / MD↔Confluence HTML 변환 헬퍼
    drawio_utils.py               # drawio ↔ mermaid 변환
    sync_config.json              # base_url, space_key, page_tree
    confluence_info.md            # 모듈 동작 상세 (3단계 파이프라인, 타겟 전환 등)
    .env                          # 토큰 (.gitignore 권장)
    .env.example
```

## 사전 준비 (.env)

`scripts/confluence_sync/.env` 에 토큰 설정. 없으면 `jira_sync/.env` 로 자동 폴백.

```
ATLASSIAN_EMAIL=본인이메일@example.com
ATLASSIAN_API_TOKEN=ATATT3xFfGF0...
```

토큰 발급: <https://id.atlassian.com/manage-profile/security/api-tokens>

## 다른 진입점 (직접 호출)

`sync_docs.sh` 외에도 모듈을 직접 부를 수 있다 — `scripts/confluence_sync/` 에서 실행:

```bash
cd scripts/confluence_sync
python sync_one_page.py <URL>            # 단일 페이지 → docs/
python pull_space.py                     # 스페이스 전체 트리 + storage HTML 캐시
python download_attachments.py           # 첨부 동기화
python build_html_md.py                  # confluence_content/<space>/{html,md}/ 생성
python confluence_sync.py status         # 로컬 MD 변경 감지
python confluence_sync.py tree           # confluence_content/ 트리 출력
python push_page.py <page_id>            # 로컬 MD → Confluence 업로드
python push_diagram.py <page_id> <base>  # 다이어그램 푸시
```

자세한 동작과 타겟 전환 방법은 [confluence_info.md](confluence_info.md) 참조.
