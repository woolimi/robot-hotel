"""generate_chat 통합 테스트 — 실제 Ollama 서버 필요."""
import re

import pytest

from llm import generate_chat

pytestmark = pytest.mark.anyio

_HANGUL_RE = re.compile(r"[가-힣]")


@pytest.mark.parametrize("text,robot", [
    ("하이",           "gogoping"),
    ("심심해",         "eduping"),
    ("오늘 날씨 어때", "noriarm"),
    ("엄마 보고싶어",  "gogoping"),
    ("노래 불러줘",    "eduping"),
    ("몇 시야",        "noriarm"),
])
async def test_chat_returns_korean(text: str, robot: str) -> None:
    reply = await generate_chat(text, robot)
    assert _HANGUL_RE.search(reply), f"한국어 없음: {reply!r}"
    assert len(reply) <= 120, f"너무 긴 응답: {reply!r}"
