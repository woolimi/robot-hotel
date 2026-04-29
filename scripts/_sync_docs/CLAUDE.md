# _sync_docs/

[`../sync_docs.sh`](../sync_docs.sh) 가 호출하는 Confluence pull 모듈. 세 파일.

| 파일 | 역할 |
|---|---|
| [sync_one_page.py](sync_one_page.py) | URL 하나 → `docs/<name>.md` + `.assets/` |
| [html_md_converter.py](html_md_converter.py) | Confluence storage HTML → 일반 HTML → Markdown 변환 |
| [drawio_utils.py](drawio_utils.py) | drawio ↔ mermaid 변환 |

## 주의

- 매 실행마다 `<name>.md` 와 `<name>.assets/` 를 덮어쓴다 — 로컬 수정은 사라진다.
- drawio → mermaid 는 lossy (노드/엣지만 보존, 색·레이아웃 손실). 정밀 편집은 원본 `.drawio` 를 [diagrams.net](https://app.diagrams.net) 에서.
- 페이지 메뉴 갱신은 [`../sync_docs.sh`](../sync_docs.sh) 의 `PAGES=( ... )` 배열을 직접 편집. 형식: `page_id|URL+slug|출력파일명|표시라벨`.

## 의존성

```bash
pip install -r requirements.txt    # 프로젝트 루트에서
```

`requirements.txt`: `requests`, `python-dotenv`. `sync_docs.sh` 는 `.venv/bin/python` 이 있으면 자동으로 사용한다.

## 직접 호출

```bash
cd scripts/_sync_docs
python sync_one_page.py <Confluence 페이지 URL>
```

토큰은 프로젝트 루트 `.env` 에서 읽는다 (`ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`).
