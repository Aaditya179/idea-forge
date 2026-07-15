"""
Supabase service.

Reusable, domain-agnostic data-access layer for the `complaints` table.
This is the ONLY place that talks to `database.queries` — API routes and
agents must never import query functions or raw Supabase client code
directly. This mirrors `GeminiService`: one singleton, one shared client,
one place for every future agent (Duplicate, Priority, Routing,
Communication) and dashboard (Officer, Admin) to add new reusable methods.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Optional

from app.database import queries
from app.database.db import DatabaseConfigError, get_db_client

logger = logging.getLogger(__name__)


class SupabaseServiceError(Exception):
    """Base exception for all Supabase service failures."""


class SupabaseService:
    """
    Singleton wrapper around the Supabase client and complaint queries.

    All methods are async: the underlying `supabase-py` client is
    synchronous, so each call is run in a worker thread via
    `asyncio.to_thread` to avoid blocking the event loop.
    """

    _instance: Optional["SupabaseService"] = None

    def __new__(cls, *args: Any, **kwargs: Any) -> "SupabaseService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return

        try:
            self._client = get_db_client()
        except DatabaseConfigError as exc:
            logger.error("Failed to initialize Supabase client: %s", exc)
            raise SupabaseServiceError(str(exc)) from exc

        self._initialized = True
        logger.info("SupabaseService initialized.")

    async def save_complaint(self, complaint_data: dict[str, Any]) -> dict[str, Any]:
        """Persist a new complaint row and return the saved record."""
        logger.info("Saving complaint to database")
        try:
            return await asyncio.to_thread(
                queries.insert_complaint, self._client, complaint_data
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("save_complaint failed: %s", exc)
            raise SupabaseServiceError(f"Failed to save complaint: {exc}") from exc

    async def get_complaint(self, complaint_id: str) -> Optional[dict[str, Any]]:
        """Retrieve a single complaint by id, or None if not found."""
        logger.info("Fetching complaint id=%s", complaint_id)
        try:
            return await asyncio.to_thread(
                queries.fetch_complaint_by_id, self._client, complaint_id
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("get_complaint failed: %s", exc)
            raise SupabaseServiceError(f"Failed to fetch complaint: {exc}") from exc

    async def get_all_complaints(self) -> list[dict[str, Any]]:
        """Retrieve all complaints."""
        logger.info("Fetching all complaints")
        try:
            return await asyncio.to_thread(queries.fetch_all_complaints, self._client)
        except Exception as exc:  # noqa: BLE001
            logger.error("get_all_complaints failed: %s", exc)
            raise SupabaseServiceError(f"Failed to fetch complaints: {exc}") from exc

    async def update_status(
        self, complaint_id: str, status: str
    ) -> Optional[dict[str, Any]]:
        """Update a complaint's status and return the updated record."""
        logger.info("Updating status for complaint id=%s", complaint_id)
        try:
            return await asyncio.to_thread(
                queries.update_complaint_status, self._client, complaint_id, status
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("update_status failed: %s", exc)
            raise SupabaseServiceError(
                f"Failed to update complaint status: {exc}"
            ) from exc

    async def delete_complaint(self, complaint_id: str) -> bool:
        """Delete a complaint by id. Returns True if a row was deleted."""
        logger.info("Deleting complaint id=%s", complaint_id)
        try:
            return await asyncio.to_thread(
                queries.delete_complaint_by_id, self._client, complaint_id
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("delete_complaint failed: %s", exc)
            raise SupabaseServiceError(f"Failed to delete complaint: {exc}") from exc

    async def find_recent_complaints(
        self, department: str, days: int = 7, limit: int = 50
    ) -> list[dict[str, Any]]:
        """Fetch complaints for a department created within the last `days` days."""
        logger.info("Finding recent complaints for department=%s", department)
        try:
            return await asyncio.to_thread(
                queries.find_recent_complaints, self._client, department, days, limit
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("find_recent_complaints failed: %s", exc)
            raise SupabaseServiceError(
                f"Failed to fetch recent complaints: {exc}"
            ) from exc

    async def find_department_complaints(
        self, department: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Fetch the most recent complaints for a given department."""
        logger.info("Finding complaints for department=%s", department)
        try:
            return await asyncio.to_thread(
                queries.find_department_complaints, self._client, department, limit
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("find_department_complaints failed: %s", exc)
            raise SupabaseServiceError(
                f"Failed to fetch department complaints: {exc}"
            ) from exc

    async def find_nearby_complaints(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 2.0,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Fetch complaints whose location falls within a radius of a point."""
        logger.info("Finding complaints near (%s, %s)", latitude, longitude)
        try:
            return await asyncio.to_thread(
                queries.find_nearby_complaints,
                self._client,
                latitude,
                longitude,
                radius_km,
                limit,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("find_nearby_complaints failed: %s", exc)
            raise SupabaseServiceError(
                f"Failed to fetch nearby complaints: {exc}"
            ) from exc


def get_supabase_service() -> SupabaseService:
    """
    FastAPI-friendly dependency provider.

    Returns the singleton SupabaseService instance, creating it on first
    call. Future agents and dashboards should depend on this function
    (via Depends) rather than instantiating SupabaseService directly.
    """
    return SupabaseService()