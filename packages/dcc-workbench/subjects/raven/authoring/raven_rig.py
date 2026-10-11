"""Avian controls: shoulder/elbow/wrist fans and independent anisodactyl feet."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from native_types import present, require

if TYPE_CHECKING:
    import bpy

Point = tuple[float, float, float]
FPS = 60
FEET = ("L", "R")
ROTATIONS = (
    "body",
    "neck",
    "head",
    "tail",
    "shoulder.L",
    "elbow.L",
    "wrist.L",
    "shoulder.R",
    "elbow.R",
    "wrist.R",
    "secondary.L",
    "secondary.R",
    *(f"primary.{side}.{i}" for side in FEET for i in range(9)),
)
CONTROLS = ("CTRL_root", *(f"CTRL_{n}" for n in ROTATIONS), *(f"CTRL_foot.{f}" for f in FEET))


def foot(side: str) -> Point:
    return (0.0, 0.20 if side == "L" else -0.20, 0.085)


def joints() -> list[tuple[str, Point, Point, str | None]]:
    result: list[tuple[str, Point, Point, str | None]] = [
        ("body", (-0.30, 0, 0.98), (0.08, 0, 1.28), "CTRL_root"),
        ("neck", (0.08, 0, 1.28), (0.34, 0, 1.63), "body"),
        ("head", (0.34, 0, 1.63), (0.76, 0, 1.70), "neck"),
        ("tail", (-0.59, 0, 0.98), (-1.28, 0, 0.62), "body"),
    ]
    for side, s in [("L", 1), ("R", -1)]:
        result += [
            (f"shoulder.{side}", (0.02, s * 0.25, 1.30), (-0.10, s * 0.74, 1.32), "body"),
            (f"elbow.{side}", (-0.10, s * 0.74, 1.32), (0.02, s * 1.23, 1.30), f"shoulder.{side}"),
            (f"wrist.{side}", (0.02, s * 1.23, 1.30), (-0.10, s * 1.76, 1.27), f"elbow.{side}"),
            (f"shank.{side}", (-0.04, s * 0.20, 0.77), (-0.19, s * 0.20, 0.37), "body"),
            (f"tarsus.{side}", (-0.19, s * 0.20, 0.37), foot(side), f"shank.{side}"),
            (f"foot.{side}", foot(side), (0.24, s * 0.20, 0.085), f"tarsus.{side}"),
        ]
    for side, sign in [("L", 1), ("R", -1)]:
        for i in range(9):
            y = 0.62 + i * 0.071
            x = -0.11 + (y - 0.74) * 0.24
            result.append(
                (
                    f"secondary.{side}.{i}",
                    (x, sign * y, 1.302),
                    (x - 0.49, sign * (y + 0.09), 1.265),
                    f"elbow.{side}",
                )
            )
    for side, sign in [("L", 1), ("R", -1)]:
        for i in range(9):
            y = 1.18 + i * 0.066
            x = 0.015 - (y - 1.23) * 0.23
            result.append(
                (
                    f"primary.{side}.{i}",
                    (x, sign * y, 1.287),
                    (x - 0.75 + i * 0.09, sign * (y + 0.35 + i * 0.025), 1.255 - i * 0.002),
                    f"wrist.{side}",
                )
            )
    return result


def activate(obj: bpy.types.Object) -> None:
    import bpy

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    present(bpy.context.view_layer).objects.active = obj


def make_rig(name: str) -> bpy.types.Object:
    import bpy
    from mathutils import Vector

    data = bpy.data.armatures.new("Raven · avian articulation")
    rig = bpy.data.objects.new(name, data)
    present(bpy.context.scene).collection.objects.link(rig)
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    for label, point in [("CTRL_root", (0, 0, 1.0)), *((f"CTRL_foot.{f}", foot(f)) for f in FEET)]:
        bone = data.edit_bones.new(label)
        bone.head, bone.tail = point, Vector(point) + Vector((0, 0.15, 0))
        bone.use_deform = False
    for label, head, tail, parent in joints():
        bone = data.edit_bones.new(label)
        bone.head, bone.tail = head, tail
        bone.parent = data.edit_bones[parent] if parent else None
    for label in ROTATIONS:
        src = data.edit_bones[f"{label}.0" if label.startswith("secondary") else label]
        bone = data.edit_bones.new(f"CTRL_{label}")
        bone.head, bone.tail, bone.roll = src.head.copy(), src.tail.copy(), src.roll
        bone.use_deform = False
    for side in FEET:
        src = data.edit_bones[f"foot.{side}"]
        bone = data.edit_bones.new(f"MCH_foot.{side}")
        bone.head, bone.tail, bone.roll = src.head.copy(), src.tail.copy(), src.roll
        bone.parent, bone.use_deform = data.edit_bones[f"CTRL_foot.{side}"], False
        pole = data.edit_bones.new(f"POLE_{side}")
        pole.head = (-1, foot(side)[1], 0.45)
        pole.tail = pole.head + Vector((0, 0.1, 0))
        pole.use_deform = False
    bpy.ops.object.mode_set(mode="OBJECT")
    pose = present(rig.pose)
    for pose_bone in pose.bones:
        pose_bone.rotation_mode = "XYZ"
    for label in ROTATIONS:
        targets = [f"{label}.{i}" for i in range(9)] if label.startswith("secondary") else [label]
        for target in targets:
            c = require(
                pose.bones[target].constraints.new("COPY_ROTATION"),
                bpy.types.CopyRotationConstraint,
            )
            c.target, c.subtarget = rig, f"CTRL_{label}"
            c.owner_space = c.target_space = "LOCAL"
    for side in FEET:
        ik = require(
            pose.bones[f"tarsus.{side}"].constraints.new("IK"), bpy.types.KinematicConstraint
        )
        ik.target, ik.subtarget, ik.chain_count, ik.use_stretch = rig, f"MCH_foot.{side}", 2, False
        ik.pole_target, ik.pole_subtarget = rig, f"POLE_{side}"
        c = require(
            pose.bones[f"foot.{side}"].constraints.new("COPY_ROTATION"),
            bpy.types.CopyRotationConstraint,
        )
        c.target, c.subtarget = rig, f"MCH_foot.{side}"
        c.owner_space = c.target_space = "WORLD"
        upper = pose.bones[f"shank.{side}"]
        ik.pole_angle = 0
        present(bpy.context.view_layer).update()
        origin = upper.head.copy()
        axis = (pose.bones[f"MCH_foot.{side}"].head - origin).normalized()
        center = origin + axis * (upper.tail - origin).dot(axis)
        u = (upper.tail - center).normalized()
        ik.pole_angle = math.pi / 2
        present(bpy.context.view_layer).update()
        v = (upper.tail - center).normalized()
        desired = (upper.bone.tail_local - center).normalized()
        ik.pole_angle = math.atan2(desired.dot(v), desired.dot(u))
    rig.show_in_front = True
    rig["rig_family"] = "raven-v1"
    return rig
