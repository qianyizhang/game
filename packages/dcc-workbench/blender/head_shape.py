"""Coordinated cranial deformations in a head's local anatomical frame.

The neck attachment is behind y=0.1, the muzzle points toward negative Y, and
Z is up. All face parts cross the same transform so teeth, lips and eyes fit.
These offsets are additive shape keys; zero always recovers the source cage.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import pi, sin

Point3 = tuple[float, float, float]


@dataclass(frozen=True)
class HeadDesign:
    role: str
    reach: float
    taper: float
    crown: float
    horns: float


HEADS = (
    HeadDesign("Scent", 1.1, 0.95, 1.0, 1.0),
    HeadDesign("Search", 1.3, 1.10, 0.8, 1.0),
    HeadDesign("Guard", 0.95, 0.8, 1.1, 0.85),
)
CHANNELS = ("Muzzle reach", "Cranial taper", "Crown depth", "Horn sweep")


def clamp(value: float) -> float:
    return min(1.0, max(0.0, value))


def head_offset(point: Point3, channel: str, *, horn: bool = False) -> Point3:
    x, y, z = point
    if channel not in CHANNELS:
        raise ValueError(f"Unknown cranial channel: {channel}")
    if horn:
        if channel != "Horn sweep":
            return (0.0, 0.0, 0.0)
        t = clamp((y - 0.08) / 0.45)
        return (-x * 0.14 * t, 0.10 * t, -0.14 * t)
    if channel == "Muzzle reach":
        return (0.0, -max(0.0, -y - 0.12) * 0.38, 0.0)
    if channel == "Cranial taper":
        factor = clamp((0.1 - y) / 0.5)
        return (-x * (0.12 + 0.16 * factor) * clamp((0.15 - y) / 0.2), 0.0, 0.0)
    if channel == "Crown depth":
        length = clamp((y + 0.4) / 0.6)
        roof = sin(length * pi) * clamp((z + 0.015) / 0.13)
        return (0.0, 0.0, 0.045 * roof if y < 0.15 else 0.0)
    return (0.0, 0.0, 0.0)
