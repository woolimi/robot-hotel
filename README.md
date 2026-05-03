# pingdergarten

유치원 교육보조로봇 서비스. 아이와 놀아주고 교사를 보조한다.

- **OpenArm** — 놀이·정리정돈
- **Pinky** — 등하원·교사 추종·운반·놀이
- **OMX ×3** — 교실 비치·Pinky 양팔

Addinedu 4기 최종 프로젝트 | 팀 사랑의 에듀핑 | 2026-04-23 ~ 2026-06-04

---

## 서비스 구성

| 디렉터리 | 역할 |
|---|---|
| `server/ai` | AI Hub — 음성 명령 의도 분류 (Ollama Qwen3) |
| `server/control` | Control Service — REST/WS 게이트웨이, ROS2 브리지 |
| `ui/robot-ui` | 교사용 웹 UI (Vue 3) |

## 시작하기

### 사전 준비

- conda 환경 (`jazzy`, Python 3.11+)
- [Ollama](https://ollama.com) 설치 및 실행 (`ollama serve`)
- tmux

### 설치

```bash
git clone <repo-url>
cd pingdergarten
```

의존성은 본인의 Python 환경에 맞게 설치한다.

```bash
pip install -e .
```

### 서버 실행

```bash
# AI Hub(:8001) + Control Service(:8000) 동시 실행
scripts/run_server.sh

# 종료
scripts/run_server.sh down
```

### UI 실행

```bash
cd ui/robot-ui
npm install
npm run dev
```

## 환경 변수

루트에 `.env` 파일을 만든다 (`.env.example` 참고).
