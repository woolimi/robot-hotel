# Vic Pinky

## 1. 외관/치수

| 항목 | 값 |
|---|---|
| 본체 길이 | 0.6 m |
| 본체 폭 | 0.4 m |
| 섀시 높이 | 0.14 m |
| 상부 프레임 높이 | 0.5 m (네 모서리 필러) + 0.03 m 상판 |
| 본체 질량 | 약 50 kg (URDF 기준) |
| LiDAR 장착 높이 | 섀시 기준 +0.18 m |

## 2. 하드웨어 자원

### 2.1 구동계

| 항목 | 값 | 비고 |
|---|---|---|
| 구동 방식 | 차동 구동(differential drive) | 2륜 구동 + 2개 캐스터 휠 |
| 구동 휠 반지름 | 0.0825 m (지름 0.165 m) | URDF 및 bringup 드라이버 상수 |
| 휠 간격 (track width) | 0.475 m | URDF `wheel_separation` |
| 휠 두께 | 0.05 m | |
| 캐스터 휠 | 2개 (후면, 수동) | 반지름 0.0325 m |
| 모터 컨트롤러 | ZLAC 계열 BLDC 듀얼 드라이버 | Modbus RTU |
| 통신 | RS-485 → USB (FTDI FT232, VID 0403 / PID 6001) | `/dev/motor` 심볼릭 링크 |
| 통신 속도 | 115200 bps, Modbus ID 0x01 | |
| 인코더 분해능 | 4096 pulse/rev | |

### 2.2 센서

| 센서 | 모델 | 사양 | 인터페이스 |
|---|---|---|---|
| 2D LiDAR | Slamtec RPLIDAR C1 | 360° 스캔, 측정 거리 0.05 ~ 12 m | USB 시리얼 (CP2102, VID 10c4 / PID ea60), `/dev/rplidar` 심볼릭 링크 |
| 카메라 | (URDF에 RealSense R200 정의만 존재) | 시뮬레이션 전용, 실제 bringup에는 미포함 | — |

## 3. 참조 자료

- 리포: <https://github.com/pinklab-art/vic_pinky/tree/v1.0.0>
- ROS2 패키지 구성
  - `vicpinky_bringup` — 모터 드라이버, LiDAR, robot_state_publisher 통합 launch
  - `vicpinky_description` — URDF/xacro, 메시
  - `vicpinky_navigation` — slam_toolbox, nav2 launch 및 설정
  - `vicpinky_gazebo` — 시뮬레이션 환경
