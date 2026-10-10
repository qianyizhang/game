"""Named canid proportions and clip timing. Coordinates: X forward, Y left, Z up."""

from __future__ import annotations

from dataclasses import dataclass

Point = tuple[float, float, float]
FPS = 60
FEET = ("front.L", "front.R", "hind.L", "hind.R")


@dataclass(frozen=True)
class Form:
    name: str
    length: float = 1.0
    height: float = 1.0
    width: float = 1.0
    stride: float = 1.0

    def point(self, point: Point) -> Point:
        return point[0] * self.length, point[1] * self.width, point[2] * self.height


FORMS = (Form("ash"), Form("russet"), Form("moss", 1.07, 0.77, 1.22, 0.77))
CLIPS = {
    "idle": 240,
    "walk": 54,
    "trot": 36,
    "look": 150,
    "run": 42,
    "lunge": 108,
    "bite": 84,
    "swipe": 96,
    "roll": 240,
    "flee": 216,
}


@dataclass(frozen=True)
class Gait:
    stance: float
    sweep: float
    offsets: tuple[float, float, float, float]
    fore_clearance: float
    hind_clearance: float
    roll: float

    def speed(self, frames: int) -> float:
        return self.sweep / (self.stance * frames / FPS)


GAITS = {
    "walk": Gait(0.64, 0.82, (0, 0.5, 0.25, 0.75), 0.16, 0.19, 0.32),
    "trot": Gait(0.46, 0.90, (0, 0.5, 0.5, 0), 0.24, 0.28, 0.46),
    "run": Gait(0.34, 0.88, (0.0, 0.10, 0.52, 0.62), 0.28, 0.32, 0.48),
}


def paw_origin(foot: str) -> Point:
    return (
        0.67 if foot.startswith("front") else -0.76,
        0.28 if foot.endswith("L") else -0.28,
        0.16,
    )


def contact_offset(form: Form) -> Point:
    """Front supporting toe relative to the foot control, for grounded heel lift."""
    return form.point((0.25, 0, -0.16))


def pole_origin(foot: str) -> Point:
    return (-0.30 if foot.startswith("front") else 0.25, paw_origin(foot)[1], 0.85)
