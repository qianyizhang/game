"""Canid family skeleton, animator controls, and one-time source motion authoring."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import TYPE_CHECKING

from native_types import present, require

if TYPE_CHECKING:
    import bpy

Point = tuple[float, float, float]
FEET = ("front.L", "front.R", "hind.L", "hind.R")
CONTROLS = ("CTRL_body", "CTRL_head", "CTRL_tail", *(f"CTRL_{f}" for f in FEET))
CLIPS = {"idle": 96, "walk": 48, "look": 96}
FPS = 24


@dataclass(frozen=True)
class Form:
    name: str
    length: float = 1.0
    height: float = 1.0
    width: float = 1.0
    stride: float = 1.0

    def point(self, point: Point) -> Point:
        x, y, z = point
        # Keep soles at the ground and paw volume intact while shortening the limbs.
        return (x * self.length, y * self.width, 0.12 + (z - 0.12) * self.height)


FORMS = (Form("ash"), Form("russet"), Form("moss", 1.07, 0.77, 1.22, 0.77))


@dataclass(frozen=True)
class Joint:
    name: str
    head: Point
    tail: Point
    parent: str | None


def joints(form: Form) -> list[Joint]:
    raw = [
        Joint("pelvis", (-0.65, 0, 1.24), (-0.12, 0, 1.3), "CTRL_body"),
        Joint("spine", (-0.12, 0, 1.3), (0.59, 0, 1.36), "pelvis"),
        Joint("neck", (0.59, 0, 1.36), (1.03, 0, 1.68), "spine"),
        Joint("head", (1.03, 0, 1.68), (1.66, 0, 1.63), "neck"),
    ]
    for foot in FEET:
        front = foot.startswith("front")
        y = 0.26 if foot.endswith("L") else -0.26
        hip = (0.62, y, 1.32) if front else (-0.68, y, 1.24)
        knee = (0.47, y, 0.81) if front else (-0.42, y, 0.83)
        ankle = (0.65, y, 0.22) if front else (-0.83, y, 0.25)
        toe = (ankle[0] + 0.17, y, 0.1)
        raw.extend(
            [
                Joint(f"upper.{foot}", hip, knee, "spine" if front else "pelvis"),
                Joint(f"lower.{foot}", knee, ankle, f"upper.{foot}"),
                Joint(f"paw.{foot}", ankle, toe, f"lower.{foot}"),
            ]
        )
    points = [
        (-0.9, 0, 1.28),
        (-1.2, 0, 1.12),
        (-1.49, 0.02, 0.86),
        (-1.69, 0.04, 0.57),
        (-1.73, 0.08, 0.36),
    ]
    for i in range(4):
        raw.append(
            Joint(f"tail.{i}", points[i], points[i + 1], "pelvis" if i == 0 else f"tail.{i - 1}")
        )
    return [Joint(j.name, form.point(j.head), form.point(j.tail), j.parent) for j in raw]


def activate(obj: bpy.types.Object) -> None:
    import bpy

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    present(bpy.context.view_layer).objects.active = obj


def make_rig(form: Form, name: str = "CharacterRig") -> bpy.types.Object:
    import bpy
    from mathutils import Vector

    data = bpy.data.armatures.new("Canid family v1")
    rig = bpy.data.objects.new(name, data)
    present(bpy.context.scene).collection.objects.link(rig)
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    definitions = joints(form)
    controls: dict[str, Point] = {
        "CTRL_body": form.point((0, 0, 1.25)),
        "CTRL_head": form.point((1.1, 0, 1.85)),
        "CTRL_tail": form.point((-1.4, 0, 1.4)),
    }
    for foot in FEET:
        controls[f"CTRL_{foot}"] = next(j.head for j in definitions if j.name == f"paw.{foot}")
    for key, point in controls.items():
        bone = data.edit_bones.new(key)
        bone.head = point
        bone.tail = Vector(point) + Vector((0, 0, 0.2))
        bone.use_deform = False
    for joint in definitions:
        bone = data.edit_bones.new(joint.name)
        bone.head, bone.tail = joint.head, joint.tail
        bone.parent = data.edit_bones[joint.parent] if joint.parent else None
    bpy.ops.object.mode_set(mode="OBJECT")
    pose = present(rig.pose)
    for pose_bone in pose.bones:
        pose_bone.rotation_mode = "XYZ"
    for foot in FEET:
        constraint = require(
            pose.bones[f"lower.{foot}"].constraints.new("IK"), bpy.types.KinematicConstraint
        )
        constraint.target = rig
        constraint.subtarget = f"CTRL_{foot}"
        constraint.chain_count = 2
        constraint.use_stretch = False
    # Foot orientation targets match the actual rest axes, independent of the leg chain.
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    for foot in FEET:
        source = data.edit_bones[f"paw.{foot}"]
        bone = data.edit_bones.new(f"SOLE_{foot}")
        bone.head, bone.tail = source.head.copy(), source.tail.copy()
        bone.use_deform = False
    bpy.ops.object.mode_set(mode="OBJECT")
    for foot in FEET:
        paw = require(
            present(rig.pose).bones[f"paw.{foot}"].constraints.new("COPY_ROTATION"),
            bpy.types.CopyRotationConstraint,
        )
        paw.target = rig
        paw.subtarget = f"SOLE_{foot}"
        paw.target_space = "WORLD"
        paw.owner_space = "WORLD"
    for name, control in [("head", "CTRL_head"), ("tail.0", "CTRL_tail")]:
        rotation_constraint = require(
            present(rig.pose).bones[name].constraints.new("COPY_ROTATION"),
            bpy.types.CopyRotationConstraint,
        )
        rotation_constraint.target = rig
        rotation_constraint.subtarget = control
        rotation_constraint.target_space = "LOCAL"
        rotation_constraint.owner_space = "LOCAL"
    rig.show_in_front = True
    data.display_type = "OCTAHEDRAL"
    rig["rig_family"] = "canid-v1"
    rig["form"] = form.name
    return rig


def reset_controls(rig: bpy.types.Object) -> None:
    for name in CONTROLS:
        bone = present(rig.pose).bones[name]
        bone.location = (0, 0, 0)
        bone.rotation_euler = (0, 0, 0)


def author_motion(rig: bpy.types.Object) -> None:
    """Bootstrap only: creates the shared actions, never called by fit or export."""
    import bpy

    scene = present(bpy.context.scene)
    scene.render.fps = FPS
    for clip, end in CLIPS.items():
        rig.animation_data_clear()
        action = bpy.data.actions.new(clip)
        action.use_fake_user = True
        rig.animation_data_create().action = action
        for frame in range(end + 1):
            reset_controls(rig)
            p = frame / end
            cycle = 2 * math.pi * p
            pose = present(rig.pose)
            if clip == "walk":
                pose.bones["CTRL_body"].location.z = 0.015 * (1 - math.cos(2 * cycle))
                pose.bones["CTRL_body"].rotation_euler.y = 0.015 * math.sin(cycle)
                offsets = (0, 0.5, 0.75, 0.25)
                for foot, offset in zip(FEET, offsets, strict=True):
                    phase = (p + offset) % 1
                    stance = 0.62
                    if phase < stance:
                        x, z = 0.25 - 0.5 * phase / stance, 0.0
                    else:
                        swing = (phase - stance) / (1 - stance)
                        x = -0.25 + 0.5 * (swing - math.sin(2 * math.pi * swing) / (2 * math.pi))
                        z = 0.13 * math.sin(math.pi * swing) ** 2
                    pose.bones[f"CTRL_{foot}"].location = (x, 0, z)
                pose.bones["CTRL_head"].rotation_euler.z = 0.018 * math.sin(cycle)
                pose.bones["CTRL_tail"].rotation_euler.z = 0.07 * math.sin(cycle - 0.5)
            else:
                pose.bones["CTRL_body"].location.z = 0.007 * (1 - math.cos(cycle))
                amount = (1 - math.cos(cycle)) / 2
                pose.bones["CTRL_head"].rotation_euler.z = (
                    0.34 if clip == "look" else 0.04
                ) * amount
                pose.bones["CTRL_head"].rotation_euler.x = (
                    0.07 if clip == "look" else 0.018
                ) * math.sin(cycle)
                pose.bones["CTRL_tail"].rotation_euler.z = 0.06 * math.sin(cycle)
            for name in CONTROLS:
                bone = pose.bones[name]
                bone.keyframe_insert("location", frame=frame, group=name)
                bone.keyframe_insert("rotation_euler", frame=frame, group=name)
        action["clip"] = clip
        action["end_frame"] = end
        action["travel_speed"] = 0.5 / (0.62 * end / FPS) if clip == "walk" else 0.0
    scene.frame_start, scene.frame_end = 0, 96
    scene.frame_set(0)
