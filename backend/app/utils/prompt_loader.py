"""
Reusable prompt-loading utility.

Every agent in the pipeline (complaint understanding, image analysis,
duplicate detection, priority, routing, citizen communication) must load its
system prompt through this single utility rather than opening prompt files
directly. This keeps file I/O and path resolution in one place and avoids
duplicating prompt-reading code across agents.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)

# All prompt files live in `app/prompts/`, resolved relative to this file so
# the utility works regardless of the current working directory the app is
# started from.
_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


class PromptNotFoundError(FileNotFoundError):
    """Raised when a requested prompt file does not exist."""


@lru_cache(maxsize=None)
def load_prompt(filename: str) -> str:
    """
    Load a system prompt file from the `app/prompts/` directory.

    Args:
        filename: Name of the prompt file, e.g. "complaint_prompt.txt".

    Returns:
        The full contents of the prompt file as a string.

    Raises:
        PromptNotFoundError: If the prompt file does not exist.
    """
    prompt_path = _PROMPTS_DIR / filename

    if not prompt_path.is_file():
        logger.error("Prompt file not found: %s", prompt_path)
        raise PromptNotFoundError(f"Prompt file not found: {prompt_path}")

    logger.info("Prompt loaded: %s", filename)
    return prompt_path.read_text(encoding="utf-8")