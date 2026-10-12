"""Saved guardian identities and their required performances."""

from __future__ import annotations

ATTACKS = {
    "bellwarden": ("sweep", "rain", "wheel"),
    "undertow": ("charge", "volley", "pulse"),
}


def clip_names(kind: str) -> tuple[str, ...]:
    return ("idle", "run", *ATTACKS[kind], "stagger")
