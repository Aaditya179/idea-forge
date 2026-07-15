"""
Shared ComplaintContext model.

`ComplaintContext` is the single object that flows through the entire AI
pipeline:

    Citizen Complaint -> ComplaintContext
        -> Complaint Agent      -> ComplaintContext
        -> Duplicate Agent      -> ComplaintContext
        -> Priority Agent       -> ComplaintContext   (future)
        -> Routing Agent        -> ComplaintContext   (future)
        -> Communication Agent  -> ComplaintContext   (future)

Every agent receives a `ComplaintContext` and returns the SAME instance,
only ever enriching it with its own output field. No agent should replace
this object or invent a parallel workflow object.

`ComplaintContext` is NOT a database model — it exists only for the
duration of a single AI workflow run and is never persisted as-is.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.complaint import ComplaintAnalysis
from app.models.duplicate import DuplicateResult


class ComplaintContext(BaseModel):
    """Shared, progressively-enriched context passed between AI agents."""

    # --- Original citizen request -----------------------------------------
    complaint_text: str = Field(
        ...,
        min_length=1,
        description="Raw complaint text as submitted by the citizen.",
        examples=["Huge pothole near TSEC main gate."],
    )
    citizen_id: str = Field(
        ...,
        description="ID of the citizen submitting the complaint.",
        examples=["123"],
    )
    latitude: float | None = Field(
        default=None, description="Optional latitude of the complaint location."
    )
    longitude: float | None = Field(
        default=None, description="Optional longitude of the complaint location."
    )
    image_url: str | None = Field(
        default=None,
        description="Optional URL of an image attached to the complaint, for "
        "the future Image Analysis Agent.",
    )

    # --- Agent outputs (each agent fills in its own field) ------------------
    analysis: ComplaintAnalysis | None = Field(
        default=None, description="Output of the Complaint Understanding Agent."
    )
    duplicate: DuplicateResult | None = Field(
        default=None, description="Output of the Duplicate Detection Agent."
    )

    # --- Placeholders for future agents -------------------------------------
    # These stay Optional and default to None until their respective agents
    # and models exist. Adding a real model later only requires updating the
    # type hint here — no other agent's code needs to change.
    priority: dict | None = Field(
        default=None, description="Placeholder for the future Priority Agent's output."
    )
    routing: dict | None = Field(
        default=None, description="Placeholder for the future Routing Agent's output."
    )
    communication: dict | None = Field(
        default=None,
        description="Placeholder for the future Communication Agent's output.",
    )