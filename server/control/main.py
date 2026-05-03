"""Control Service — REST gateway.

브라우저 ↔ Control ↔ AI Hub / DB / ROS2 의 중간 계층.
지금은 의도 분류 + 모드 클릭만 처리. Control 자체의 ROS2 publish · DB · 인증·세션은 다음 단계.
"""
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from config import settings

app = FastAPI(title="Pingdergarten Control", version="0.1.0")


class VoiceIntentRequest(BaseModel):
    text: str = Field(..., min_length=1)
    robot: Literal["eduping", "gogoping", "noriarm"]


class ModeRequest(BaseModel):
    robot: Literal["eduping", "gogoping", "noriarm"]
    mode: str


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.post("/api/voice/intent")
async def voice_intent(req: VoiceIntentRequest) -> dict:
    """브라우저 발화 → AI Hub 의도 분류 → 결과 반환.
    추후: 결과에 따라 ROS2 latched topic publish + DB 모드 이력 기록.
    """
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_s) as client:
            response = await client.post(
                f"{settings.ai_hub_url}/voice/intent",
                json=req.model_dump(),
            )
            response.raise_for_status()
            result: dict = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"AI Hub unavailable: {exc}") from exc

    # TODO(next): mode_change 면 ROS2 `/<robot>/mode` latched topic publish + DB mode_history INSERT
    # TODO(next): sub_command stop 이면 진행 중인 ROS2 액션 cancel
    return result


@app.post("/api/mode")
async def mode_click(req: ModeRequest) -> dict:
    """모드 셀렉터 UI 클릭 — 의도 분류 우회. 추후 ROS2 publish + DB 기록."""
    # TODO(next): ROS2 /<robot>/mode latched topic publish + DB mode_history INSERT
    return {"ok": True, "robot": req.robot, "mode": req.mode}
