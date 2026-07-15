"""
Standalone test router for the Complaint Understanding Agent.

This router exists so the Complaint Agent can be exercised end-to-end via
HTTP without depending on any other agent in the pipeline. Future agents
will get their own equivalent routers, and eventually an orchestrator that
composes them — none of that affects this file.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.agents.complaint_agent import ComplaintAgent, ComplaintAnalysisError
from app.models.complaint import ComplaintInput, ComplaintResponse
from app.services.gemini_service import GeminiService, get_gemini_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test", tags=["complaint-test"])


def get_complaint_agent(
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> ComplaintAgent:
    """
    Dependency provider for `ComplaintAgent`.

    Keeps construction (and its dependency on `GeminiService`) out of the
    route handler itself, so the agent is never instantiated inline in the
    endpoint.
    """
    return ComplaintAgent(gemini_service=gemini_service)


@router.post("/complaint", response_model=ComplaintResponse)
async def analyze_complaint(
    complaint: ComplaintInput,
    agent: ComplaintAgent = Depends(get_complaint_agent),
) -> ComplaintResponse:
    """
    Analyze a citizen complaint and return its structured classification.
    """
    logger.info("Request received: POST /test/complaint")

    try:
        analysis = await agent.analyze_complaint(complaint)
    except ComplaintAnalysisError as exc:
        logger.error("Complaint analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail="Invalid AI response") from exc
    except Exception as exc:  # noqa: BLE001 - final safety net, never crash the server
        logger.exception("Unexpected error during complaint analysis")
        raise HTTPException(status_code=500, detail="Invalid AI response") from exc

    return ComplaintResponse(
        success=True,
        message="Complaint analyzed successfully",
        data=analysis,
    )