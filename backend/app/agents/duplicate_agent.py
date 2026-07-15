"""
Duplicate Detection Agent.

Second agent in the six-agent civic intelligence pipeline. It receives the
shared `ComplaintContext` (already enriched by the Complaint Agent with an
`analysis`), retrieves a small set of plausibly-similar existing complaints,
pre-filters them with lightweight fuzzy/structured matching, and asks
Gemini to make the final merge/no-merge call on just that shortlist.

This agent never receives raw complaint text directly (it reads
`context.analysis`), never writes Supabase queries itself (it goes through
`SupabaseService`), and never sends more than a handful of shortlisted
candidates to Gemini. It only ever enriches and returns the same
`ComplaintContext` it was given.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any

from rapidfuzz import fuzz

from app.models.context import ComplaintContext
from app.models.duplicate import DuplicateResult, MatchedComplaint
from app.services.gemini_service import (
    GeminiRequestError,
    GeminiResponseError,
    GeminiService,
)
from app.services.supabase_service import SupabaseService, SupabaseServiceError
from app.utils.prompt_loader import load_prompt

logger = logging.getLogger(__name__)

_PROMPT_FILENAME = "duplicate_prompt.txt"

# How many candidates, at most, are ever sent to Gemini.
_MAX_CANDIDATES_FOR_GEMINI = 5

# A candidate must clear this composite pre-filter score (0-100) to be
# considered for the Gemini step at all.
_PREFILTER_SCORE_THRESHOLD = 50.0

# How far back and how nearby to look when gathering raw candidates,
# before pre-filtering narrows them down.
_RECENT_DAYS_WINDOW = 7
_NEARBY_RADIUS_KM = 2.0


class DuplicateDetectionError(Exception):
    """Raised when duplicate detection cannot be completed."""


@dataclass
class _ScoredCandidate:
    """A candidate complaint row paired with its pre-filter similarity score."""

    row: dict[str, Any]
    score: float


class DuplicateAgent:
    """
    Detects whether a complaint duplicates an existing one, using a
    pre-filter (RapidFuzz + structured matching) followed by a Gemini
    merge/no-merge decision over the shortlisted candidates only.
    """

    def __init__(
        self, supabase_service: SupabaseService, gemini_service: GeminiService
    ) -> None:
        self._supabase_service = supabase_service
        self._gemini_service = gemini_service

    async def run(self, context: ComplaintContext) -> ComplaintContext:
        """
        Enrich `context` with a `DuplicateResult` and return the same context.

        Args:
            context: Shared pipeline context. Must already have
                `context.analysis` populated by the Complaint Agent.

        Returns:
            The same `ComplaintContext` instance, with `context.duplicate` set.

        Raises:
            DuplicateDetectionError: If `context.analysis` is missing, the
                candidate lookup fails, or the Gemini decision step fails.
        """
        if context.analysis is None:
            logger.error("DuplicateAgent invoked without a prior complaint analysis")
            raise DuplicateDetectionError(
                "ComplaintContext.analysis must be set before running the "
                "Duplicate Agent."
            )

        logger.info("Duplicate detection started for department=%s", context.analysis.department)

        candidate_rows = await self._gather_candidates(context)
        shortlisted = self._prefilter_candidates(context, candidate_rows)

        if not shortlisted:
            logger.info("No candidates cleared the pre-filter threshold")
            context.duplicate = DuplicateResult(
                duplicate_found=False,
                duplicate_ids=[],
                matched_complaints=[],
                confidence=1.0,
                merge=False,
                reason="No similar existing complaints were found nearby or "
                "in the same department recently.",
            )
            return context

        logger.info("Sending %d shortlisted candidate(s) to Gemini", len(shortlisted))
        duplicate_result = await self._decide_with_gemini(context, shortlisted)

        context.duplicate = duplicate_result
        logger.info(
            "Duplicate detection complete: duplicate_found=%s merge=%s",
            duplicate_result.duplicate_found,
            duplicate_result.merge,
        )
        return context

    async def _gather_candidates(self, context: ComplaintContext) -> list[dict[str, Any]]:
        """Retrieve raw candidate complaints via SupabaseService's reusable queries."""
        assert context.analysis is not None  # guaranteed by caller

        try:
            recent = await self._supabase_service.find_recent_complaints(
                department=context.analysis.department, days=_RECENT_DAYS_WINDOW
            )
        except SupabaseServiceError as exc:
            logger.error("Failed to fetch recent complaints: %s", exc)
            raise DuplicateDetectionError(str(exc)) from exc

        nearby: list[dict[str, Any]] = []
        if context.latitude is not None and context.longitude is not None:
            try:
                nearby = await self._supabase_service.find_nearby_complaints(
                    latitude=context.latitude,
                    longitude=context.longitude,
                    radius_km=_NEARBY_RADIUS_KM,
                )
            except SupabaseServiceError as exc:
                logger.error("Failed to fetch nearby complaints: %s", exc)
                raise DuplicateDetectionError(str(exc)) from exc

        return self._deduplicate_rows(recent + nearby)

    @staticmethod
    def _deduplicate_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Remove duplicate rows (by id) from a combined candidate list."""
        seen_ids: set[str] = set()
        unique_rows: list[dict[str, Any]] = []
        for row in rows:
            row_id = row.get("id")
            if row_id is None or row_id in seen_ids:
                continue
            seen_ids.add(row_id)
            unique_rows.append(row)
        return unique_rows

    def _prefilter_candidates(
        self, context: ComplaintContext, rows: list[dict[str, Any]]
    ) -> list[_ScoredCandidate]:
        """
        Score raw candidates with lightweight matching and return the best few.

        Composite score (0-100) combines:
        - RapidFuzz similarity between summaries
        - Category match
        - Issue type match
        - Keyword overlap ratio
        """
        assert context.analysis is not None  # guaranteed by caller

        analysis = context.analysis
        analysis_keywords = {kw.lower() for kw in analysis.keywords}

        scored: list[_ScoredCandidate] = []
        for row in rows:
            score = self._score_candidate(analysis, analysis_keywords, row)
            if score >= _PREFILTER_SCORE_THRESHOLD:
                scored.append(_ScoredCandidate(row=row, score=score))

        scored.sort(key=lambda candidate: candidate.score, reverse=True)
        return scored[:_MAX_CANDIDATES_FOR_GEMINI]

    @staticmethod
    def _score_candidate(
        analysis: Any, analysis_keywords: set[str], row: dict[str, Any]
    ) -> float:
        """Compute a 0-100 composite similarity score for one candidate row."""
        summary_similarity = fuzz.token_sort_ratio(
            analysis.summary, row.get("summary") or ""
        )

        category_match = 100.0 if row.get("category") == analysis.category else 0.0
        issue_type_match = (
            100.0 if row.get("issue_type") == analysis.issue_type else 0.0
        )

        row_keywords = {kw.lower() for kw in (row.get("keywords") or [])}
        if analysis_keywords or row_keywords:
            overlap = len(analysis_keywords & row_keywords)
            union = len(analysis_keywords | row_keywords) or 1
            keyword_overlap = (overlap / union) * 100.0
        else:
            keyword_overlap = 0.0

        # Weighted composite: summary text similarity carries the most
        # signal, category/issue_type are strong structured signals, and
        # keyword overlap is a supporting signal.
        return (
            (summary_similarity * 0.4)
            + (category_match * 0.25)
            + (issue_type_match * 0.2)
            + (keyword_overlap * 0.15)
        )

    async def _decide_with_gemini(
        self, context: ComplaintContext, shortlisted: list[_ScoredCandidate]
    ) -> DuplicateResult:
        """Ask Gemini for the final merge/no-merge decision on the shortlist."""
        assert context.analysis is not None  # guaranteed by caller

        try:
            system_prompt = load_prompt(_PROMPT_FILENAME)
        except OSError as exc:
            logger.error("Failed to load duplicate prompt: %s", exc)
            raise DuplicateDetectionError("Unable to load duplicate prompt.") from exc

        gemini_input = {
            "current_complaint": {
                "category": context.analysis.category,
                "issue_type": context.analysis.issue_type,
                "summary": context.analysis.summary,
                "keywords": context.analysis.keywords,
            },
            "candidates": [
                {
                    "id": candidate.row.get("id"),
                    "category": candidate.row.get("category"),
                    "issue_type": candidate.row.get("issue_type"),
                    "summary": candidate.row.get("summary"),
                    "keywords": candidate.row.get("keywords") or [],
                }
                for candidate in shortlisted
            ],
        }

        try:
            raw_result = await self._gemini_service.generate_json(
                system_prompt=system_prompt,
                user_input=json.dumps(gemini_input),
            )
        except (GeminiRequestError, GeminiResponseError) as exc:
            logger.error("Gemini duplicate decision failed: %s", exc)
            raise DuplicateDetectionError(str(exc)) from exc

        try:
            duplicate_found = bool(raw_result["duplicate_found"])
            merge = bool(raw_result["merge"])
            confidence = float(raw_result["confidence"])
            reason = str(raw_result["reason"])
        except (KeyError, TypeError, ValueError) as exc:
            logger.error("Gemini duplicate response failed validation: %s", exc)
            raise DuplicateDetectionError(
                "Gemini response did not match the expected duplicate schema."
            ) from exc

        matched_complaints = [
            MatchedComplaint(
                id=candidate.row.get("id"),
                category=candidate.row.get("category"),
                issue_type=candidate.row.get("issue_type"),
                summary=candidate.row.get("summary"),
                similarity_score=round(candidate.score, 2),
            )
            for candidate in shortlisted
        ]

        return DuplicateResult(
            duplicate_found=duplicate_found,
            duplicate_ids=[candidate.row.get("id") for candidate in shortlisted]
            if duplicate_found
            else [],
            matched_complaints=matched_complaints if duplicate_found else [],
            confidence=confidence,
            merge=merge,
            reason=reason,
        )