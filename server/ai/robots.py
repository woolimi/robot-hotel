"""로봇별 사용 가능한 모드 — 공유 모델 패키지가 생기면 그쪽으로 이동."""

ROBOT_MODES: dict[str, list[str]] = {
    "eduping": ["대기", "율동", "가게놀이", "정리정돈", "무궁화꽃이 피었습니다"],
    "gogoping": ["대기", "등원", "하원", "보조", "숨바꼭질", "자장가"],
    "noriarm": ["대기", "블럭쌓기", "정리"],
}

STOP_TOKENS = ["정지", "멈춰", "그만", "스톱"]


def is_known_robot(robot: str) -> bool:
    return robot in ROBOT_MODES


def modes_for(robot: str) -> list[str]:
    return ROBOT_MODES.get(robot, [])
