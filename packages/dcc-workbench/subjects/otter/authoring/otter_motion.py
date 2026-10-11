"""Five original otter performances authored once into the saved motion master."""

from __future__ import annotations

import json
import math
from typing import TYPE_CHECKING, TypedDict, cast

from native_types import present
from otter_rig import CONTROLS, FEET, FPS, paw

if TYPE_CHECKING:
    import bpy


class Contact(TypedDict):
    start: float
    end: float
    sites: list[str]
    mode: str


class Spec(TypedDict):
    name: str
    seconds: float
    playback: str
    trajectory: list[list[float]]
    contacts: list[Contact]
    markers: list[dict[str, str | float]]


CLIPS = {
    "idle": ("Breathe · ears & whiskers", 4.2),
    "walk": ("Low riverbank walk", 1.6),
    "bound": ("Elastic bound", 0.95),
    "scent": ("Investigate a scent", 5.2),
    "groom": ("Three-paw cheek wash", 6.0),
}


def ease(t: float) -> float:
    t = max(0, min(1, t))
    return t * t * (3 - 2 * t)


def envelope(t: float, a: float, b: float, c: float, d: float) -> float:
    return ease((t - a) / (b - a)) * (1 - ease((t - c) / (d - c)))


def rotate(rig: bpy.types.Object, name: str, x: float = 0, y: float = 0, z: float = 0) -> None:
    from mathutils import Euler

    bone = present(rig.pose).bones[f"CTRL_{name}"]
    axes = bone.bone.matrix_local.to_3x3()
    bone.rotation_euler = (axes.inverted() @ Euler((x, y, z)).to_matrix() @ axes).to_euler("XYZ")


def read_spec(action: bpy.types.Action) -> Spec:
    return cast(Spec, json.loads(str(action["motion_spec"])))


def groom_pose(rig: bpy.types.Object, t: float) -> None:
    """Transfer onto three planted paws, reach forward to the cheek, and recover."""
    pose = present(rig.pose)
    load = envelope(t, 0.25, 1.45, 4.8, 5.8)
    wash = envelope(t, 1.6, 2.1, 4.15, 4.7)
    stroke = wash * math.sin((t - 2.0) * math.tau / 1.1)
    # Shift toward fore.R; the long trunk stays low over a three-paw support triangle.
    pose.bones["CTRL_body"].location = (-0.035 * load, -0.04 * load, -0.015 * load)
    rotate(rig, "pelvis", y=0.012 * load)
    rotate(rig, "spine", y=0.018 * load, z=-0.014 * load)
    rotate(rig, "chest", y=0.025 * load)
    rotate(rig, "head", y=0.32 * load + 0.012 * stroke, z=0.12 * load)
    hand = pose.bones["CTRL_fore.L"]
    hand.location = (0.32 * load - 0.04 * stroke, 0.015 * load, 0.43 * load + 0.05 * stroke)
    hand.rotation_euler = (0, -0.34 * load + 0.065 * stroke, 0)
    pose.bones["CTRL_fore.R"].location = (0, 0, 0)
    pose.bones["CTRL_fore.R"].rotation_euler = (0, 0, 0)


