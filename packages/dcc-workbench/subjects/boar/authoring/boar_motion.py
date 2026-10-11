"""Five original boar performances authored once into the saved motion master."""

from __future__ import annotations

import json
import math
from typing import TYPE_CHECKING, TypedDict, cast

from boar_rig import CONTROLS, FEET, FPS, hoof
from native_types import present

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
    "idle": ("Breathe & scent", 4.0),
    "walk": ("Heavy walk", 1.2),
    "trot": ("Woodland trot", 0.7),
    "root": ("Root the earth", 4.8),
    "charge": ("Short charge · recover", 3.4),
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
            if clip in ("walk", "trot"):
                trot = clip == "trot"
                stance, sweep, lift = (0.56, 0.40, 0.11) if trot else (0.73, 0.34, 0.075)
                offsets = (0.0, 0.5, 0.5, 0.0) if trot else (0.0, 0.5, 0.75, 0.25)
                travel = p * sweep / stance
                body.location.z = -0.026 + (0.022 if trot else 0.012) * math.cos(cycle * 2)
                body.location.y = 0.014 * math.sin(cycle)
                body.rotation_euler = (0.013 * math.sin(cycle), 0.012 * math.sin(2 * cycle), 0)
                rotate(rig, "head", y=0.018 * math.sin(cycle * 2 - 0.5))
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
            elif clip == "root":
                reach = envelope(t, 0.2, 1.2, 3.4, 4.5)
                root = envelope(t, 1.2, 1.6, 3.0, 3.5) * math.sin((t - 1.2) * math.tau * 1.3)
                body.location = (0.025 * reach, 0, -0.075 * reach)
                rotate(rig, "head", y=0.40 * reach + 0.026 * root, z=0.045 * root)
                rotate(rig, "chest", y=0.023 * reach)
            elif clip == "charge":
                ready = envelope(t, 0.05, 0.45, 1.85, 2.7)
                travel = 1.20 * ease((t - 0.5) / 1.45)
                body.location.z = -0.075 * ready + 0.06 * envelope(t, 0.65, 1.0, 1.4, 1.8)
                rotate(rig, "head", y=0.17 * ready)
                for foot in FEET:
                    fore = foot.startswith("fore")
                    shift = 0.0 if fore else 0.22
                    xworld, z = 0.0, 0.0
                    for takeoff, finish in [
                        (0.58 + shift, 1.00 + shift),
                        (1.18 + shift, 1.65 + shift),
                    ]:
                        u = max(0, min(1, (t - takeoff) / (finish - takeoff)))
                        xworld += 0.60 * ease(u)
                        z += 0.14 * math.sin(math.pi * u) ** 2
                    pose.bones[f"CTRL_{foot}"].location = (xworld - travel, 0, z)
            else:
                body.location.z = 0.009 * (1 - math.cos(cycle))
                rotate(rig, "head", y=-0.025 * math.sin(cycle), z=0.018 * math.sin(cycle))
                rotate(rig, "chest", x=0.008 * math.sin(cycle))
            for side, sign in [("L", 1), ("R", -1)]:
                flick = envelope(
                    p,
                    0.42 if sign == 1 else 0.64,
                    0.48 if sign == 1 else 0.70,
                    0.49 if sign == 1 else 0.71,
                    0.59 if sign == 1 else 0.80,
                )
                rotate(rig, f"ear.{side}", x=sign * (0.06 * math.sin(cycle) + 0.10 * flick))
            rotate(rig, "tail", z=0.07 * math.sin(cycle - 0.7) * math.sin(math.pi * p) ** 2)
            for name in CONTROLS:
                bone = pose.bones[name]
                bone.keyframe_insert("location", frame=frame, group=name)
                bone.keyframe_insert("rotation_euler", frame=frame, group=name)
            path.append([t, travel, 0, 0])
            for foot in FEET:
                positions[foot].append(
                    Vector(hoof(foot))
                    + pose.bones[f"CTRL_{foot}"].location
                    + Vector((travel, 0, -0.14))
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
            "root": [("lower", 1.2), ("root", 2.4), ("recover", 3.8)],
            "charge": [("gather", 0.45), ("drive", 1.2), ("brake", 1.95), ("recover", 2.8)],
        }.get(clip, [])
        spec: Spec = {
            "name": label,
            "seconds": seconds,
            "playback": "once" if clip in ("root", "charge") else "loop",
            "trajectory": path,
            "contacts": contacts,
            "markers": [{"name": n, "time": t} for n, t in markers],
        }
        action["motion_spec"] = json.dumps(spec)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    scene.frame_set(0)
