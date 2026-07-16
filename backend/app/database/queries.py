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
from datetime import UTC, datetime, timedelta
from math import asin, cos, radians, sin, sqrt
from typing import Any, Optional

from supabase import Client

logger = logging.getLogger(__name__)

COMPLAINTS_TABLE = "complaints"
OFFICERS_TABLE = "officers"


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


def find_recent_complaints(
    client: Client, department: str, days: int = 7, limit: int = 50
) -> list[dict[str, Any]]:
    """Fetch recent complaints for a department."""
    logger.info("Fetching recent complaints for department=%s", department)
    created_after = (datetime.now(UTC) - timedelta(days=days)).isoformat()
    response = (
        client.table(COMPLAINTS_TABLE)
        .select("*")
        .eq("department", department)
        .gte("created_at", created_after)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []


def find_department_complaints(
    client: Client, department: str, limit: int = 20
) -> list[dict[str, Any]]:
    """Fetch the most recent complaints for a department."""
    logger.info("Fetching complaints for department=%s", department)
    response = (
        client.table(COMPLAINTS_TABLE)
        .select("*")
        .eq("department", department)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []


def find_nearby_complaints(
    client: Client,
    latitude: float,
    longitude: float,
    radius_km: float = 2.0,
    limit: int = 20,
) -> list[dict[str, Any]]:
    """Fetch complaints with coordinates within `radius_km` of a point."""
    logger.info("Fetching nearby complaints within radius_km=%s", radius_km)
    response = (
        client.table(COMPLAINTS_TABLE)
        .select("*")
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )

    nearby: list[dict[str, Any]] = []
    for row in response.data or []:
        row_latitude = row.get("latitude")
        row_longitude = row.get("longitude")
        if row_latitude is None or row_longitude is None:
            continue
        distance = _distance_km(
            latitude, longitude, float(row_latitude), float(row_longitude)
        )
        if distance <= radius_km:
            row["distance_km"] = round(distance, 3)
            nearby.append(row)

    nearby.sort(key=lambda item: item.get("distance_km", radius_km + 1))
    return nearby[:limit]


def find_officers_by_department(
    client: Client, department: str, limit: int = 20
) -> list[dict[str, Any]]:
    """Fetch officers assigned to a department."""
    logger.info("Fetching officers for department=%s", department)
    response = (
        client.table(OFFICERS_TABLE)
        .select("*")
        .eq("department", department)
        .limit(limit)
        .execute()
    )
    return response.data or []


def find_officers_by_ward(
    client: Client, ward: str, limit: int = 20
) -> list[dict[str, Any]]:
    """Fetch officers assigned to a ward."""
    logger.info("Fetching officers for ward=%s", ward)
    response = (
        client.table(OFFICERS_TABLE)
        .select("*")
        .eq("ward", ward)
        .limit(limit)
        .execute()
    )
    return response.data or []


def _distance_km(
    latitude_a: float, longitude_a: float, latitude_b: float, longitude_b: float
) -> float:
    """Return the haversine distance between two coordinates in kilometers."""
    earth_radius_km = 6371.0
    delta_latitude = radians(latitude_b - latitude_a)
    delta_longitude = radians(longitude_b - longitude_a)
    lat_a = radians(latitude_a)
    lat_b = radians(latitude_b)

    haversine = (
        sin(delta_latitude / 2) ** 2
        + cos(lat_a) * cos(lat_b) * sin(delta_longitude / 2) ** 2
    )
    return 2 * earth_radius_km * asin(sqrt(haversine))
