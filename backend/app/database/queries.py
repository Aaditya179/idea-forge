"""
Reusable Supabase query functions for the `complaints` table.

Each function performs exactly one Supabase table operation and returns the
raw response data (plain dicts/lists) — no business logic, no agent-specific
concepts. Every current and future agent (Duplicate, Priority, Routing,
Communication) and both dashboards (Officer, Admin) should call these same
functions instead of writing their own Supabase queries.

These functions are synchronous, matching the underlying `supabase-py`
client. `SupabaseService` is responsible for running them off the event
loop (via `asyncio.to_thread`) so the API remains fully async.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from supabase import Client

logger = logging.getLogger(__name__)

COMPLAINTS_TABLE = "complaints"


def insert_complaint(client: Client, complaint_data: dict[str, Any]) -> dict[str, Any]:
    """
    Insert a new complaint row.

    Args:
        client: Active Supabase client.
        complaint_data: Column/value pairs to insert.

    Returns:
        The inserted row as returned by Supabase.

    Raises:
        ValueError: If Supabase returns no data for the insert.
    """
    logger.info("Inserting new complaint row")
    response = client.table(COMPLAINTS_TABLE).insert(complaint_data).execute()
    if not response.data:
        raise ValueError("Insert returned no data.")
    return response.data[0]


def fetch_complaint_by_id(client: Client, complaint_id: str) -> Optional[dict[str, Any]]:
    """
    Fetch a single complaint by id.

    Returns:
        The complaint row, or None if no row matches `complaint_id`.
    """
    logger.info("Fetching complaint id=%s", complaint_id)
    response = (
        client.table(COMPLAINTS_TABLE)
        .select("*")
        .eq("id", complaint_id)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def fetch_all_complaints(client: Client) -> list[dict[str, Any]]:
    """
    Fetch all complaints, most recently created first.

    Returns:
        A list of complaint rows (empty list if none exist).
    """
    logger.info("Fetching all complaints")
    response = (
        client.table(COMPLAINTS_TABLE)
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def update_complaint_status(
    client: Client, complaint_id: str, status: str
) -> Optional[dict[str, Any]]:
    """
    Update a complaint's status.

    Returns:
        The updated row, or None if no row matches `complaint_id`.
    """
    logger.info("Updating complaint id=%s to status=%s", complaint_id, status)
    response = (
        client.table(COMPLAINTS_TABLE)
        .update({"status": status})
        .eq("id", complaint_id)
        .execute()
    )
    return response.data[0] if response.data else None


def delete_complaint_by_id(client: Client, complaint_id: str) -> bool:
    """
    Delete a complaint by id.

    Returns:
        True if a row was deleted, False if no row matched `complaint_id`.
    """
    logger.info("Deleting complaint id=%s", complaint_id)
    response = client.table(COMPLAINTS_TABLE).delete().eq("id", complaint_id).execute()
    return bool(response.data)