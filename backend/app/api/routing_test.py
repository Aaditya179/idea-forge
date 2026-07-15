"""
Standalone test router for the Routing Agent.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.agents.routing_agent import RoutingAgent, RoutingError
from app.models.context import ComplaintContext
from app.services.gemini_service import GeminiService, get_gemini_service
from app.services.supabase_service import SupabaseService, get_supabase_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test", tags=["routing-test"])


def get_routing_agent(
    gemini_service: GeminiService = Depends(get_gemini_service),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> RoutingAgent:
    """Dependency provider for `RoutingAgent`."""
    return RoutingAgent(
        supabase_service=supabase_service, gemini_service=gemini_service
    )


@router.post("/routing", response_model=ComplaintContext)
async def test_routing(
    context: ComplaintContext,
    agent: RoutingAgent = Depends(get_routing_agent),
) -> ComplaintContext:
    """Run the Routing Agent against a `ComplaintContext`."""
    logger.info("Request received: POST /test/routing")

    try:
        return await agent.run(context)
    except RoutingError as exc:
        logger.error("Routing failed: %s", exc)
        raise HTTPException(status_code=500, detail="Routing failed") from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error during routing")
        raise HTTPException(status_code=500, detail="Routing failed") from exc
