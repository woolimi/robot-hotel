# Robot UI 공통 프레임 — Design Spec

작성일: 2026-05-04
대상 인스턴스 (1차): GogoPing (`VITE_ROBOT=gogoping`)

## 1. 목표

`ui/robot-ui/` 단일 코드베이스의 공통 프레임을 구축한다. 호출어 감지, STT, TTS, 의도 분류 디스패치, 표정 표시, 모드 셀렉터까지 동작하는 vertical slice 를 GogoPing 인스턴스로 시연 가능한 수준으로 만든다. 각 로봇별 모드 화면 (등원·하원·자장가 등) 은 본 spec 의 범위 밖이며, 이번엔 빈 stub 만 둔다.

## 2. 스택 변경

전체 UI 를 React → **Vue 3 + Vite + Pinia** 로 통일한다. Robot UI 와 Parent UI 둘 다 해당. 영향받는 docs 는 §11 에서 정정 사항 명시.

## 3. 폴더 구조

```
ui/robot-ui/
├── package.json              # vue@3, pinia, vite, @vitejs/plugin-vue, typescript, vue-tsc
├── vite.config.ts            # plugin-vue + intentMockPlugin
├── tsconfig.json
├── tsconfig.node.json
├── index.html                # kiosk full-screen entry
├── env.d.ts                  # ImportMetaEnv 타입 선언
├── public/
│   ├── audio/                # mp3 자리 (다음 단계)
│   └── emotions/             # 표정 자원 자리 (pinky pro 자원 받으면 여기에 배치)
├── src/
│   ├── main.ts               # createApp + Pinia 설치
│   ├── App.vue               # 공통 레이아웃 (표정 + 통합바 + FAB)
│   ├── config/
│   │   └── robots.ts         # VITE_ROBOT 분기 설정
│   ├── composables/
│   │   ├── useSTT.ts                # webkitSpeechRecognition wrapper
│   │   ├── useTTS.ts                # speechSynthesis wrapper
│   │   ├── useVoiceController.ts    # 호출어 감지 + 5상태 머신
│   │   └── useIntentDispatch.ts     # POST /api/voice/intent
│   ├── stores/
│   │   ├── voice.ts          # 음성 상태 (idle/wake/listening/dispatching/cooldown), 마지막 STT
│   │   └── mode.ts           # currentMode, currentEmotion, proximityHalt
│   ├── common/
│   │   ├── EmotionDisplay.vue
│   │   ├── StatusBar.vue            # 상단 통합바 (모드 / listening / STT)
│   │   ├── ModeSelectorFab.vue      # 우하단 FAB + 펼침 panel
│   │   └── ListeningIndicator.vue   # (StatusBar 내부 자식)
│   ├── eduping/              # 빈 stub
│   ├── gogoping/             # 빈 stub
│   ├── noriarm/              # 빈 stub
│   └── api/
│       └── client.ts         # fetch wrapper
└── mock/
    └── intentMockPlugin.ts   # vite plugin: /api/voice/intent + /api/mode rule-base
```

## 4. 로봇별 분기 설정

`src/config/robots.ts` 가 `VITE_ROBOT` 값에 따라 다음 객체를 반환한다.

| 키 | 타입 | 설명 |
|---|---|---|
| `id` | `'eduping' \| 'gogoping' \| 'noriarm'` | 로봇 식별자 |
| `wakeWord` | `string` | 호출어 (`에듀핑` / `고고핑` / `노리암`) |
| `modes` | `string[]` | 모드 셀렉터에 노출할 모드 ID 리스트 |
| `defaultEmotionByMode` | `Record<string, EmotionId>` | 모드별 default 표정 ([implementation-plan §0.2](../../implementation-plan.md) 매트릭스) |
| `restrictedVoiceMode` | `string \| null` | 음성 입력 제한 모드 (GogoPing 의 `보조`, SR-OPS-013) |

GogoPing 인스턴스 1차 demo 의 `modes` = `['대기', '등원', '하원', '보조', '숨바꼭질', '자장가']`.

## 5. 음성 상태 머신

### 5.1 5개 상태

| 상태 | 진입 조건 | 동작 | 다음 상태 |
|---|---|---|---|
| `idle` | 초기 상태 또는 cooldown 종료 | STT 항상 듣기. 텍스트 청크가 들어올 때마다 호출어 토큰 검색 | (호출어 매칭) `wake_detected` |
| `wake_detected` | 호출어 매칭 | 진행 중인 동작 일시 정지, TTS "네!" 재생, 표정 잠시 `hello`. TTS 재생 중 들어오는 STT 결과는 echo 회피로 무시 | (잔여 텍스트 있음) `dispatching` / (없음) `listening` |
| `listening` | wake_detected 후 잔여 없음 | 5초 윈도우, STT final result 대기 | (final 수신) `dispatching` / (5s 타임아웃) `cooldown` |
| `dispatching` | wake_detected 잔여 또는 listening 결과 | `POST /api/voice/intent` 호출, 응답으로 mode/sub_command 적용 | (응답 처리 완료) `cooldown` |
| `cooldown` | dispatching 종료 또는 listening 타임아웃 | 200ms TTS echo 보호 구간 (자기 TTS 가 STT 로 다시 잡히는 것 방지) | (타이머 종료) `idle` |

