# 구현 완료 (Implemented)

이 문서는 [implementation-plan.md](implementation-plan.md) 에서 **완전히** 구현이 끝난 SR 을 옮겨 둔 곳이다. 이동 규칙은 루트 [CLAUDE.md](../CLAUDE.md) 의 "구현 완료 항목 관리" 섹션 참조.

부분 구현 (UI 만 완료, ROS2 publish 남음 등) 은 옮기지 않는다 — 모든 부분이 끝났을 때 한 번에 이동.

## 2. GogoPing UI

### 2.5 자장가

| S ID | Name | Description | Priority | 구현 위치 | 완료일 |
| --- | --- | --- | --- | --- | --- |
| SR-NAP-001 | 자장가 재생 | GogoPing UI (브라우저 `<audio>`) 가 사전 등록된 자장가 mp3 1곡을 재생한다. 종료는 §8.2 명령 인터페이스 (호출어 + 자연어 모드 전환) 로 처리. | High | `ui/robot-ui/src/composables/useModeAudio.ts`, `ui/robot-ui/public/audio/lullaby.mp3` | 2026-05-04 |

## 7. AI Server

### 7.4 음성 처리

| S ID | Name | Description | Priority | 구현 위치 | 완료일 |
| --- | --- | --- | --- | --- | --- |
| SR-VOICE-002 | 음성 인식 (STT) | 각 로봇 UI (브라우저) 가 Web Speech API (`webkitSpeechRecognition`, ko-KR) 로 음성을 텍스트로 변환한다 (클라이언트 측, 서버 STT 미사용). | High | `ui/robot-ui/src/composables/useSTT.ts` | 2026-05-04 |
| SR-VOICE-003 | 의도 분류 | AI Server 가 의도 분류 LLM 으로 텍스트의 의도(모드 전환 / 모드 내 서브 명령)를 분류한다. 분류되지 않는 발화는 무시한다. | High | `server/ai/{hub,llm}.py` (Ollama qwen2.5:3b) | 2026-05-04 |
| SR-VOICE-005 | 음성 출력 (TTS) | 각 로봇 UI (브라우저) 가 `window.speechSynthesis` API (ko-KR voice) 로 응답 텍스트를 음성으로 출력한다 (클라이언트 측, 서버 TTS 미사용). | High | `ui/robot-ui/src/composables/useTTS.ts` | 2026-05-04 |

## 8. 다중 UI 공통

### 8.2 명령 인터페이스

| S ID | Name | Description | Priority | 구현 위치 | 완료일 |
| --- | --- | --- | --- | --- | --- |
| SR-VOICE-007 | 호출어 인식 | 각 로봇 UI 가 Web Speech API STT 항상 듣기 모드로 텍스트 스트림을 모니터링하다 자기 이름 호출어("에듀핑" / "고고핑" / "노리암") 단어 매칭 시 즉시 진행 중인 동작을 일시 정지하고 음성으로 대답한 뒤 후속 명령 수신 윈도우 (5초) 를 활성화한다. 호출어와 명령이 같은 발화에 포함된 경우 (예: "에듀핑, 정리정돈 시작해") 는 호출어 직후 텍스트를 그대로 명령으로 처리하고 별도 윈도우 대기 없이 즉시 의도 분류로 전달한다. | High | `ui/robot-ui/src/composables/useVoiceController.ts` | 2026-05-04 |

### 8.3 표정 상시 표시

| S ID | Name | Description | Priority | 구현 위치 | 완료일 |
| --- | --- | --- | --- | --- | --- |
| SR-UI-001 | 표정 상시 표시 | 각 로봇 UI 가 표정 자원 (basic·hello·happy·fun·interest·bored·sad·angry — pinky_pro WebP 변환본 + sleep — 별도 자원) 을 현재 모드·이벤트에 따라 디스플레이에 상시 재생한다. | High | `ui/robot-ui/src/common/EmotionDisplay.vue`, `ui/robot-ui/public/emotions/*.webp` | 2026-05-04 |
