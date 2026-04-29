# docs/

Confluence 와 양방향 동기화되는 설계 문서.

- 상단 frontmatter(`confluence_page_id` 등)는 동기화 메타데이터 — **직접 편집 금지** (`scripts/sync_docs.sh` 가 갱신).
- 본문을 로컬에서 고쳐도 다음 pull 시 덮어쓰일 수 있다. 영속 변경은 Confluence 에서 하거나 push 스크립트로 올린다.
- `.assets/` 디렉토리(이미지·drawio)는 매 동기화마다 재생성 — 수기로 파일을 추가하지 않는다.

새 문서 등록·동기화 명령은 [../scripts/CLAUDE.md](../scripts/CLAUDE.md), 모듈 동작 상세는 [../scripts/_sync_docs/CLAUDE.md](../scripts/_sync_docs/CLAUDE.md).
