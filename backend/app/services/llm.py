from __future__ import annotations

import asyncio
import logging
from typing import Protocol

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import get_settings
from app.schemas.insights import InsightResponse

logger = logging.getLogger(__name__)


class LLMProvider(Protocol):
    async def generate_insights(self, system_prompt: str, user_prompt: str) -> InsightResponse: ...

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str: ...

    async def available(self) -> bool: ...


class NvidiaProvider:
    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.nvidia_api_key
        self.model = settings.nvidia_model
        self.temperature = settings.nvidia_temperature
        self.max_tokens = settings.nvidia_max_tokens

    def _client(self):
        from langchain_nvidia_ai_endpoints import ChatNVIDIA

        return ChatNVIDIA(
            model=self.model,
            api_key=self.api_key,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )

    async def available(self) -> bool:
        return bool(self.api_key and self.model)

    async def generate_insights(self, system_prompt: str, user_prompt: str) -> InsightResponse:
        client = self._client().with_structured_output(InsightResponse)
        result = await asyncio.to_thread(
            client.invoke,
            [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)],
        )
        if isinstance(result, InsightResponse):
            return result
        return InsightResponse.model_validate(result)

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        client = self._client()
        message = await asyncio.to_thread(
            client.invoke,
            [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)],
        )
        return str(getattr(message, "content", "") or "").strip()


class OfflineProvider:
    async def generate_insights(self, system_prompt: str, user_prompt: str) -> InsightResponse:
        raise RuntimeError("LLM unavailable")

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        raise RuntimeError("LLM unavailable")

    async def available(self) -> bool:
        return False


def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    if settings.nvidia_api_key:
        return NvidiaProvider()
    return OfflineProvider()