### 5.2 결합 발화 (SR-VOICE-007)

STT 결과 텍스트를 trim 후 정규식 `/(에듀핑|고고핑|노리암)[\s,]*(.*)$/` 으로 첫 매칭 검색 (호출어가 발화 앞에 있어도, 중간·뒤에 있어도 매칭):
- group 2 (잔여) 가 비어있지 않으면 → 즉시 `dispatching` 진입, listening 5초 윈도우 skip
- 비어있으면 → `listening` 진입 후 후속 발화 대기
- 매칭된 호출어가 자기 로봇의 `wakeWord` 와 다르면 무시 (옆 로봇용 발화 흘려보내기)

예: `"고고핑 자장가 시작해줘"` → group 2 = `"자장가 시작해줘"` → 바로 dispatching.
예: `"음... 고고핑 정지"` → group 2 = `"정지"` → 바로 dispatching.

### 5.3 SR-OPS-013 보조 모드 음성 입력 제한

`useVoiceController` 가 `mode.currentMode === restrictedVoiceMode` 일 때:
- 호출어 매칭, wake_detected 진입, TTS "네!" 응답까지는 동일
- `dispatching` 직전에 텍스트가 정지 의도 (`정지` / `멈춰` / `그만`) 인지 확인
- 정지 의도 → 그대로 dispatching → stop sub_command 처리
- 정지 의도 외 → dispatching 건너뛰고 cooldown 직행, `proximityHalt` resume 신호로 직전 동작 재개

## 6. 백엔드 — Control + AI Hub

> 1차 구현은 mock Vite plugin 으로 시작했으나 Control Service + AI Hub (Qwen3 4B) 가 들어오면서 mock 은 fallback 으로 격하 (`VITE_USE_MOCK=true` 일 때만 사용).

기본 흐름:
```
Robot UI (browser :5173)
   ↓ Vite proxy /api/* → http://localhost:8000
Control Service (FastAPI :8000)
   ↓ httpx forward → http://localhost:8001/voice/intent
AI Hub (FastAPI :8001)
   ↓ httpx → http://localhost:11434
Ollama (host native, qwen3:4b)
```

| 컴포넌트 | 책임 |
|---|---|
| Control (`server/control/main.py`) | 브라우저 진입점. `/api/voice/intent` 받아 AI Hub forward. `/api/mode` 클릭은 의도 분류 우회 (다음 단계: ROS2 latched topic publish + DB mode_history INSERT) |
| AI Hub (`server/ai/hub.py`) | Qwen3 의도 분류. 정지 의도는 LLM 우회 (rule-base). LLM 실패 시 graceful `ignored` |
| AI Hub (`server/ai/llm.py`) | Ollama HTTP 호출 (`/api/generate`, `format=json`, `think=false`, `temperature=0.1`) |

### 6.1 mock fallback (Vite plugin)

`mock/intentMockPlugin.ts` 는 Vite `configureServer` hook 으로 두 endpoint 를 가로챈다.

### 6.1 `POST /api/voice/intent`

요청 body: `{ text: string, robot: 'eduping' | 'gogoping' | 'noriarm' }`

응답 규칙 (rule-base):
- 텍스트에 모드 이름 토큰 (해당 로봇의 `modes` 중 하나) 포함 → `{ kind: 'mode_change', mode: <매칭된 모드> }`
- 텍스트에 정지 의도 토큰 (`정지` / `멈춰` / `그만`) 포함 → `{ kind: 'sub_command', action: 'stop' }`
- 그 외 → `{ kind: 'ignored' }`

### 6.2 `POST /api/mode`

요청 body: `{ robot: ..., mode: string }`. 받은 mode 그대로 `{ ok: true, mode }` 반사.

### 6.3 교체 경로

Control Service 가 붙으면 `vite.config.ts` 에서 `intentMockPlugin` 제거하고 `server.proxy` 로 `/api/*` → Control Service URL 한 줄 추가. 앱 코드는 변경 없음.

## 7. 레이아웃

kiosk landscape (16:9 가정, 최소 1024×576). full-screen.

### 7.1 영역

| 영역 | 위치 | 크기 | 내용 |
|---|---|---|---|
| 표정 무대 | 화면 중앙 | 표정 약 50% width | `EmotionDisplay` (애니 미세 bob) |
| 상단 통합바 | 상단 중앙 (`top: 14px`) | 가로 max 75% | mode tag + listening dot + STT 텍스트 ellipsis |
| 모드 FAB | 우하단 (`right/bottom: 14px`) | 56×56 원형 | 햄버거 아이콘 + 모드 개수 배지 |
| 모드 panel | FAB 위 pop-up | width 280px | 3열 grid, 모드 버튼 |

