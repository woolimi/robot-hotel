# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Addinedu 4기 최종 프로젝트 — **pingdergarten**. 유치원에서 아이와 놀아주고 교사를 보조하는 교육보조로봇 서비스. OpenArm(놀이·정리정돈), Pinky(등하원·교사 추종·운반·놀이), OMX 3대(교실 비치·Pinky 양팔)로 구성된 로봇이 등원부터 하원까지 하루 일과를 함께한다.

- 팀명: 사랑의 에듀핑
- 프로젝트명: pingdergarten
- 팀: 6명
- 기간: 2026-04-23 ~ 2026-06-04 (약 7주)
- 진행 단계: 시뮬레이션 검증 → 실물 이전
- 현재 상태: 요구사항 정의 단계 (코드 미작성)

## 로봇 구성

| 서비스명 | 하드웨어 | 수량·배치 |
|---|---|---|
| **EduPing** | OpenArm | 1대 / 위치 가변 (운영자 배치) |
| **GogoPing** | Vic Pinky | 1대 / 정문·교실·복도 자율 주행 |
| **GogoArm** | OMX | 2대 / GogoPing 양팔 (Left/Right) |
| **NoriArm** | OMX | 1대 / 교실 비치 (가변) |

## 시스템 모드

각 로봇 UI 가 자기 모드 (대기·등하원·놀이·보조·자장가 등) 를 가지며, 호출어("에듀핑"/"고고핑"/"노리암") + 자연어 명령 또는 UI 버튼 클릭으로 전환한다. GogoPing 의 보조 모드는 음성 입력이 비상 정지로만 제한된다.

하루 일과 흐름:

```
[등원] → [레크리에이션·놀이] → [식사·간식] → [낮잠] → [하원]
```

## 클라이언트 인터페이스

| 액터 | 인터페이스 | 주요 기능 |
|---|---|---|
| 아이 | 로봇 디스플레이(EduPing·GogoPing·NoriArm) + 음성·제스처 | 출석 인사, 놀이 진행, 자장가 |
| 교사 | PyQt5 데스크톱 앱 (Control Service REST 경유, ROS2 직접 통신 안 함) | 자녀 등록 (얼굴 + 학부모 정보), 출결 보기, 정보 보기 (점심메뉴·자녀·학부모·일일 보고서), 보조 모드 UI 제어 |
| 학부모 | 웹앱 | 로그인, 자녀 선택, 등·하원·점심메뉴·사진·일과 보고서 조회 |

## 참조 문서

상세 문서 목록은 [docs/CLAUDE.md](docs/CLAUDE.md). Confluence 동기화는 [scripts/CLAUDE.md](scripts/CLAUDE.md).
