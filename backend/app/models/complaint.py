"""
Pydantic models for the Complaint Understanding Agent.

These models define the input the agent accepts, the structured analysis it
produces, and the API response envelope returned to clients.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ComplaintInput(BaseModel):
    """Raw complaint text submitted by a citizen."""

    complaint_text: str = Field(
        ...,
        min_length=1,
        description="Raw complaint text as submitted by the citizen, in any "
        "language or mix of languages.",
        examples=[
            "There is a huge pothole outside my college causing traffic."
        ],
    )


class ComplaintAnalysis(BaseModel):
    """Structured understanding of a complaint, produced by the AI agent."""

    category: str = Field(
        ...,
        description="Fixed high-level category of the complaint.",
        examples=["Road Damage"],
    )
    issue_type: str = Field(
        ...,
        description="Short, specific description of the issue within the category.",
        examples=["large pothole causing traffic congestion"],
    )
    department: str = Field(
        ...,
        description="Government department responsible for resolving this complaint.",
        examples=["Road Department"],
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="Short keywords extracted or inferred from the complaint.",
        examples=[["pothole", "road damage", "traffic", "college road"]],
    )
    summary: str = Field(
        ...,
        description="Concise English summary of the complaint.",
        examples=[
            "A large pothole outside a college is causing traffic congestion."
        ],
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model's confidence in this classification, between 0 and 1.",
        examples=[0.92],
    )


class ComplaintResponse(BaseModel):
    """Standard API response envelope for complaint analysis results."""

    success: bool = Field(
        ...,
        description="Whether the complaint was analyzed successfully.",
        examples=[True],
    )
    message: str = Field(
        ...,
        description="Human-readable status message.",
        examples=["Complaint analyzed successfully"],
    )
    data: ComplaintAnalysis = Field(
        ...,
        description="Structured analysis of the complaint.",
    )