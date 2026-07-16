"""
Pydantic models for the Routing Agent's output.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AssignedOfficer(BaseModel):
    """Officer selected for handling the routed complaint."""

    id: str | None = Field(default=None, description="Officer record ID.")
    name: str | None = Field(default=None, description="Officer display name.")
    email: str | None = Field(default=None, description="Officer email address.")
    phone: str | None = Field(default=None, description="Officer phone number.")
    department: str | None = Field(default=None, description="Officer department.")
    ward: str | None = Field(default=None, description="Officer ward.")


class RoutingResult(BaseModel):
    """Structured result produced by the Routing Agent."""

    department: str = Field(..., description="Department assigned to the complaint.")
    assigned_officer: AssignedOfficer | None = Field(
        default=None, description="Selected officer, or null if none was found."
    )
    ward: str | None = Field(default=None, description="Ward used for routing.")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Routing confidence between 0 and 1."
    )
    routing_reason: str = Field(
        ..., description="Human-readable explanation for the routing decision."
    )
    estimated_resolution_time: str = Field(
        ..., description="Expected resolution time for this complaint."
    )
    routing_timestamp: datetime = Field(
        ..., description="UTC timestamp when routing was completed."
    )


def officer_from_row(row: dict[str, Any]) -> AssignedOfficer:
    """Normalize a Supabase officer row into the public routing model."""
    return AssignedOfficer(
        id=_string_or_none(row.get("id") or row.get("officer_id")),
        name=_string_or_none(row.get("name") or row.get("full_name")),
        email=_string_or_none(row.get("email")),
        phone=_string_or_none(row.get("phone") or row.get("phone_number")),
        department=_string_or_none(row.get("department")),
        ward=_string_or_none(row.get("ward")),
    )


def _string_or_none(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)
