"""
Application entrypoint.

Registers the Complaint Agent's test router, the database-backed complaints
router, and the Duplicate Agent's test router. Future agents (Priority,
Routing, Communication) and dashboards will add their own routers here, or
be composed through an orchestrator, without requiring changes to existing
agents or the database layer.
"""

from __future__ import annotations

import logging

from dotenv import load_dotenv
from fastapi import FastAPI

from app.api.complaint import router as complaint_router
from app.api.complaint_test import router as complaint_test_router
from app.api.duplicate_test import router as duplicate_test_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="AI Civic Intelligence Platform",
    description="Backend for the civic complaint understanding pipeline.",
    version="0.1.0",
)

app.include_router(complaint_test_router)
app.include_router(complaint_router)
app.include_router(duplicate_test_router)