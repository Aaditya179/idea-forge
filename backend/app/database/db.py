"""
Low-level Supabase client factory.

This module owns raw Supabase client construction — reading credentials
from the environment and exposing a single, lazily-created client. Nothing
above this layer (queries, services, agents, routes) should ever call
`create_client` directly; everything goes through `get_db_client()` so
there is exactly one client per process, shared by every current and
future agent.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

from supabase import Client, create_client

logger = logging.getLogger(__name__)


class DatabaseConfigError(Exception):
    """Raised when Supabase credentials are missing or invalid."""


@lru_cache(maxsize=1)
def get_db_client() -> Client:
    """
    Return a singleton Supabase client, created on first use.

    Returns:
        A configured `supabase.Client` instance.

    Raises:
        DatabaseConfigError: If SUPABASE_URL or SUPABASE_KEY are not set.

    Note:
        SUPABASE_KEY is expected to be the Supabase **service role** key
        (not the anon/public key) — see backend/.env.example. This backend
        is the sole caller of Supabase and does its own access control in
        FastAPI, so the service role key is used to bypass Row Level
        Security rather than relying on Postgres policies.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Supabase credentials are missing from the environment.")
        raise DatabaseConfigError(
            "SUPABASE_URL and SUPABASE_KEY must be set in the environment (.env)."
        )

    logger.info("Supabase client initialized.")
    return create_client(supabase_url, supabase_key)