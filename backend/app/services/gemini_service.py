"""
Generic Gemini API service.

This module provides a single, reusable async wrapper around the Gemini API.
It has NO knowledge of any specific agent's domain (complaints, images,
priorities, etc.) — every future agent in the pipeline is expected to reuse
this exact service via dependency injection, passing in its own system
prompt and user input.

Design notes
------------
* Implemented as a lazily-initialized singleton so the underlying Gemini
  client (and its connection/session setup) is created once per process,
  regardless of how many agents request it.
* The only public contract is `generate_json`, which always returns a
  validated `dict`. Callers never receive raw text — if the model does not
  return valid JSON, a `GeminiResponseError` is raised instead.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Optional

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Base exception for all Gemini service failures."""


class GeminiRequestError(GeminiServiceError):
    """Raised when the call to the Gemini API itself fails."""


class GeminiResponseError(GeminiServiceError):
    """Raised when the Gemini API returns a response that is not valid JSON."""


class GeminiService:
    """
    Singleton async wrapper around the Gemini API.

    This service is intentionally domain-agnostic. It knows nothing about
    complaints, images, or any other agent-specific concept — it only knows
    how to send a (system_prompt, user_input) pair to Gemini and return
    validated JSON back to the caller.
    """

    _instance: Optional["GeminiService"] = None

    def __new__(cls, *args: Any, **kwargs: Any) -> "GeminiService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_name: str = "gemini-2.0-flash") -> None:
        # Guard against re-initializing the singleton on subsequent
        # instantiations (e.g. GeminiService() called from multiple agents).
        if self._initialized:
            return

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise GeminiServiceError(
                "GEMINI_API_KEY is not set in the environment (.env)."
            )

        self._model_name = model_name
        self._client = genai.Client(api_key=api_key)
        self._initialized = True

        logger.info("GeminiService initialized with model=%s", self._model_name)

    async def generate_json(self, system_prompt: str, user_input: str) -> dict[str, Any]:
        """
        Send a system prompt + user input to Gemini and return parsed JSON.

        Args:
            system_prompt: The instructions/persona the model should follow.
                Agent-specific logic (prompt content) lives entirely outside
                this service — it is supplied by the caller.
            user_input: The raw input to be analyzed (e.g. complaint text).

        Returns:
            A dictionary parsed from the model's JSON response.

        Raises:
            GeminiRequestError: If the underlying API call fails.
            GeminiResponseError: If the model's response is not valid JSON.
        """
        logger.info("Gemini request started (model=%s)", self._model_name)

        try:
            response = await self._client.aio.models.generate_content(
                model=self._model_name,
                contents=user_input,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                ),
            )
        except Exception as exc:  # noqa: BLE001 - wrap any SDK/network failure
            logger.error("Gemini request failed: %s", exc)
            raise GeminiRequestError(f"Gemini API call failed: {exc}") from exc

        raw_text = getattr(response, "text", None)
        if not raw_text:
            logger.error("Gemini response contained no text content")
            raise GeminiResponseError("Gemini returned an empty response.")

        logger.info("Gemini response received")

        try:
            parsed: dict[str, Any] = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse Gemini response as JSON: %s", exc)
            raise GeminiResponseError(
                "Gemini response was not valid JSON."
            ) from exc

        if not isinstance(parsed, dict):
            logger.error("Gemini JSON response was not an object: %r", parsed)
            raise GeminiResponseError("Gemini JSON response must be an object.")

        logger.info("Gemini response validated as JSON successfully")
        return parsed


def get_gemini_service() -> GeminiService:
    """
    FastAPI-friendly dependency provider.

    Returns the singleton GeminiService instance, creating it on first call.
    Future agents should depend on this function (via Depends) rather than
    instantiating GeminiService directly, to keep construction in one place.
    """
    return GeminiService()