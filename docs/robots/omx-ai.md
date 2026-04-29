# OMX-AI (OpenMANIPULATOR-X AI)

- 제조: ROBOTIS
- 구성: OMX-L (Leader) + OMX-F (Follower) 텔레오퍼레이션 세트
- 용도: 모방학습/원격조작용 5-DOF 매니퓰레이터

## 1. 외관/치수

### 1.1 OMX-F (Follower, 작업 수행 팔)

| 항목 | 값 |
|---|---|
| 자유도 | 5 + 1 (그리퍼) |
| 최대 도달거리 (full reach) | 0.400 m |
| 본체 질량 | 0.560 kg |
| 페이로드 | 100 g (full reach) / 250 g (normal reach) |
| 베이스 → joint1 z-offset | 0.034 m |
| joint1 → joint2 z-offset | 0.0635 m |
| joint2 → joint3 (xz) | x 0.0415 m, z 0.11315 m |
| joint3 → joint4 (x) | 0.162 m |
| joint4 → joint5 (x) | 0.0287 m |
| joint5 → gripper (x) | 0.0295 m |

### 1.2 OMX-L (Leader, 사람이 잡는 마스터 팔)

| 항목 | 값 |
|---|---|
| 자유도 | 5 + 1 (그리퍼) |
| 최대 도달거리 (full reach) | 0.335 m |
| 본체 질량 | 0.360 kg |

## 2. 하드웨어 자원

### 2.1 관절 사양 (OMX-L / OMX-F 공통)

| 관절 | 가동 범위 |
|---|---|
| Joint 1 | −270° ~ +360° |
| Joint 2 | −120° ~ +90° |
| Joint 3 | −120° ~ +90° |
| Joint 4 | −100° ~ +100° |
| Joint 5 | ±270° |
| Gripper | 0° ~ +100° |

- 관절 분해능: −π ~ +π rad, ±2048 pulse/rev (12-bit)
- ros2_control URDF의 velocity 한계: 4.8 rad/s, effort 한계: 1000 (단위는 컨트롤러 의존)

### 2.2 모터 구성

| 부위 | OMX-F (Follower) | OMX-L (Leader) |
|---|---|---|
| Joint 1 ~ 3 | DYNAMIXEL XL430-W250-T | DYNAMIXEL XL330-M288-T |
| Joint 4 ~ 5 | DYNAMIXEL XL330-M288-T | DYNAMIXEL XL330-M288-T |
| Gripper | DYNAMIXEL XL330-M288-T | DYNAMIXEL XL330-M077-T |
| 모터 ID 매핑 (ros2_control 기준) | 11 ~ 16 | — |

### 2.3 전원/통신

| 항목 | OMX-F | OMX-L |
|---|---|---|
| 동작 전압 | 12 VDC | 5 VDC |
| 호스트 인터페이스 | USB-C | USB-C |
| 내부 통신 | TTL 1 Mbps (DYNAMIXEL bus) | TTL 1 Mbps |
| 호스트 측 디바이스 | `/dev/ttyACM*` (FTDI ftdi_sio) | `/dev/ttyACM*` |

### 2.4 컴퓨팅 / 운용 환경

- ROS 2 지원 (Jazzy / Humble 브랜치 별도 제공)
- ros2_control + `dynamixel_hardware_interface` 플러그인 사용
- 별도 호스트 PC 필요 (USB-C로 연결)
- ROBOTIS Physical AI Tools, LeRobot 프레임워크와 호환

## 3. 참조 자료

- ROS 2 공식 패키지: <https://github.com/ROBOTIS-GIT/open_manipulator>
  - 패키지 구성: `open_manipulator_bringup`, `open_manipulator_description`, `open_manipulator_moveit_config`, `open_manipulator_teleop`, `open_manipulator_playground` 등
  - 본 프로젝트 관련 launch: `omx_ai.launch.py` (Leader-Follower 통합), `omx_f.launch.py`, `omx_l_leader_ai.launch.py`
- 공식 하드웨어 매뉴얼: <https://ai.robotis.com/omx/hardware_omx.html>
- OMX 소개: <https://ai.robotis.com/omx/introduction_omx.html>
- 셋업 가이드: <https://ai.robotis.com/omx/setup_guide_omx.html>
- AI Manipulator e-Manual: <https://emanual.robotis.com/docs/en/platform/ai_manipulator_main>
- DYNAMIXEL XL330-M288-T 데이터시트: <https://emanual.robotis.com/docs/en/dxl/x/xl330-m288/>
- DYNAMIXEL XL430-W250-T 데이터시트: <https://emanual.robotis.com/docs/en/dxl/x/xl430-w250/>
- Physical AI Tools: <https://github.com/ROBOTIS-GIT/physical_ai_tools>
