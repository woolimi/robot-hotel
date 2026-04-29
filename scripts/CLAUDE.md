# scripts/

Confluence ↔ `docs/` 동기화 도구. 진입점은 [sync_docs.sh](sync_docs.sh).

```bash
scripts/sync_docs.sh              # 대화형 메뉴
scripts/sync_docs.sh 1,3,5        # 다중 선택
scripts/sync_docs.sh a            # 등록 페이지 전체
scripts/sync_docs.sh 0 <URL>      # 등록 안 된 URL 일회성
```

페이지 등록은 `sync_docs.sh` 상단 `PAGES=( ... )` 배열을 직접 편집 — `page_id|URL+slug|출력파일명|표시라벨` 형식.

토큰은 프로젝트 루트의 [.env](../.env) 에만 두고 절대 커밋하지 않는다 (`ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`). 템플릿: [../.env.example](../.env.example).

자세한 동작: [_sync_docs/CLAUDE.md](_sync_docs/CLAUDE.md).
