"""
Routing Agent.

Receives the shared `ComplaintContext`, uses the Complaint Agent's
deterministic department assignment, looks up matching officers through
`SupabaseService`, and enriches the same context with a `RoutingResult`.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any

from app.models.context import ComplaintContext
from app.models.routing import RoutingResult, officer_from_row
from app.services.gemini_service import (
    GeminiRequestError,
    GeminiResponseError,
    GeminiService,
)
from app.services.supabase_service import SupabaseService, SupabaseServiceError
from app.utils.prompt_loader import load_prompt

logger = logging.getLogger(__name__)

_PROMPT_FILENAME = "routing_prompt.txt"


class RoutingError(Exception):
    """Raised when routing cannot be completed."""


class RoutingAgent:
    """
    Assigns a complaint to a department/officer using deterministic rules.

    The department is never chosen by Gemini. It comes from
    `ComplaintContext.analysis.department`; Gemini is only asked to phrase a
    human-readable routing reason. If priority data is later added to the
    context, this agent will use optional fields from it without requiring a
    constructor or public API change.
    """

    def __init__(
        self, supabase_service: SupabaseService, gemini_service: GeminiService
    ) -> None:
        self._supabase_service = supabase_service
        self._gemini_service = gemini_service

    async def run(self, context: ComplaintContext) -> ComplaintContext:
        """Enrich `context.routing` and return the same context."""
        logger.info("Routing complaint received")

        if context.analysis is None:
            logger.error("RoutingAgent invoked without a prior complaint analysis")
            raise RoutingError(
                "ComplaintContext.analysis must be set before running the "
                "Routing Agent."
            )

        logger.info("ComplaintContext loaded for routing")
        department = context.analysis.department
        ward = self._extract_ward(context)

        officer_rows = await self._lookup_officers(department=department, ward=ward)
        selected_officer_row = self._select_officer(officer_rows, ward)
        selected_officer = (
            officer_from_row(selected_officer_row) if selected_officer_row else None
        )
        if ward is None and selected_officer is not None:
            ward = selected_officer.ward

        reason = await self._build_reason(
            context=context,
            department=department,
            ward=ward,
            assigned_officer=selected_officer_row,
        )

        routing_result = RoutingResult(
            department=department,
            assigned_officer=selected_officer,
            ward=ward,
            confidence=self._confidence(context, selected_officer_row),
            routing_reason=reason,
            estimated_resolution_time=self._estimated_resolution_time(context),
            routing_timestamp=datetime.now(UTC),
        )

        context.routing = routing_result
        logger.info(
            "Routing decision complete: department=%s officer_found=%s",
            department,
            selected_officer is not None,
        )
        return context

    async def _lookup_officers(
        self, department: str, ward: str | None
    ) -> list[dict[str, Any]]:
        """Fetch officer candidates through SupabaseService only."""
        logger.info("Officer lookup started for department=%s ward=%s", department, ward)
        try:
            department_officers = (
                await self._supabase_service.find_officers_by_department(department)
            )
            if ward is None:
                return department_officers

            ward_officers = await self._supabase_service.find_officers_by_ward(ward)
        except SupabaseServiceError as exc:
            logger.error("Officer lookup failed: %s", exc)
            raise RoutingError(str(exc)) from exc

        department_ids = {
            str(row.get("id")) for row in department_officers if row.get("id") is not None
        }
        ward_matches = [
            row
            for row in ward_officers
            if row.get("id") is not None and str(row.get("id")) in department_ids
        ]
        return ward_matches or department_officers

    @staticmethod
    def _select_officer(
        officer_rows: list[dict[str, Any]], ward: str | None
    ) -> dict[str, Any] | None:
        """Choose the best officer row from the lookup result."""
        if not officer_rows:
            logger.info("No officer rows found for routing")
            return None

        if ward is not None:
            for row in officer_rows:
                if str(row.get("ward", "")).lower() == ward.lower():
                    return row

        return officer_rows[0]

    async def _build_reason(
        self,
        context: ComplaintContext,
        department: str,
        ward: str | None,
        assigned_officer: dict[str, Any] | None,
    ) -> str:
        """Ask Gemini to phrase the reason, with a deterministic fallback."""
        assert context.analysis is not None

        fallback = self._fallback_reason(context, department, ward, assigned_officer)

        try:
            system_prompt = load_prompt(_PROMPT_FILENAME)
        except OSError as exc:
            logger.error("Failed to load routing prompt: %s", exc)
            return fallback

        gemini_input = {
            "category": context.analysis.category,
            "issue_type": context.analysis.issue_type,
            "department": department,
            "keywords": context.analysis.keywords,
            "summary": context.analysis.summary,
            "duplicate": context.duplicate.model_dump()
            if context.duplicate is not None
            else None,
            "priority": context.priority,
            "ward": ward,
            "assigned_officer": assigned_officer,
        }

        try:
            raw_result = await self._gemini_service.generate_json(
                system_prompt=system_prompt,
                user_input=json.dumps(gemini_input, default=str),
            )
        except (GeminiRequestError, GeminiResponseError) as exc:
            logger.error("Gemini routing explanation failed: %s", exc)
            return fallback

        reason = raw_result.get("routing_reason")
        if not isinstance(reason, str) or not reason.strip():
            logger.error("Gemini routing response omitted routing_reason")
            return fallback

        return reason.strip()

    @staticmethod
    def _fallback_reason(
        context: ComplaintContext,
        department: str,
        ward: str | None,
        assigned_officer: dict[str, Any] | None,
    ) -> str:
        assert context.analysis is not None

        keyword_text = ", ".join(context.analysis.keywords[:3]) or "no keywords"
        reason = (
            f"Assigned to {department} because the complaint category is "
            f"{context.analysis.category} and keywords include {keyword_text}."
        )
        if ward is not None:
            reason += f" Ward {ward} was used for officer matching."
        if assigned_officer is None:
            reason += " No matching officer was found in Supabase."
        return reason

    @staticmethod
    def _extract_ward(context: ComplaintContext) -> str | None:
        """Read a ward from optional future priority data if present."""
        if isinstance(context.priority, dict):
            ward = context.priority.get("ward") or context.priority.get("assigned_ward")
            if ward is not None:
                return str(ward)
        return None

    @staticmethod
    def _confidence(
        context: ComplaintContext, assigned_officer: dict[str, Any] | None
    ) -> float:
        """Generate an explainable confidence score."""
        assert context.analysis is not None

        confidence = min(0.97, max(0.55, context.analysis.confidence))
        if assigned_officer is None:
            confidence -= 0.18
        if context.duplicate is not None and context.duplicate.duplicate_found:
            confidence -= 0.05
        if isinstance(context.priority, dict) and context.priority:
            confidence += 0.03
        return round(min(0.99, max(0.35, confidence)), 2)

    @staticmethod
    def _estimated_resolution_time(context: ComplaintContext) -> str:
        """Estimate resolution time from category and optional priority data."""
        assert context.analysis is not None

        if isinstance(context.priority, dict):
            priority_level = str(
                context.priority.get("level") or context.priority.get("priority") or ""
            ).lower()
            if priority_level in {"critical", "high", "urgent"}:
                return "24-48 hours"

        category = context.analysis.category.lower()
        if category in {"electricity", "water leakage", "drainage"}:
            return "24-48 hours"
        if category in {"road damage", "street light", "garbage"}:
            return "2-4 days"
        return "3-5 days"
