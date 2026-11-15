"""LiteLLM-compatible chat client with structured-output recovery."""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from pydantic import BaseModel, ValidationError

logger = logging.getLogger("market_scout.llm")


class LLMError(RuntimeError):
    pass


class LLMClient:
    def __init__(
        self,
        model: str,
        api_key: str,
        base_url: str,
        fallback_model: Optional[str] = None,
        temperature: float = 0,
    ):
        self.model = model
        self.api_key = api_key
        self.base_url = base_url.rstrip("/") if base_url else ""
        self.fallback_model = fallback_model
        self.temperature = temperature

    @property
    def enabled(self) -> bool:
        return bool(self.api_key and self.model and "your-" not in (self.api_key or ""))

    def _chat(self, model: str, messages: list[dict]) -> str:
        try:
            from langchain_openai import ChatOpenAI
        except ImportError as exc:
            raise LLMError("langchain-openai is not installed") from exc

        llm = ChatOpenAI(
            model=model,
            api_key=self.api_key,
            base_url=self.base_url or None,
            temperature=self.temperature,
            timeout=60,
        )
        result = llm.invoke(messages)
        content = result.content if hasattr(result, "content") else str(result)
        if isinstance(content, list):
            content = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part) for part in content
            )
        return str(content)

    def complete(self, system: str, user: str) -> str:
        if not self.enabled:
            raise LLMError("LLM is not configured. Set LLM_API_KEY and LLM_MODEL.")
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        try:
            return self._chat(self.model, messages)
        except Exception as first:
            logger.warning("Primary LLM failed: %s", first)
            if not self.fallback_model:
                raise LLMError(f"LLM request failed: {first}") from first
            try:
                return self._chat(self.fallback_model, messages)
            except Exception as second:
                raise LLMError(f"LLM primary and fallback failed: {second}") from second

    def complete_json(self, system: str, user: str, schema: type[BaseModel]) -> BaseModel:
        text = self.complete(system + "\nReturn valid JSON only.", user)
        parsed = _extract_json(text)
        try:
            return schema.model_validate(parsed)
        except ValidationError:
            repaired = self.complete(
                "Repair the JSON so it matches the schema. Return JSON only.",
                f"Schema: {schema.model_json_schema()}\n\nBroken:\n{text}",
            )
            parsed = _extract_json(repaired)
            try:
                return schema.model_validate(parsed)
            except ValidationError as exc:
                raise LLMError(f"LLM JSON did not match schema: {exc}") from exc


def _extract_json(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start : end + 1])
        raise
