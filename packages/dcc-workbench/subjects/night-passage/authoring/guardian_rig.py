"""Bellwarden suspension and three distinct saved attack performances."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from enemy_rig import author as author_base
from enemy_rig import make_rig as make_base
from hero_rig import activate as activate
from native_types import present, require

if TYPE_CHECKING:
    import bpy

FPS = 30
CLIPS = ("idle", "run", "sweep", "rain", "wheel", "stagger")


def make_rig() -> bpy.types.Object:
    import bpy

    rig = make_base("brute")
    rig.name = "GuardianRig"
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    data = require(rig.data, bpy.types.Armature)
    bell = data.edit_bones.new("bell")
    bell.head, bell.tail = (0, 0, 1.25), (0, 0, 1.42)
    bell.parent = data.edit_bones["chest"]
    bpy.ops.object.mode_set(mode="OBJECT")
    present(rig.pose).bones["bell"].rotation_mode = "XYZ"
    rig["authoring"] = "Planted-foot IK; FK arms and bell suspension. X-forward, Z-up."
    return rig


def author(rig: bpy.types.Object) -> None:
    import bpy

    author_base(rig, "brute")
    bpy.data.actions.remove(bpy.data.actions["attack"])
    author_attacks(rig)


def author_attacks(rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Quaternion, Vector

    def turn(name: str, axis: tuple[float, float, float], angle: float) -> None:
        bone = present(rig.pose).bones[name]
        rest = bone.bone.matrix_local.to_quaternion()
        bone.rotation_euler = (rest.inverted() @ Quaternion(Vector(axis), angle) @ rest).to_euler(
            "XYZ"
        )

    scene = present(bpy.context.scene)
    pose = present(rig.pose)
    controls = [b for b in pose.bones if not b.name.startswith(("MCH_", "POLE_"))]
    for name in ("sweep", "rain", "wheel"):
        previous = bpy.data.actions.get(name)
        if previous:
            bpy.data.actions.remove(previous)
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        action["seconds"], action["loop"], action["contact_phase"] = 1.4, False, 0.45
        rig.animation_data_create().action = action
        end = round(1.4 * FPS)
        for frame in range(end + 1):
            t = frame / end
            for bone in controls:
                bone.location, bone.rotation_euler = (0, 0, 0), (0, 0, 0)
            # Preparatory draw, decisive contact at .45, then a heavy settling arc.
            draw = (
                math.sin(math.pi / 2 * min(t / 0.33, 1))
                if t < 0.45
                else math.cos(math.pi / 2 * min((t - 0.45) / 0.55, 1))
            )
            hit = max(0, 1 - abs(t - 0.45) / 0.13)
            if name == "sweep":
                turn("chest", (0, 0, 1), -0.18 * draw + 0.35 * hit)
                turn("arm.R", (0, 0, 1), -0.80 * draw + 1.30 * hit)
                turn("bell", (0, 1, 0), 0.07 * draw - 0.16 * hit)
                turn("arm.L", (0, 1, 0), -0.12 * draw)
            elif name == "rain":
                turn("arm.L", (0, 1, 0), -0.95 * draw + 0.40 * hit)
                turn("chest", (0, 1, 0), -0.07 * draw + 0.12 * hit)
                turn("bell", (0, 1, 0), -0.04 * draw + 0.09 * hit)
                turn("head", (0, 1, 0), -0.10 * draw)
            else:
                turn("arm.L", (0, 0, 1), 0.55 * draw)
                turn("arm.R", (0, 0, 1), -0.55 * draw)
                turn("chest", (0, 0, 1), 0.10 * draw - 0.20 * hit)
                turn("bell", (0, 1, 0), 0.20 * draw - 0.40 * hit)
                turn("head", (0, 0, 1), 0.08 * draw)
            for bone in controls:
                for channel in ("location", "rotation_euler", "scale"):
                    bone.keyframe_insert(channel, frame=frame, group=bone.name)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    scene.frame_set(0)
