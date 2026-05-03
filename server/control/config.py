"""Control Service settings — env override 가능."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_hub_url: str = "http://localhost:8001"
    request_timeout_s: float = 30.0
    control_port: int = 8000

    class Config:
        env_prefix = ""


settings = Settings()
