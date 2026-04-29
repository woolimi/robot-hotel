# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Addinedu 4기 최종 프로젝트 — **로봇 호텔**. 사람 손님이 묵는 호텔에 OpenArm(체크인 응대), Pinky(안내와 룸서비스 배달), OMX 3대(객실 비치)로 구성된 로봇 직원이 서비스를 제공한다.

- 팀: 6명
- 기간: 2026-04-28 ~ 2026-06-04 (약 5주)
- 진행 단계: 시뮬레이션 검증 → 실물 이전
- 현재 상태: 요구사항 정의 단계 (코드 미작성)

## 시스템 구성

| 영역 | 구성 |
|---|---|
| 체크인 데스크 | OpenArm 1대 + 노트북(키오스크 역할) |
| 룸서비스 | Pinky 1대 (자율주행 배달) |
| 객실 내 | OMX 3대 — 신발 정리 / 조명 스위치 조작 / 책상 정리 / 모닝콜 (4종 작업, 3대 매핑은 미정) |
| 손님 인터페이스 | 휴대폰 웹앱 — 예약 확인, 음성 객실 제어, 룸서비스 주문, 모닝콜 설정, 알림 수신 |
| 직원 인터페이스 | PyQt5 데스크톱 앱 — 예약 관리, 객실 상태 보드, 로봇 모니터링, 작업 큐, 수동 제어 |

## 참조 문서

| 문서 | 내용 |
|---|---|
| [docs/folder-structure.md](docs/folder-structure.md) | 폴더 구조 / 개발 명령어 |
| [docs/user-requirements.md](docs/user-requirements.md) | 사용자 요구사항 |
| [docs/system-requirements.md](docs/system-requirements.md) | 시스템 요구사항 |
| [docs/robots/omx-ai.md](docs/robots/omx-ai.md) | OMX-AI — 객실 매니퓰레이터 사양 |
| [docs/robots/openarm.md](docs/robots/openarm.md) | OpenArm — 체크인 듀얼 암 사양 |
| [docs/robots/vic-pinky.md](docs/robots/vic-pinky.md) | Vic Pinky — 룸서비스 모바일 베이스 사양 |
- Confluence 동기화: [scripts/_sync_docs/CLAUDE.md](scripts/_sync_docs/CLAUDE.md)
