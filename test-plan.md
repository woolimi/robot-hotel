# 이번 주 스프린트 테스트 플랜

이번 주는 서비스 전반의 골격을 갖추는 데 집중한다. 교사와 학부모가 사용하는 **Portal Web**을 구축하고, 아이·학부모 **등록 기능**(정보 입력·얼굴 캡처·DB 저장)을 구현한다. **Robot UI**는 LLM(qwen2.5:3b)과 연동해 음성 명령으로 의도를 분류하고 GogoPing·NoriArm의 모드를 전환할 수 있도록 하는 것을 목표로 한다. 완전한 동작보다는 모드 전환과 LLM 응답이 흐름대로 연결되는 것을 우선으로 확인한다. 마지막으로 **Admin UI** 틀을 잡고, SLAM 맵 위에 GogoPing 위치를 표시하고 로봇 상태 로그를 실시간으로 받아볼 수 있도록 한다.

> 테스트 여부: **O** = 단독 테스트 가능 / **△** = 의존 환경 필요 (비고 참조)

---

## 1. Portal Web — 교사 UI (Educator UI)

| SR ID | 기능명 | 테스트 여부 |
|---|---|---|
| SR-REG-001 | 자녀 정보 입력 (이름·생년월일·반 폼) | O |
| SR-REG-002 | 학부모 정보 입력 (이름·이메일·연락처 폼, 초기 비밀번호 자동 발급) | O |
| SR-REG-003 | 입력 검증 (패턴·필수값·중복) | O |
| SR-OPS-002 | 출결 보드 표시 (등·하원 현황) | O |
| SR-OPS-014 | 점심메뉴 보기 (달력 월간 위젯) | O |
| SR-OPS-015 | 자녀 정보 보기 (이름·생년월일·반·등록 사진) | O |
| SR-OPS-016 | 학부모 정보 보기 (자녀별 이름·이메일·연락처) | O |
| SR-OPS-017 | 자녀 일일 보고서 보기 | O |
| SR-OPS-018 | 자녀 일일 보고서 편집·저장 | O |

---

## 2. Portal Web — 학부모 UI (Parent UI)

| SR ID | 기능명 | 테스트 여부 |
|---|---|---|
| SR-PAR-006 | 학부모 로그인 (이메일 + 비밀번호) | O |
| SR-PAR-007 | 비밀번호 변경 | O |
| SR-PAR-008 | 자녀 선택 (다자녀 매핑) | O |
| SR-PAR-001 | 등·하원 조회 | O |
| SR-PAR-004 | 점심메뉴 조회 (달력 월간 위젯) | O |

---

## 3. 아이·부모 등록 기능 (백엔드)

| SR ID | 기능명 | 테스트 여부 |
|---|---|---|
| SR-REG-004 | 등록 저장 (PostgreSQL INSERT·식별자 반환) | O |
| SR-REG-007 | 학부모-아이 매핑 (parent_child 테이블) | O |
| SR-REG-008 | 학부모 접근 권한 발급 (fastapi-users 세션) | O |
| SR-REG-009 | 아이-교사 매핑 (child_teacher 테이블) | O |
| SR-REG-005 | 얼굴 이미지 캡처 (WebRTC 15장, 품질 필터) | △ 카메라·WebRTC |
| SR-REG-006 | 얼굴 임베딩 추출·저장 (다중 임베딩 DB BLOB) | △ AI 서버·face 모델 |
| SR-REG-010 | 얼굴 인식 anti-spoofing (liveness 검증) | △ AI 서버·liveness 모델 |

---

## 4. Robot UI → LLM 연동 + 모드 전환 (GogoPing·NoriArm)

| SR ID | 기능명 | 테스트 여부 |
|---|---|---|
| SR-UI-002 | UI 모드·명령 버튼 클릭 | O |
| SR-UI-003 | 음성·타이핑 모드 토글 / SiriBlob 애니메이션 / barge-in | O |
| SR-VOICE-001 | 음성 입력 → `/api/voice/intent` 전달 | △ Control Server 실행 |
| SR-VOICE-004 | 잡담 자연어 응답 생성 | △ Ollama (qwen2.5:3b) 실행 |
| SR-OPS-001 | 모드 전환 (음성 명령 또는 클릭 → ROS2 latched 토픽 발행) | △ Control Server·ROS2 |
| SR-OPS-011 | 모드 내 자연어 명령 의도 분류·라우팅 | △ Ollama·ROS2 |
| SR-OPS-013 | 보조 모드 음성 입력 제한 (정지 의도만 수신) | △ ROS2 |

---

## 5. Admin UI — 틀 + 맵 + 로그

| SR ID | 기능명 | 테스트 여부 |
|---|---|---|
| SR-ADM-001 | 로봇 상태 실시간 표시 (위치·배터리·모드·작업 상태) | △ WebSocket·ROS2 상태 발행 |
| SR-ADM-004 | 지도 위젯 (SLAM 맵 + GogoPing 위치 오버레이) | △ nav graph 데이터 |
| SR-COM-001 | 로봇 상태 발행 (ROS2 → Control Server → WS push) | △ ROS2 환경 |
