"""Saved action contract: playback, scene trajectory, support phases and visual markers."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, TypedDict, cast

from native_types import present
from parameters import FEET, FORMS, FPS, contact_offset, paw_origin

if TYPE_CHECKING:
    import bpy


class Marker(TypedDict):
    name: str
    time: float


class Contact(TypedDict):
    start: float
    end: float
    sites: list[str]
    mode: str


class MotionSpec(TypedDict):
    name: str
    seconds: float
    playback: str
    trajectory: list[list[float]]
    contacts: list[Contact]
    markers: list[Marker]


LABELS = {
    "idle": "Alert idle",
    "walk": "Brisk walk",
    "trot": "Trot",
    "look": "Planted look",
    "run": "Gallop",
    "lunge": "Lunge",
    "bite": "Bite",
    "swipe": "Paw swipe",
    "roll": "Playful ground roll",
    "flee": "Flee · turn and accelerate",
}


def read_spec(action: bpy.types.Action) -> MotionSpec:
    spec = cast(MotionSpec, json.loads(str(action["motion_spec"])))
    if spec["playback"] not in ("loop", "once") or spec["seconds"] <= 0:
        raise ValueError(f"Invalid motion contract: {action.name}")
    if len(spec["trajectory"]) != round(spec["seconds"] * FPS) + 1:
        raise ValueError(f"Incomplete scene trajectory: {action.name}")
    for phase in spec["contacts"]:
        if not 0 <= phase["start"] <= phase["end"] <= spec["seconds"]:
            raise ValueError(f"Invalid support phase: {action.name}")
    return spec


def save_spec(action: bpy.types.Action, spec: MotionSpec) -> None:
    action["motion_spec"] = json.dumps(spec)


def planted(spec: MotionSpec, foot: str, frame: int) -> bool:
    time = frame / FPS
    return any(
        c["mode"] == "planted"
        and foot in c["sites"]
        and c["start"] - 1e-6 <= time <= c["end"] + 1e-6
        for c in spec["contacts"]
    )


def author_spec(rig: bpy.types.Object, clip: str, end: int, speed: float) -> MotionSpec:
    import bpy
    from action_motion import trajectory
    from mathutils import Euler, Vector

    path = []
    toes: dict[str, list[Vector]] = {f: [] for f in FEET}
    for frame in range(end + 1):
        present(bpy.context.scene).frame_set(frame)
        x, y, yaw = trajectory(clip, frame / FPS)
        if speed:
            x = frame / FPS * speed
        path.append([frame / FPS, x, -y, yaw])
        rotation = Euler((0, 0, yaw)).to_matrix()
        for foot in FEET:
            bone = present(rig.pose).bones[f"CTRL_{foot}"]
            local = (
                Vector(paw_origin(foot))
                + bone.location
                + bone.rotation_euler.to_matrix() @ Vector(contact_offset(FORMS[0]))
            )
            toes[foot].append(Vector((x, y, 0)) + rotation @ local)
    contacts: list[Contact] = []
    for foot, points in toes.items():
        start: int | None = None
        for frame in range(end + 1):
            fixed = (
                frame < end
                and abs(points[frame].z) < 0.001
                and abs(points[frame + 1].z) < 0.001
                and (points[frame + 1] - points[frame]).length < 0.0001
            )
            if fixed and start is None:
                start = frame
            elif not fixed and start is not None:
                contacts.append(
                    {"start": start / FPS, "end": frame / FPS, "sites": [foot], "mode": "planted"}
                )
                start = None
    if clip == "roll":
        contacts.extend(
            [
                {"start": 1.42, "end": 1.50, "sites": ["right-flank"], "mode": "rolling"},
                {"start": 1.80, "end": 1.88, "sites": ["back"], "mode": "rolling"},
                {"start": 2.18, "end": 2.26, "sites": ["left-flank"], "mode": "rolling"},
            ]
        )
    marker_times = {
        "lunge": [("anticipation", 0.18), ("contact", 0.44), ("recovery", 0.68)],
        "bite": [("anticipation", 0.20), ("contact", 0.43), ("recovery", 0.65)],
        "swipe": [("anticipation", 0.20), ("contact", 0.47), ("recovery", 0.70)],
        "roll": [("lower", 0.18), ("back", 0.46), ("regain-feet", 0.86)],
        "flee": [("turn", 0), ("accelerate", 0.20), ("run", 0.40)],
    }.get(clip, [])
    return {
        "name": LABELS[clip],
        "seconds": end / FPS,
        "playback": "loop" if clip in ("idle", "walk", "trot", "look", "run") else "once",
        "trajectory": path,
        "contacts": contacts,
        "markers": [{"name": name, "time": p * end / FPS} for name, p in marker_times],
    }
