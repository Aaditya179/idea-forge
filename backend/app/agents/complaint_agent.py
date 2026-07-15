"""
Complaint Understanding Agent.

This is the first agent in a six-agent civic intelligence pipeline. It is
responsible ONLY for turning raw citizen complaint text into a structured
`ComplaintAnalysis`. It has no knowledge of downstream agents (image
analysis, duplicate detection, priority, routing, citizen communication) —
those will later be plugged into an orchestrator without requiring changes
here.
"""

from __future__ import annotations

import logging

from pydantic import ValidationError

from app.models.complaint import ComplaintAnalysis, ComplaintInput
from app.services.gemini_service import (
    GeminiRequestError,
    GeminiResponseError,
    GeminiService,
)
from app.utils.prompt_loader import load_prompt

logger = logging.getLogger(__name__)

_PROMPT_FILENAME = "complaint_prompt.txt"


class ComplaintAnalysisError(Exception):
    """Raised when a complaint cannot be analyzed into a valid result."""


class ComplaintAgent:
    """
    Analyzes raw citizen complaints into structured, department-routable data.

    The agent depends on a `GeminiService` instance, injected by the caller
    (typically via FastAPI's dependency injection), so it never constructs
    its own AI client. This keeps the agent trivially testable and keeps
    Gemini-specific concerns entirely inside `GeminiService`.
    """

    def __init__(self, gemini_service: GeminiService) -> None:
        self._gemini_service = gemini_service

    async def analyze_complaint(self, complaint: ComplaintInput) -> ComplaintAnalysis:
        """
        Analyze a citizen's complaint and return a structured analysis.

        Args:
            complaint: The raw complaint input.

        Returns:
            A validated `ComplaintAnalysis` instance.

        Raises:
            ComplaintAnalysisError: If the prompt cannot be loaded, the
                Gemini call fails, or the returned data fails validation.
        """
        logger.info("Complaint analysis requested")

        try:
            system_prompt = load_prompt(_PROMPT_FILENAME)
        except OSError as exc:
            logger.error("Failed to load complaint prompt: %s", exc)
            raise ComplaintAnalysisError("Unable to load complaint prompt.") from exc

        logger.info("Sending complaint text to Gemini for analysis")

        try:
            raw_result = await self._gemini_service.generate_json(
                system_prompt=system_prompt,
                user_input=complaint.complaint_text,
            )
        except (GeminiRequestError, GeminiResponseError) as exc:
            logger.error("Gemini analysis failed: %s", exc)
            raise ComplaintAnalysisError(str(exc)) from exc

        try:
            analysis = ComplaintAnalysis.model_validate(raw_result)
        except ValidationError as exc:
            logger.error("Complaint analysis failed validation: %s", exc)
            raise ComplaintAnalysisError(
                "AI response did not match the expected complaint schema."
            ) from exc

        logger.info("Complaint analysis validated successfully")
        return analysis