### 7.2 FAB 동작

- collapsed (default): 햄버거 아이콘, 흰 배경, 배지 = 모드 개수
- click → expanded: panel slide/fade-in (150ms), FAB 가 X 아이콘 + 핑크 배경으로 변형
- panel 외부 클릭 또는 모드 선택 → 자동 collapsed
- 모드 선택 시 panel 즉시 닫고 모드 갱신 + 의도 분류 우회 mock `/api/mode` 호출 (UI 클릭은 의도 분류 거치지 않음, SR-UI-002)

## 8. 표정

`EmotionDisplay.vue` 의 props: `emotion: EmotionId`. 8종 (`basic / hello / happy / fun / interest / bored / sad / angry`).

### 8.1 자원 출처

[pinklab-art/pinky_pro](https://github.com/pinklab-art/pinky_pro) 의 `pinky_emotion/emotion/*.gif` 8개 파일 (Apache-2.0).

- 600×450 으로 resize, WebP lossy q=80 으로 변환 (원본 ~32MB → 0.82MB)
- `ui/robot-ui/public/emotions/<emotion>.webp` 로 commit
- 같은 디렉토리에 `NOTICE.md` 로 출처·라이선스·변환 내역 명시

### 8.2 sleeping 누락 처리

원본에 `sleeping.gif` 가 없다. GogoPing 자장가 모드 default 표정을 `sleeping` → `bored` 로 변경. [implementation-plan.md](../../implementation-plan.md) §0.2 매트릭스의 `자장가` 행과 §0.3 자원 리스트도 같이 정정.

### 8.3 렌더

`EmotionDisplay` 가 `<img :src="\`/emotions/${emotion}.webp\`">` 로 표시. WebP 애니메이션은 Chromium 에서 GIF 와 동일하게 `<img>` 태그로 자동 재생됨.

## 9. 패키지 의존성

```json
{
  "dependencies": {
    "vue": "^3.5",
    "pinia": "^2.2"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-vue": "^5",
    "typescript": "^5",
    "vue-tsc": "^2"
  }
}
```

라우터 미사용 (kiosk 단일 화면). 컴포넌트 비동기 로드는 `defineAsyncComponent` 로 처리.

## 10. 검증 시나리오

`scripts/ui-robot.sh gogoping` 실행 시 다음이 동작해야 한다:

1. 페이지 로드 → `currentMode='대기'`, `currentEmotion='basic'`, listening dot 표시
2. 마이크 권한 허용 → STT 듣기 시작
3. **결합 발화**: "고고핑 자장가 시작해줘" 발화 → STT 텍스트가 통합바에 표시 → mock `/api/voice/intent` 가 `mode_change(자장가)` 응답 → `currentMode='자장가'`, `currentEmotion='sleeping'`
4. **분리 발화**: "고고핑" → TTS "네!" + 표정 hello 1초 → 5초 listening 윈도우 → "자장가" 발화 → 위 3과 동일 처리
5. **클릭 진입**: FAB 클릭 → panel 펼침 → "자장가" 버튼 클릭 → panel 닫힘 + mode 전환
6. **무관 발화**: "고고핑 안녕" → mock `ignored` → 모드 변동 없음, cooldown 후 idle 복귀
7. **GogoPing 보조 모드 제한**: 모드 = `보조` 상태에서 "고고핑 자장가 시작해줘" → TTS "네!" 응답하지만 모드 변경 안 됨, "고고핑 정지" → 정지 처리

## 11. 영향받는 docs 정정

본 spec 승인 후 다음을 같은 commit 으로 정정한다.

| 파일 | 변경 |
|---|---|
| [docs/tech-stack.md](../../tech-stack.md) | §1 표의 Robot UI / Parent UI 행 "React + Vite" → "Vue 3 + Vite + Pinia". 의존성 항목 동시 수정 |
| [docs/folder-structure.md](../../folder-structure.md) | line 39 / 48 주석 "React + Vite" → "Vue 3 + Vite" |
| [docs/implementation-plan.md](../../implementation-plan.md) | §0 표의 Robot UI / Parent UI 행 framework 부분 |

Confluence push 는 사용자 트리거 시점에 별도 진행한다 (frontmatter 의 `confluence_version` 자동 갱신은 push 스크립트 담당).

## 12. 범위 밖 (다음 spec 분리)

- 각 로봇 모드별 화면 (등원·하원·자장가·숨바꼭질·보조 등 GogoPing 6개 + EduPing 5개 + NoriArm 3개)
- ROS state push 수신 (`/ws/robot-state`) — 본 1차에선 mock 응답으로 모드 갱신, ROS 연동은 Control Service 가 붙은 뒤
- 학부모 / 교사 UI design (별도 spec)
- 표정 자원 교체 (pinky pro 자원 위치 확정 후 별도 작업)
