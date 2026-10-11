"""Boar-specific short, loaded forequarters and cloven-hoof controls."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from native_types import present, require

if TYPE_CHECKING:
    import bpy

Point = tuple[float, float, float]
FPS = 60
FEET = ("fore.L", "fore.R", "rear.L", "rear.R")
ROTATIONS = ("pelvis", "chest", "head", "jaw", "ear.L", "ear.R", "tail")
CONTROLS = ("CTRL_body", *(f"CTRL_{n}" for n in ROTATIONS), *(f"CTRL_{f}" for f in FEET))


def hoof(foot: str) -> Point:
    return (0.52 if foot.startswith("fore") else -0.82, 0.34 if foot.endswith("L") else -0.34, 0.14)


def joints() -> list[tuple[str, Point, Point, str | None]]:
    result: list[tuple[str, Point, Point, str | None]] = [
        ("pelvis", (-0.77, 0, 1.03), (-0.18, 0, 1.15), "CTRL_body"),
        ("chest", (-0.18, 0, 1.15), (0.49, 0, 1.22), "pelvis"),
        ("head", (0.49, 0, 1.12), (1.55, 0, 0.65), "chest"),
        ("jaw", (0.68, 0, 0.80), (1.50, 0, 0.51), "head"),
        ("ear.L", (0.70, 0.24, 1.36), (0.70, 0.48, 1.65), "head"),
        ("ear.R", (0.70, -0.24, 1.36), (0.70, -0.48, 1.65), "head"),
        ("tail", (-1.18, 0, 1.12), (-1.49, 0, 0.85), "pelvis"),
    ]
    for foot in FEET:
        fore = foot.startswith("fore")
        y = hoof(foot)[1]
        hip: Point = (0.44 if fore else -0.83, y, 1.08)
        knee: Point = (0.27 if fore else -0.57, y, 0.55)
        result += [
            (f"upper.{foot}", hip, knee, "chest" if fore else "pelvis"),
            (f"lower.{foot}", knee, hoof(foot), f"upper.{foot}"),
            (f"hoof.{foot}", hoof(foot), (hoof(foot)[0] + 0.19, y, 0.14), f"lower.{foot}"),
        ]
    return result


def activate(obj: bpy.types.Object) -> None:
    import bpy

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    present(bpy.context.view_layer).objects.active = obj


def make_rig(name: str) -> bpy.types.Object:
    import bpy
    from mathutils import Vector

    data = bpy.data.armatures.new("Boar · short loaded limbs")
    rig = bpy.data.objects.new(name, data)
    present(bpy.context.scene).collection.objects.link(rig)
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, point in [("CTRL_body", (0, 0, 1.0)), *((f"CTRL_{f}", hoof(f)) for f in FEET)]:
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = point, Vector(point) + Vector((0, 0.15, 0))
        bone.use_deform = False
    for name, head, tail, parent in joints():
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        bone.parent = data.edit_bones[parent] if parent else None
    for name in ROTATIONS:
        source = data.edit_bones[name]
        bone = data.edit_bones.new(f"CTRL_{name}")
        bone.head, bone.tail, bone.roll = source.head.copy(), source.tail.copy(), source.roll
        bone.use_deform = False
    for foot in FEET:
        source = data.edit_bones[f"hoof.{foot}"]
        bone = data.edit_bones.new(f"MCH_{foot}")
        bone.head, bone.tail, bone.roll = source.head.copy(), source.tail.copy(), source.roll
        bone.parent, bone.use_deform = data.edit_bones[f"CTRL_{foot}"], False
        pole = data.edit_bones.new(f"POLE_{foot}")
        x, y, z = hoof(foot)
        pole.head = (x - 1 if foot.startswith("fore") else x + 1, y, z + 0.4)
        pole.tail = pole.head + Vector((0, 0.12, 0))
        pole.use_deform = False
    bpy.ops.object.mode_set(mode="OBJECT")
    pose = present(rig.pose)
    for pose_bone in pose.bones:
        pose_bone.rotation_mode = "XYZ"
    for name in ROTATIONS:
        c = require(
            pose.bones[name].constraints.new("COPY_ROTATION"), bpy.types.CopyRotationConstraint
        )
        c.target, c.subtarget = rig, f"CTRL_{name}"
        c.owner_space = c.target_space = "LOCAL"
    for foot in FEET:
        ik = require(
            pose.bones[f"lower.{foot}"].constraints.new("IK"), bpy.types.KinematicConstraint
        )
        ik.target, ik.subtarget, ik.chain_count, ik.use_stretch = rig, f"MCH_{foot}", 2, False
        ik.pole_target, ik.pole_subtarget = rig, f"POLE_{foot}"
        r = require(
            pose.bones[f"hoof.{foot}"].constraints.new("COPY_ROTATION"),
            bpy.types.CopyRotationConstraint,
        )
        r.target, r.subtarget = rig, f"MCH_{foot}"
        r.owner_space = r.target_space = "WORLD"
        upper = pose.bones[f"upper.{foot}"]
        ik.pole_angle = 0
        present(bpy.context.view_layer).update()
        origin = upper.head.copy()
        axis = (pose.bones[f"MCH_{foot}"].head - origin).normalized()
        zero = upper.tail.copy()
        center = origin + axis * (zero - origin).dot(axis)
        u = (zero - center).normalized()
        ik.pole_angle = math.pi / 2
        present(bpy.context.view_layer).update()
        v = (upper.tail - center).normalized()
        desired = (upper.bone.tail_local - center).normalized()
        ik.pole_angle = math.atan2(desired.dot(v), desired.dot(u))
    present(bpy.context.view_layer).update()
    rig.show_in_front = True
    rig["rig_family"] = "boar-v1"
    return rig
