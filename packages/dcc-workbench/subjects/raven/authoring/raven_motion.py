"""Five original grounded raven performances, written once to a saved motion master."""

from __future__ import annotations

import json
import math
from typing import TYPE_CHECKING, TypedDict, cast

from native_types import present
from raven_rig import CONTROLS, FEET, FPS, foot

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
    "idle": ("Alert breath", 4.0),
    "walk": ("Deliberate steps", 1.6),
    "look": ("Listen and look", 4.0),
    "spread": ("Open wings · fold", 5.2),
    "preen": ("Tend the shoulder", 5.6),
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
        path = []
        positions: dict[str, list[Vector]] = {f: [] for f in FEET}
        for frame in range(end + 1):
            t, p = frame / FPS, frame / end
            cycle = p * math.tau
            for n in CONTROLS:
                pose.bones[n].location = (0, 0, 0)
                pose.bones[n].rotation_euler = (0, 0, 0)
            root = pose.bones["CTRL_root"]
            travel = 0.0
            opening = envelope(t, 0.35, 1.7, 3.0, 4.75) if clip == "spread" else 0.0
            preen = envelope(t, 0.4, 1.7, 3.8, 5.1) if clip == "preen" else 0.0
            for side, s in [("L", 1), ("R", -1)]:
                # Saved local rotations articulate upper wing, forearm and hand separately.
                local_open = opening + (0.16 * preen if side == "R" else 0)
                # Fit folded axes in armature space, then derive each joint's
                # local rotation. This preserves an avian Z-fold without treating
                # a world-space roll as a local Euler rotation at every joint.
                from mathutils import Matrix, Quaternion

                desired = {}
                for joint, direction in [
                    ("shoulder", (-0.48, s * 0.08, -0.12)),
                    ("elbow", (0.47, s * 0.03, -0.10)),
                    ("wrist", (-0.53, s * 0.015, -0.08)),
                ]:
                    name = f"{joint}.{side}"
                    bone = pose.bones[name].bone
                    rest_direction = (bone.tail_local - bone.head_local).normalized()
                    rest_cross = cast(Vector, rest_direction.cross(Vector((0, 0, 1)))).normalized()
                    rest_normal = cast(Vector, rest_cross.cross(rest_direction)).normalized()
                    basis = Matrix(
                        tuple((v.x, v.y, v.z) for v in (rest_cross, rest_direction, rest_normal))
                    ).transposed()
                    target_direction = Vector(direction).normalized()
                    target_cross = cast(
                        Vector, target_direction.cross(Vector((0, s, 0)))
                    ).normalized()
                    target_normal = cast(Vector, target_cross.cross(target_direction)).normalized()
                    target = Matrix(
                        tuple(
                            (v.x, v.y, v.z) for v in (target_cross, target_direction, target_normal)
                        )
                    ).transposed()
                    rotation = target @ basis.inverted() @ bone.matrix_local.to_3x3()
                    desired[joint] = rotation
                    parent_joint = {"elbow": "shoulder", "wrist": "elbow"}.get(joint)
                    local = bone.matrix_local.to_3x3().inverted() @ rotation
                    if parent_joint:
                        parent = pose.bones[f"{parent_joint}.{side}"].bone
                        local = (
                            bone.matrix_local.to_3x3().inverted()
                            @ parent.matrix_local.to_3x3()
                            @ desired[parent_joint].inverted()
                            @ rotation
                        )
                    pose.bones[f"CTRL_{name}"].rotation_euler = (
                        local.to_quaternion().slerp(Quaternion(), local_open).to_euler("XYZ")
                    )
                rotate(rig, f"secondary.{side}", z=s * 0.95 * (1 - local_open))
                for i in range(9):
                    sweep = math.pi / 2 - math.atan2(0.35 + i * 0.025, 0.75 - i * 0.09)
                    rotate(rig, f"primary.{side}.{i}", z=-s * sweep * (1 - local_open))
            if clip == "walk":
                stance, sweep, lift = 0.66, 0.27, 0.10
                travel = p * sweep / stance
                root.location = (0, 0.018 * math.sin(cycle), -0.018 + 0.015 * math.cos(cycle * 2))
                rotate(rig, "neck", y=0.045 * math.sin(cycle * 2))
                rotate(rig, "head", y=-0.045 * math.sin(cycle * 2))
                rotate(rig, "body", x=0.022 * math.sin(cycle))
                for side, offset in [("L", 0), ("R", 0.5)]:
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
                    pose.bones[f"CTRL_foot.{side}"].location = (x, 0, z)
            else:
                root.location.z = 0.007 * (1 - math.cos(cycle)) - 0.025 * opening
                rotate(rig, "body", y=-0.025 * opening)
                rotate(rig, "neck", y=-0.045 * opening)
                if clip == "look":
                    turn = envelope(t, 0.35, 1.05, 1.8, 2.6)
                    answer = envelope(t, 2.5, 2.95, 3.1, 3.8)
                    rotate(rig, "neck", z=-0.12 * turn + 0.06 * answer)
                    rotate(
                        rig, "head", z=-0.52 * turn + 0.24 * answer, y=-0.10 * turn, x=0.08 * turn
                    )
                elif clip == "preen":
                    nibble = envelope(t, 1.8, 2.1, 3.3, 3.7) * math.sin((t - 1.8) * math.tau * 1.6)
                    rotate(rig, "neck", z=-0.58 * preen, y=0.14 * preen)
                    rotate(
                        rig,
                        "head",
                        z=-1.23 * preen,
                        y=0.47 * preen + 0.028 * nibble,
                        x=0.15 * preen,
                    )
                else:
                    rotate(rig, "head", y=-0.018 * math.sin(cycle), z=0.026 * math.sin(cycle))
            rotate(
                rig,
                "tail",
                y=0.05 * opening,
                z=0.025 * math.sin(cycle) * math.sin(math.pi * p) ** 2,
            )
            for n in CONTROLS:
                control_bone = pose.bones[n]
                control_bone.keyframe_insert("location", frame=frame, group=n)
                control_bone.keyframe_insert("rotation_euler", frame=frame, group=n)
            path.append([t, travel, 0, 0])
            for side in FEET:
                positions[side].append(
                    Vector(foot(side))
                    + pose.bones[f"CTRL_foot.{side}"].location
                    + Vector((travel, 0, -0.085))
                )
        contacts: list[Contact] = []
        for side, points in positions.items():
            start: int | None = None
            for frame in range(end + 1):
                fixed = (
                    frame < end
                    and abs(points[frame].z) < 1e-5
                    and abs(points[frame + 1].z) < 1e-5
                    and (points[frame + 1] - points[frame]).length < 1e-5
                )
                if fixed and start is None:
                    start = frame
                elif not fixed and start is not None:
                    contacts.append(
                        {
                            "start": start / FPS,
                            "end": frame / FPS,
                            "sites": [side],
                            "mode": "planted",
                        }
                    )
                    start = None
        markers = {
            "look": [("listen", 1.5), ("answer", 3.05)],
            "spread": [("open", 1.7), ("display", 2.6), ("fold", 4.1)],
            "preen": [("reach", 1.7), ("preen", 2.8), ("recover", 4.6)],
        }.get(clip, [])
        spec: Spec = {
            "name": label,
            "seconds": seconds,
            "playback": "once" if clip in ("spread", "preen") else "loop",
            "trajectory": path,
            "contacts": contacts,
            "markers": [{"name": n, "time": t} for n, t in markers],
        }
        action["motion_spec"] = json.dumps(spec)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    scene.frame_set(0)
