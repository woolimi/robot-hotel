# scripts

레포 작업용 셸 스크립트 모음.

| 스크립트 | 용도 |
|---|---|
| [sync_docs.sh](sync_docs.sh) | 대화형 메뉴로 고정된 Design 페이지 골라 `docs/` 에 동기화 |
| [sync_confluence_page.sh](sync_confluence_page.sh) | URL 직접 받아서 임의의 Confluence 페이지 1개 동기화 |

---

## `sync_docs.sh`

대화형 셸 메뉴로 Confluence Design 섹션의 **고정 페이지 10개** 중 골라서 [docs/](../docs/) 에 마크다운으로 동기화한다. 내부적으로 [sync_confluence_page.sh](sync_confluence_page.sh) 를 호출한다.

### 사용법

```bash
scripts/sync_docs.sh           # 대화형 선택 메뉴
scripts/sync_docs.sh <번호>    # 특정 페이지 즉시 동기화 (예: 1)
scripts/sync_docs.sh 1,3,5     # 여러 페이지 동시 동기화
scripts/sync_docs.sh a         # 전체 10개 일괄 동기화
scripts/sync_docs.sh -h        # 도움말
```

### 메뉴 구성

| 번호 | 페이지 | 출력 파일 |
|---:|---|---|
| 1 | 사용자 요구사항 (User Requirements) | `docs/user-requirements.md` |
| 2 | System Requirements | `docs/system-requirements.md` |
| 3 | System Architecture | `docs/system-architecture.md` |
| 4 | Map | `docs/map.md` |
| 5 | ERD | `docs/erd.md` |
| 6 | Interface Specification | `docs/interface-specification.md` |
| 7 | Sequence Diagram | `docs/sequence-diagram.md` |
| 8 | GUI | `docs/gui.md` |
| 9 | State Diagram | `docs/state-diagram.md` |
| 10 | Directory Structure | `docs/directory-structure.md` |

각 페이지에 첨부·이미지·drawio 가 있으면 같은 위치에 `<name>.assets/` 폴더가 자동 생성된다. 기존 파일이 있으면 덮어쓰며, `.assets/` 도 매번 새로 채워진다.

### 페이지 목록 갱신

페이지 ID/슬러그가 바뀌었거나 항목을 추가하려면 [sync_docs.sh](sync_docs.sh) 상단의 `PAGES=( ... )` 배열을 수정한다. 형식: `page_id|URL+slug|출력파일명|표시라벨` (`|` 로 구분).

---

## `sync_confluence_page.sh`

Confluence 페이지 **한 개**를 [docs/](../docs/) 디렉토리에 마크다운으로 동기화한다.

URL 의 `page_id` 를 추출해 해당 페이지만 받고, 이미지 / drawio / mermaid 는 `docs/<title>.assets/` 폴더에 함께 저장한다. 임시 다운로드 파일은 종료 시 자동 삭제되고, 같은 이름의 파일이 이미 있으면 **덮어쓴다**.

### 사전 준비

- `confluence_sync/.env` 에 `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` 설정 (없으면 `jira_sync/.env` 로 자동 폴백). 자세한 절차는 [confluence_sync/confluence_info.md](../confluence_sync/confluence_info.md) 참조.
- Python 3 + `requests` + `python-dotenv` 필요.

### 사용법

```bash
scripts/sync_confluence_page.sh <Confluence 페이지 URL> [--output-name NAME]
```

| 인자 | 설명 |
|---|---|
| `<URL>` | `https://<host>/wiki/spaces/<KEY>/pages/<ID>/<slug>` 형태 |
| `--output-name`, `-o` | 저장 파일명 (확장자 제외). 미지정 시 페이지 제목을 sanitize 해서 사용 |
| `--output-dir` | 출력 디렉토리 (기본: `docs/`) |

### 예시

**1) 페이지 제목 기반 자동 파일명**

```bash
scripts/sync_confluence_page.sh \
  https://woolimi.atlassian.net/wiki/spaces/FN/pages/41058328/User+Requirements
```

→ 결과:
- `docs/User-Requirements.md`
- `docs/User-Requirements.assets/` (첨부가 있는 경우에만 생성)

**2) 기존 파일을 덮어쓰고 싶을 때 — 파일명 명시**

```bash
scripts/sync_confluence_page.sh \
  https://woolimi.atlassian.net/wiki/spaces/FN/pages/41058328/User+Requirements \
  --output-name user-requirements
```

→ 결과: `docs/user-requirements.md` 가 새 내용으로 갱신됨.

**3) 다른 페이지 받기 — 출력 디렉토리도 지정**

```bash
scripts/sync_confluence_page.sh \
  https://woolimi.atlassian.net/wiki/spaces/FN/pages/40927292/State+Diagram \
  --output-dir docs/design
```

→ 결과: `docs/design/State-Diagram.md` + `docs/design/State-Diagram.assets/`

### 출력 마크다운 구조

각 파일 상단에 frontmatter 가 붙는다 — 추후 push 시 페이지 ID/버전 추적용.

```markdown
---
confluence_page_id: "41058328"
confluence_url: "https://woolimi.atlassian.net/wiki/spaces/FN/pages/41058328/User+Requirements"
title: "User Requirements"
confluence_version: 6
last_synced: "2026-04-29T12:06:47"
---

# User Requirements

(본문...)
```

### 리소스 처리

| 종류 | 저장 위치 | 본문 참조 형태 |
|---|---|---|
| 이미지 첨부 | `<name>.assets/<filename>` | `![alt](<name>.assets/<filename>)` |
| drawio 원본 | `<name>.assets/<base>.drawio` | `[📐 …](…)` 링크 |
| drawio PNG 프리뷰 | `<name>.assets/<base>.png` | `![…](…)` |
| mermaid (자동 변환) | `<name>.assets/<base>.mmd` | 본문에 ` ```mermaid ` 인라인 블록 |

> drawio → mermaid 변환은 lossy 합니다 (단순 vertex/edge 만 보존, 색·레이아웃·복잡 도형은 손실). 정밀한 편집은 원본 `.drawio` 를 [diagrams.net](https://app.diagrams.net) 에서 열어서.

### 동작 방식 (요약)

1. URL 파싱 → `(base_url, space_key, page_id, slug)` 추출
2. `GET /wiki/api/v2/pages/{id}?body-format=storage` — 페이지 1건만 가져옴
3. `GET /wiki/rest/api/content/{id}/child/attachment` — 첨부 메타 + 다운로드 (임시 디렉토리)
4. drawio 매크로 검출 → `.drawio` / `.png` / `.mmd` 3종을 `.assets/` 로 저장
5. Confluence storage HTML → 일반 HTML → Markdown 변환
6. frontmatter 붙여 `docs/<name>.md` 로 저장
7. 임시 디렉토리 자동 삭제

> 재실행하면 `.assets/` 폴더는 매번 비워지고 다시 채워집니다 — Confluence 에서 첨부가 삭제됐을 때 로컬에 stale 파일이 남지 않도록.

### 관련 파일

- 진입점: [scripts/sync_confluence_page.sh](sync_confluence_page.sh)
- 실제 구현: [confluence_sync/sync_one_page.py](../confluence_sync/sync_one_page.py)
- 변환 로직 재사용: [confluence_sync/build_html_md.py](../confluence_sync/build_html_md.py), [confluence_sync/drawio_utils.py](../confluence_sync/drawio_utils.py)
