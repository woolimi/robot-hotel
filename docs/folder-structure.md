# 폴더 구조

```
robot-hotel/
  .env                        # Atlassian 토큰 (모든 스크립트의 단일 소스, .gitignore)
  .env.example                # 토큰 템플릿
  docs/                       # 설계 문서 (Confluence 와 동기화)
    user-requirements.md      # 사용자 요구사항
    system-requirements.md    # 시스템 요구사항
    robots/                   # 로봇별 하드웨어 사양
      omx-ai.md               # OMX-AI (객실 매니퓰레이터)
      openarm.md              # OpenArm (체크인 듀얼 암)
      vic-pinky.md            # Vic Pinky (룸서비스 모바일 베이스)
  scripts/                    # 운영/동기화 스크립트
    sync_docs.sh              # Confluence → docs/ 동기화 진입점
    _sync_docs/               # Confluence pull 모듈 (Python)
```

애플리케이션 코드는 아직 없다 — 요구사항 정의 단계.

## docs/

Confluence 와 양방향 동기화되는 마크다운 문서. 상단 frontmatter(`confluence_page_id` 등)는 동기화 메타데이터이므로 직접 편집하지 않는다. `.assets/` 디렉토리는 매 동기화마다 재생성된다.

자세한 규칙: [docs/CLAUDE.md](CLAUDE.md).

## scripts/

현재는 Confluence 동기화 스크립트만 들어 있다. 진입점은 `sync_docs.sh` 한 개.

```bash
scripts/sync_docs.sh          # 대화형 메뉴
scripts/sync_docs.sh a        # 등록된 페이지 전체
```

자세한 사용법: [scripts/_sync_docs/CLAUDE.md](../scripts/_sync_docs/CLAUDE.md).
