"""Editable canid controls with grounded paw roll and articulated hocks."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import TYPE_CHECKING

from native_types import present, require
from parameters import FEET, Form, Point, paw_origin, pole_origin

if TYPE_CHECKING:
    import bpy


@dataclass(frozen=True)
class Joint:
    name: str
    head: Point
    tail: Point
    parent: str | None


ROTATIONS = {
    "CTRL_pelvis": "pelvis",
    "CTRL_spine": "spine",
    "CTRL_neck": "neck",
    "CTRL_head": "head",
    "CTRL_jaw": "jaw",
    **{f"CTRL_scapula.{side}": f"scapula.{side}" for side in ("L", "R")},
    **{f"CTRL_tail.{i}": f"tail.{i}" for i in range(4)},
    **{f"CTRL_ear.{side}": f"ear.{side}" for side in ("L", "R")},
}
CONTROLS = (
    "CTRL_body",
    *ROTATIONS,
    *(f"CTRL_{foot}" for foot in FEET),
    *(f"CTRL_pole.{foot}" for foot in FEET),
)


def joints(form: Form) -> list[Joint]:
    raw = [
        Joint("pelvis", (-0.65, 0, 1.25), (-0.12, 0, 1.33), "CTRL_body"),
        Joint("spine", (-0.12, 0, 1.33), (0.55, 0, 1.42), "pelvis"),
        Joint("neck", (0.55, 0, 1.42), (1.04, 0, 1.76), "spine"),
        Joint("head", (1.04, 0, 1.76), (1.68, 0, 1.67), "neck"),
        Joint("jaw", (1.075, 0, 1.615), (1.57, 0, 1.565), "head"),
    ]
    for foot in FEET:
        front = foot.startswith("front")
        side = foot[-1]
        y = 0.28 if side == "L" else -0.28
        if front:
            raw.append(Joint(f"scapula.{side}", (0.43, y * 0.8, 1.46), (0.63, y, 1.25), "spine"))
        hip = (0.63, y, 1.25) if front else (-0.66, y, 1.25)
        knee = (0.39, y, 0.81) if front else (-0.38, y, 0.85)
        hock = (0.65, y, 0.30) if front else (-0.94, y, 0.49)
        paw = paw_origin(foot)
        raw.extend(
            [
                Joint(f"upper.{foot}", hip, knee, f"scapula.{side}" if front else "pelvis"),
                Joint(f"lower.{foot}", knee, hock, f"upper.{foot}"),
                Joint(f"pastern.{foot}", hock, paw, f"lower.{foot}"),
                Joint(f"paw.{foot}", paw, (paw[0] + 0.25, y, 0.06), f"pastern.{foot}"),
            ]
        )
    tail = [
        (-0.9, 0, 1.31),
        (-1.21, 0, 1.09),
        (-1.5, 0.02, 0.82),
        (-1.73, 0.04, 0.55),
        (-1.86, 0.08, 0.33),
    ]
    for i in range(4):
        raw.append(
            Joint(f"tail.{i}", tail[i], tail[i + 1], "pelvis" if i == 0 else f"tail.{i - 1}")
        )
    for side, y in (("L", 0.16), ("R", -0.16)):
        raw.append(Joint(f"ear.{side}", (1.01, y, 1.9), (1.0, y * 1.45, 2.18), "head"))
    return [Joint(j.name, form.point(j.head), form.point(j.tail), j.parent) for j in raw]


def activate(obj: bpy.types.Object) -> None:
    import bpy

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    present(bpy.context.view_layer).objects.active = obj


def make_rig(form: Form, name: str = "CharacterRig") -> bpy.types.Object:
    import bpy
    from mathutils import Vector

    data = bpy.data.armatures.new("Canid articulated family")
    rig = bpy.data.objects.new(name, data)
    present(bpy.context.scene).collection.objects.link(rig)
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    # Blender bone local Y follows its length. Tail along world Y makes XYZ controls
    # agree with the documented world axes; vertical handles would rotate local lift sideways.
    locations = {"CTRL_body": form.point((0, 0, 1.25))}
    locations.update({f"CTRL_{foot}": form.point(paw_origin(foot)) for foot in FEET})
    locations.update({f"CTRL_pole.{foot}": form.point(pole_origin(foot)) for foot in FEET})
    for key, point in locations.items():
        bone = data.edit_bones.new(key)
        bone.head, bone.tail = point, Vector(point) + Vector((0, 0.16, 0))
        bone.use_deform = False
    for joint in joints(form):
        bone = data.edit_bones.new(joint.name)
        bone.head, bone.tail = joint.head, joint.tail
        bone.parent = data.edit_bones[joint.parent] if joint.parent else None
    for control, joint_name in ROTATIONS.items():
        source = data.edit_bones[joint_name]
        bone = data.edit_bones.new(control)
        bone.head, bone.tail = source.head.copy(), source.tail.copy()
        bone.roll = source.roll
        bone.use_deform = False
    for foot in FEET:
        # The foot control carries both the IK target and the rest-oriented paw/pastern.
        # Rotating around the toe contact is handled by the keyed control position.
        for part in ("pastern", "paw"):
            source = data.edit_bones[f"{part}.{foot}"]
            bone = data.edit_bones.new(f"MCH_{part}.{foot}")
            bone.head, bone.tail = source.head.copy(), source.tail.copy()
            bone.roll = source.roll
            bone.parent = data.edit_bones[f"CTRL_{foot}"]
            bone.use_deform = False
    bpy.ops.object.mode_set(mode="OBJECT")
    pose = present(rig.pose)
    for pose_bone in pose.bones:
        pose_bone.rotation_mode = "XYZ"
    for foot in FEET:
        constraint = require(
            pose.bones[f"lower.{foot}"].constraints.new("IK"), bpy.types.KinematicConstraint
        )
        constraint.target, constraint.subtarget = rig, f"MCH_pastern.{foot}"
        constraint.chain_count, constraint.use_stretch = 2, False
        constraint.pole_target, constraint.pole_subtarget = rig, f"CTRL_pole.{foot}"
        for part in ("pastern", "paw"):
            rotation = require(
                pose.bones[f"{part}.{foot}"].constraints.new("COPY_ROTATION"),
                bpy.types.CopyRotationConstraint,
            )
            rotation.target, rotation.subtarget = rig, f"MCH_{part}.{foot}"
            rotation.target_space = rotation.owner_space = "WORLD"
    for control, joint_name in ROTATIONS.items():
        rotation = require(
            pose.bones[joint_name].constraints.new("COPY_ROTATION"),
            bpy.types.CopyRotationConstraint,
        )
        rotation.target, rotation.subtarget = rig, control
        rotation.target_space = rotation.owner_space = "LOCAL"
    # Calibrate against the actual native rest knee, avoiding bone-roll conventions.
    # Two orthogonal samples give the rotation basis of Blender's pole control.
    for foot in FEET:
        upper = pose.bones[f"upper.{foot}"]
        constraint = require(
            pose.bones[f"lower.{foot}"].constraints[0], bpy.types.KinematicConstraint
        )
        constraint.pole_angle = 0
        present(bpy.context.view_layer).update()
        origin = upper.head.copy()
        axis = (pose.bones[f"MCH_pastern.{foot}"].head - origin).normalized()
        zero = upper.tail.copy()
        center = origin + axis * (zero - origin).dot(axis)
        u = (zero - center).normalized()
        constraint.pole_angle = math.pi / 2
        present(bpy.context.view_layer).update()
        v = (upper.tail - center).normalized()
        desired = (upper.bone.tail_local - center).normalized()
        constraint.pole_angle = math.atan2(desired.dot(v), desired.dot(u))
        present(bpy.context.view_layer).update()
    rig.show_in_front = True
    data.display_type = "OCTAHEDRAL"
    rig["rig_family"] = "canid-actions-v3"
    rig["form"] = form.name
    return rig
