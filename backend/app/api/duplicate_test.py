"""
Standalone test router for the Duplicate Detection Agent.

Lets the Duplicate Agent be exercised end-to-end via HTTP, independent of
any other agent in the pipeline. The caller supplies a `ComplaintContext`
that already has `analysis` populated (e.g. copied from a prior Complaint
Agent run); this endpoint runs only the Duplicate Agent against it.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.agents.duplicate_agent import DuplicateAgent, DuplicateDetectionError
from app.models.context import ComplaintContext
from app.models.duplicate import DuplicateResult
from app.services.gemini_service import GeminiService, get_gemini_service
from app.services.supabase_service import SupabaseService, get_supabase_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test", tags=["duplicate-test"])


def get_duplicate_agent(
    gemini_service: GeminiService = Depends(get_gemini_service),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> DuplicateAgent:
    """Dependency provider for `DuplicateAgent`."""
    return DuplicateAgent(
        supabase_service=supabase_service, gemini_service=gemini_service
    )


@router.post("/duplicate")
async def test_duplicate_detection(
    context: ComplaintContext,
    agent: DuplicateAgent = Depends(get_duplicate_agent),
) -> dict[str, object]:
    """
    Run the Duplicate Agent against a `ComplaintContext` and return its result.
    """
    logger.info("Request received: POST /test/duplicate")

    try:
        enriched_context = await agent.run(context)
    except DuplicateDetectionError as exc:
        logger.error("Duplicate detection failed: %s", exc)
        raise HTTPException(status_code=500, detail="Invalid AI response") from exc
    except Exception as exc:  # noqa: BLE001 - final safety net, never crash the server
        logger.exception("Unexpected error during duplicate detection")
        raise HTTPException(status_code=500, detail="Invalid AI response") from exc

    duplicate_result: DuplicateResult | None = enriched_context.duplicate
    if duplicate_result is None:
        # Should be unreachable: `run` always sets `context.duplicate`.
        logger.error("DuplicateAgent.run completed without setting context.duplicate")
        raise HTTPException(status_code=500, detail="Invalid AI response")

    return {
        "success": True,
        "message": "Duplicate detection completed",
        "data": duplicate_result,
    }