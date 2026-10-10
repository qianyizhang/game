"""Reference-guided source actions, authored once; fitting never calls these recipes."""

from __future__ import annotations

import json
import math
from typing import TYPE_CHECKING

from native_types import present
from parameters import CLIPS, FEET, FORMS, FPS, GAITS, contact_offset
from rig import CONTROLS

if TYPE_CHECKING:
    import bpy


def ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def envelope(p: float, start: float, attack: float, release: float, end: float) -> float:
    return ease((p - start) / (attack - start)) * (1 - ease((p - release) / (end - release)))


def rotate(rig: bpy.types.Object, name: str, x: float = 0, y: float = 0, z: float = 0) -> None:
    from mathutils import Euler

    bone = present(rig.pose).bones[name]
    axes = bone.bone.matrix_local.to_3x3()
    bone.rotation_euler = (axes.inverted() @ Euler((x, y, z)).to_matrix() @ axes).to_euler("XYZ")


def author_motion(rig: bpy.types.Object) -> None:
    import bpy
    from action_motion import pose_action
    from mathutils import Euler, Vector
    from motion_spec import author_spec, save_spec
    from timing import refine_actions

    rig["motion_clips"] = json.dumps(list(CLIPS))
    scene = present(bpy.context.scene)
    scene.render.fps = FPS
    pose = present(rig.pose)
    for clip, end in CLIPS.items():
        rig.animation_data_clear()
        action = bpy.data.actions.new(clip)
        action.use_fake_user = True
        rig.animation_data_create().action = action
        gait = GAITS.get(clip)
        for frame in range(end + 1):
            for name in CONTROLS:
                pose.bones[name].location = (0, 0, 0)
                pose.bones[name].rotation_euler = (0, 0, 0)
            p, cycle = frame / end, math.tau * frame / end
            if clip in ("lunge", "bite", "swipe", "roll", "flee"):
                pose_action(rig, clip, p)
            elif gait:
                energetic = clip in ("trot", "run")
                body = pose.bones["CTRL_body"]
                body.location.z = (
                    (-0.050 - 0.030 * math.cos(2 * cycle - 2.0))
                    if energetic
                    else -0.018 + 0.012 * math.cos(2 * cycle)
                )
                if clip == "run":
                    body.location.z -= 0.04
                body.rotation_euler = (
                    0.009 * math.sin(cycle),
                    0.012 * math.sin(2 * cycle - 0.3),
                    0.012 * math.sin(cycle),
                )
                support, load = 0.0, 0.0
                for foot, offset in zip(FEET, gait.offsets, strict=True):
                    phase = (p + offset) % 1
                    front = foot.startswith("front")
                    if phase < gait.stance:
                        x = gait.sweep * (0.5 - phase / gait.stance)
                        z = 0.0
                        pitch = gait.roll * ease((phase / gait.stance - 0.80) / 0.20)
                        weight = math.sin(math.pi * phase / gait.stance)
                        support += (1 if foot.endswith("L") else -1) * weight
                        load += weight
                    else:
                        t = (phase - gait.stance) / (1 - gait.stance)
                        # Match backwards ground velocity at lift-off and touchdown;
                        # the limb accelerates forwards between them, rather than stopping dead.
                        velocity = -gait.sweep * (1 - gait.stance) / gait.stance
                        x = (
                            -gait.sweep / 2
                            + gait.sweep * ease(t)
                            + velocity * (t - 3 * t * t + 2 * t * t * t)
                        )
                        clearance = gait.fore_clearance if front else gait.hind_clearance
                        z = clearance * math.sin(math.pi * t) ** 2
                        pitch = (gait.roll + (0.68 - gait.roll) * ease(t / 0.25)) * (
                            1 - ease((t - 0.25) / 0.45)
                        ) - 0.18 * envelope(t, 0.42, 0.68, 0.72, 0.88)
                    control = pose.bones[f"CTRL_{foot}"]
                    pivot = Vector(contact_offset(FORMS[0]))
                    rotation = Euler((0, pitch, 0))
                    control.rotation_euler = rotation
                    control.location = Vector((x, 0, z)) + pivot - rotation.to_matrix() @ pivot
                body.location.y = 0.025 * support / max(load, 0.1) if not energetic else 0
                rotate(
                    rig, "CTRL_pelvis", x=0.015 * math.sin(cycle), z=0.025 * math.sin(cycle - 0.45)
                )
                rotate(
                    rig,
                    "CTRL_spine",
                    x=-0.009 * math.sin(cycle),
                    y=0.009 * math.sin(2 * cycle),
                    z=-0.02 * math.sin(cycle - 0.45),
                )
                rotate(rig, "CTRL_neck", y=-body.rotation_euler.y * 0.8)
                rotate(
                    rig,
                    "CTRL_head",
                    y=-0.013 * math.sin(2 * cycle - 0.3),
                    z=-0.016 * math.sin(cycle),
                )
                for side, offset in (("L", 0.0), ("R", 0.5)):
                    rotate(
                        rig, f"CTRL_scapula.{side}", y=-0.10 * math.cos(cycle + offset * math.tau)
                    )
                for i in range(4):
                    rotate(
                        rig,
                        f"CTRL_tail.{i}",
                        y=0.025 * math.sin(2 * cycle - i * 0.5),
                        z=0.035 * math.sin(cycle - i * 0.65),
                    )
            else:
                breath = 0.004 * math.sin(2 * cycle)
                pose.bones["CTRL_body"].location = (0, 0.005 * math.sin(cycle), breath)
                look = envelope(p, 0.09, 0.20, 0.57, 0.78) if clip == "look" else 0
                rotate(rig, "CTRL_spine", z=0.025 * look)
                rotate(rig, "CTRL_neck", y=-0.045 * look, z=0.13 * look)
                rotate(
                    rig,
                    "CTRL_head",
                    y=-0.035 * look + 0.012 * math.sin(cycle),
                    z=0.36 * look + 0.018 * math.sin(cycle),
                )
                for i in range(4):
                    rotate(
                        rig,
                        f"CTRL_tail.{i}",
                        z=0.018 * math.sin(cycle - i * 0.35) * math.sin(math.pi * p) ** 2,
                    )
            for side, offset in (("L", 0.0), ("R", 0.10)):
                flick = envelope(p, 0.25 + offset, 0.28 + offset, 0.31 + offset, 0.38 + offset)
                rotate(
                    rig,
                    f"CTRL_ear.{side}",
                    x=0.065 * flick * (1 if side == "L" else -1),
                    y=(-2.60 * envelope(p, 0.02, 0.18, 0.77, 0.99))
                    if clip == "roll"
                    else 0.10 * flick,
                )
            for name in CONTROLS:
                bone = pose.bones[name]
                bone.keyframe_insert("location", frame=frame, group=name)
                bone.keyframe_insert("rotation_euler", frame=frame, group=name)
        action["clip"] = clip
        action["end_frame"] = end
        action["travel_speed"] = gait.speed(end) if gait else 0.0
        action["stance_fraction"] = gait.stance if gait else 1.0
        action["foot_offsets"] = list(gait.offsets) if gait else [0.0] * 4
        save_spec(action, author_spec(rig, clip, end, float(action["travel_speed"])))
    refine_actions(rig)