def author(rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Vector

    rig["motion_clips"] = json.dumps(list(CLIPS))
    scene = present(bpy.context.scene)
    scene.render.fps = FPS
    pose = present(rig.pose)
    for clip, (label, seconds) in CLIPS.items():
        rig.animation_data_clear()
        action = bpy.data.actions.new(clip)
        action.use_fake_user = True
        rig.animation_data_create().action = action
        end = round(seconds * FPS)
        path: list[list[float]] = []
        positions: dict[str, list[Vector]] = {f: [] for f in FEET}
        for frame in range(end + 1):
            t, p = frame / FPS, frame / end
            cycle = p * math.tau
            for name in CONTROLS:
                pose.bones[name].location = (0, 0, 0)
                pose.bones[name].rotation_euler = (0, 0, 0)
            body = pose.bones["CTRL_body"]
            travel = 0.0
            if clip in ("walk", "bound"):
                fast = clip == "bound"
                stance, sweep, lift = (0.42, 0.34, 0.125) if fast else (0.72, 0.31, 0.075)
                offsets = (0.03, 0, 0.52, 0.49) if fast else (0, 0.5, 0.75, 0.25)
                travel = p * sweep / stance
                body.location.z = (
                    (-0.025 + 0.065 * (1 - math.cos(cycle * 2)))
                    if fast
                    else -0.012 + 0.014 * math.cos(cycle * 2)
                )
                body.location.y = 0.01 * math.sin(cycle)
                rotate(
                    rig,
                    "pelvis",
                    y=0.055 * math.sin(cycle + 0.4) if fast else 0.011 * math.sin(cycle),
                )
                rotate(
                    rig,
                    "spine",
                    y=0.075 * math.sin(cycle - 0.3) if fast else 0.014 * math.sin(cycle - 0.3),
                    z=0.012 * math.sin(cycle),
                )
                rotate(
                    rig,
                    "chest",
                    y=-0.06 * math.sin(cycle - 0.7) if fast else -0.012 * math.sin(cycle - 0.5),
                )
                rotate(
                    rig,
                    "head",
                    y=0.035 * math.sin(cycle - 1.0) if fast else 0.016 * math.sin(cycle - 1.0),
                )
                for foot, offset in zip(FEET, offsets, strict=True):
                    phase = (p + offset) % 1
                    if phase <= stance:
                        x, z = sweep * (0.5 - phase / stance), 0.0
                    else:
                        u = (phase - stance) / (1 - stance)
                        velocity = -sweep * (1 - stance) / stance
                        x = (
                            -sweep / 2
                            + sweep * ease(u)
                            + velocity * (u - 3 * u * u + 2 * u * u * u)
                        )
                        z = lift * math.sin(math.pi * u) ** 2
                    pose.bones[f"CTRL_{foot}"].location = (x, 0, z)
            elif clip == "scent":
                lower = envelope(t, 0.25, 1.25, 3.5, 4.75)
                sniff = envelope(t, 1.20, 1.65, 3.15, 3.7)
                body.location = (0.045 * lower, 0, -0.055 * lower)
                rotate(rig, "spine", y=0.025 * lower)
                rotate(rig, "chest", y=0.035 * lower)
                rotate(
                    rig,
                    "head",
                    y=0.245 * lower + 0.014 * sniff * math.sin(t * math.tau * 2.1),
                    z=0.12 * sniff * math.sin((t - 1.2) * math.tau * 0.42),
                )
                rotate(rig, "jaw", y=0.015 * sniff)
            elif clip == "groom":
                groom_pose(rig, t)
            else:
                breath = 0.5 - 0.5 * math.cos(cycle)
                body.location.z = 0.009 * breath
                rotate(rig, "spine", y=0.008 * breath)
                rotate(
                    rig,
                    "head",
                    y=-0.027 * math.sin(cycle),
                    z=0.032 * math.sin(cycle) * math.sin(math.pi * p) ** 2,
                )
                rotate(rig, "jaw", y=0.004 * breath)
            for side, sign in [("L", 1), ("R", -1)]:
                flick = envelope(
                    p,
                    0.35 if sign == 1 else 0.61,
                    0.39 if sign == 1 else 0.65,
                    0.4 if sign == 1 else 0.67,
                    0.47 if sign == 1 else 0.75,
                )
                rotate(rig, f"ear.{side}", x=sign * (0.035 * math.sin(cycle) + 0.09 * flick))
            for i in range(3):
                name = f"tail.{i + 1:02d}"
                bone = pose.bones[f"CTRL_{name}"]
                # Small delayed tail response follows the torso; keep the large base quiet at rest.
                amplitude = (
                    0.026 if clip == "idle" else 0.06 if clip in ("walk", "bound") else 0.024
                ) * (i + 1)
                current = bone.rotation_euler.copy()
                axes = bone.bone.matrix_local.to_3x3()
                from mathutils import Euler

                response = (
                    axes.inverted()
                    @ Euler(
                        (0, 0, amplitude * math.sin(cycle - 0.45 * i) * math.sin(math.pi * p) ** 2)
                    ).to_matrix()
                    @ axes
                )
                bone.rotation_euler = (current.to_matrix() @ response).to_euler("XYZ")
            for name in CONTROLS:
                bone = pose.bones[name]
                bone.keyframe_insert("location", frame=frame, group=name)
                bone.keyframe_insert("rotation_euler", frame=frame, group=name)
            path.append([t, travel, 0, 0])
            for foot in FEET:
                positions[foot].append(
                    Vector(paw(foot))
                    + pose.bones[f"CTRL_{foot}"].location
                    + Vector((travel, 0, -0.115))
                )
        contacts: list[Contact] = []
        for foot, points in positions.items():
            start: int | None = None
            for frame in range(end + 1):
                fixed = (
                    frame < end
                    and abs(points[frame].z) < 0.00001
                    and abs(points[frame + 1].z) < 0.00001
                    and (points[frame + 1] - points[frame]).length < 0.00001
                )
                if fixed and start is None:
                    start = frame
                elif not fixed and start is not None:
                    contacts.append(
                        {
                            "start": start / FPS,
                            "end": frame / FPS,
                            "sites": [foot],
                            "mode": "planted",
                        }
                    )
                    start = None
        markers = {
            "scent": [("lower", 1.25), ("search", 2.5), ("recover", 4.5)],
            "groom": [("support", 1.45), ("cheek", 2.6), ("wash", 3.8), ("lower", 4.8)],
        }.get(clip, [])
        spec: Spec = {
            "name": label,
            "seconds": seconds,
            "playback": "once" if clip in ("scent", "groom") else "loop",
            "trajectory": path,
            "contacts": contacts,
            "markers": [{"name": n, "time": t} for n, t in markers],
        }
        action["motion_spec"] = json.dumps(spec)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    scene.frame_set(0)
