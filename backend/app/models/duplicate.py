"""
Pydantic models for the Duplicate Detection Agent's output.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class MatchedComplaint(BaseModel):
    """A shortlisted candidate complaint considered during duplicate detection."""

    id: str = Field(..., description="ID of the candidate complaint.")
    category: str = Field(..., description="Category of the candidate complaint.")
    issue_type: str = Field(..., description="Issue type of the candidate complaint.")
    summary: str = Field(..., description="Summary of the candidate complaint.")
    similarity_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Pre-filter similarity score (0-100) used to shortlist "
        "this candidate before Gemini evaluated it.",
        examples=[87.5],
    )


class DuplicateResult(BaseModel):
    """Structured result produced by the Duplicate Detection Agent."""

    duplicate_found: bool = Field(
        ...,
        description="Whether one or more existing complaints are likely duplicates.",
        examples=[True],
    )
    duplicate_ids: list[str] = Field(
        default_factory=list,
        description="IDs of existing complaints identified as duplicates.",
        examples=[["b3f1c2a0-1111-2222-3333-444455556666"]],
    )
    matched_complaints: list[MatchedComplaint] = Field(
        default_factory=list,
        description="Shortlisted candidate complaints that were evaluated.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence in the duplicate decision, between 0 and 1.",
        examples=[0.94],
    )
    merge: bool = Field(
        ...,
        description="Whether this complaint should be merged into an existing one.",
        examples=[True],
    )
    reason: str = Field(
        ...,
        description="Short human-readable explanation of the decision.",
        examples=[
            "Found three complaints about the same road within the last seven days."
        ],
    )