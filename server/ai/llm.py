"""Ollama HTTP 클라이언트 — 의도 분류 + 잡담 응답 호출."""
import json
import re
from typing import Any

_KIND_RE = re.compile(r'"kind"\s*:\s*"(\w+)"')
_HANGUL_RE = re.compile(r"[가-힣]")

import httpx

from config import settings
from robots import modes_for

CLASSIFY_SYSTEM = """\
당신은 유치원 보조 로봇의 음성 명령 의도 분류기입니다.
발화를 다음 세 가지 의도 중 하나로 분류하고, JSON 한 줄로만 답하세요.

로봇: {robot}
사용 가능한 모드: {modes_csv}

분류 규칙:
1. 위 모드 중 하나로 전환하려는 의도: {{"kind": "mode_change", "mode": "<정확한 모드 이름>"}}
2. 정지·멈춰·그만·스톱 같이 진행 중인 동작을 멈추려는 의도: {{"kind": "sub_command", "action": "stop"}}
3. 그 외: {{"kind": "ignored"}}

설명·이유·추가 필드 출력 금지. 위 세 형식 중 하나를 JSON 한 줄로만 출력."""

CHAT_SYSTEM = """\
당신은 유치원의 친근한 보조 로봇 {robot_name}입니다.
반드시 한국어로 답합니다.
한국어 1~2문장, 60자 이내. 부드러운 존댓말.
이모지·따옴표·괄호 금지. 평문 한 줄로만 출력."""

CHAT_FEW_SHOT: list[tuple[str, str]] = [
    ("오늘 점심 뭐야", "점심 메뉴는 선생님께 같이 여쭤볼까요?"),
    ("심심해", "그럼 같이 놀아볼까요? 어떤 놀이가 재밌을 것 같아요?"),
    ("안녕", "안녕하세요! 오늘도 만나서 반가워요."),
    ("하이", "안녕하세요! 반가워요."),
    ("너 누구야", "저는 유치원 친구예요! 잘 부탁드려요."),
    ("몇 시야", "시간은 선생님께 여쭤볼까요?"),
]

ROBOT_DISPLAY_NAMES: dict[str, str] = {
    "eduping": "에듀핑",
    "gogoping": "고고핑",
    "noriarm": "노리암",
}


class LLMError(Exception):
    pass


async def classify_intent(text: str, robot: str) -> dict[str, Any]:
    """Ollama 호출 → 의도 분류 결과 dict 반환.

    실패 시 LLMError raise. 호출자가 fallback 결정.
    """
    modes = modes_for(robot)
    system = CLASSIFY_SYSTEM.format(robot=robot, modes_csv=", ".join(modes))
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": text},
    ]

    raw = await _ollama_chat(
        messages=messages,
        json_format=True,
        num_predict=60,
        temperature=0.1,
    )

    try:
        parsed: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError:
        # 모델이 reason 같은 추가 필드를 달아 JSON 이 잘린 경우 kind 만 추출
        m = _KIND_RE.search(raw)
        if not m:
            raise LLMError(f"JSON 파싱 실패: {raw[:200]}")
        kind = m.group(1)
        if kind not in {"mode_change", "sub_command", "ignored"}:
            raise LLMError(f"알 수 없는 kind: {kind}")
        parsed = {"kind": kind}

    return parsed


async def generate_chat(text: str, robot: str) -> str:
    """모드 전환·정지 어디에도 해당 안 되는 발화에 대한 자연어 대화 응답.

    실패 시 LLMError raise. 호출자가 fallback 결정.
    """
    robot_name = ROBOT_DISPLAY_NAMES.get(robot, robot)
    system = CHAT_SYSTEM.format(robot_name=robot_name)

    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    for user_msg, assistant_msg in CHAT_FEW_SHOT:
        messages.append({"role": "user", "content": user_msg})
        messages.append({"role": "assistant", "content": assistant_msg})
    messages.append({"role": "user", "content": text})

    raw = await _ollama_chat(
        messages=messages,
        json_format=False,
        num_predict=120,
        temperature=0.6,
        model=settings.ollama_chat_model,
    )

    reply = raw.strip()
    if not reply or not _HANGUL_RE.search(reply):
        raise LLMError("한국어 응답 없음")
    return reply


async def _ollama_chat(
    *,
    messages: list[dict[str, str]],
    json_format: bool,
    num_predict: int,
    temperature: float,
    model: str | None = None,
) -> str:
    payload: dict[str, Any] = {
        "model": model or settings.ollama_model,
        "messages": messages,
        "stream": False,
        "think": False,
        "options": {
            "temperature": temperature,
            "num_predict": num_predict,
        },
    }
    if json_format:
        payload["format"] = "json"

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_s) as client:
            response = await client.post(
                f"{settings.ollama_host}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPError as exc:
        raise LLMError(f"Ollama 통신 실패: {exc}") from exc

    raw = (result.get("message", {}).get("content") or "").strip()
    if not raw:
        raise LLMError("Ollama 빈 응답")
    return raw
