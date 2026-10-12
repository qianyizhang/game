"""Lantern bearer: fitted humanoid controls and in-place gameplay performances."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from native_types import present, require

if TYPE_CHECKING:
    import bpy

Point = tuple[float, float, float]
FPS = 30
CLIPS = {
    "idle": 2.0,
    "run": 0.6,
    "dodge": 0.5,
    "slash": 0.6,
    "thrust": 0.6,
    "shoot": 0.8,
    "guard": 0.7,
    "punch": 0.5,
    "cast": 0.8,
    "death": 1.0,
}


def activate(obj: bpy.types.Object) -> None:
    import bpy

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    present(bpy.context.view_layer).objects.active = obj


def joints() -> list[tuple[str, Point, Point, str | None]]:
    result: list[tuple[str, Point, Point, str | None]] = [
        ("pelvis", (0, 0, 1.0), (0, 0, 1.22), "CTRL_body"),
        ("chest", (0, 0, 1.22), (0.015, 0, 1.66), "pelvis"),
        ("head", (0.015, 0, 1.66), (0.035, 0, 2.05), "chest"),
        ("cape", (-0.23, 0.1, 1.62), (-0.31, 0.12, 0.95), "chest"),
    ]
    for side, sign in [("L", 1), ("R", -1)]:
        y = 0.16 * sign
        result += [
            (f"thigh.{side}", (0, y, 1.02), (0.1, y, 0.56), "pelvis"),
            (f"shin.{side}", (0.1, y, 0.56), (0, y, 0.14), f"thigh.{side}"),
            (f"foot.{side}", (0, y, 0.14), (0.22, y, 0.14), f"shin.{side}"),
            (f"arm.{side}", (0, 0.28 * sign, 1.58), (0.055, 0.4 * sign, 1.28), "chest"),
            (
                f"forearm.{side}",
                (0.055, 0.4 * sign, 1.28),
                (0.29, 0.38 * sign, 1.24),
                f"arm.{side}",
            ),
            (
                f"hand.{side}",
                (0.29, 0.38 * sign, 1.24),
                (0.4, 0.38 * sign, 1.24),
                f"forearm.{side}",
            ),
        ]
    # Blender +Z becomes glTF +Y: browser weapons retain +X forward and +Y up.
    result.append(("weapon_socket", (0.37, -0.38, 1.24), (0.37, -0.38, 1.34), "hand.R"))
    return result


def make_rig() -> bpy.types.Object:
    import bpy
    from mathutils import Vector

    data = bpy.data.armatures.new("Lantern bearer fitted skeleton")
    rig = bpy.data.objects.new("CharacterRig", data)
    present(bpy.context.scene).collection.objects.link(rig)
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, point in [
        ("CTRL_body", (0, 0, 0)),
        ("CTRL_L", (0, 0.16, 0.14)),
        ("CTRL_R", (0, -0.16, 0.14)),
    ]:
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = point, Vector(point) + Vector((0, 0.1, 0))
        bone.use_deform = False
    for name, head, tail, parent in joints():
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        bone.parent = data.edit_bones[parent] if parent else None
    for side, sign in [("L", 1), ("R", -1)]:
        rest = data.edit_bones[f"foot.{side}"]
        target = data.edit_bones.new(f"MCH_{side}")
        target.head, target.tail, target.roll = rest.head, rest.tail, rest.roll
        target.parent, target.use_deform = data.edit_bones[f"CTRL_{side}"], False
        pole = data.edit_bones.new(f"POLE_{side}")
        pole.head, pole.tail = (1, sign * 0.16, 0.55), (1, sign * 0.16, 0.7)
        pole.use_deform = False
    bpy.ops.object.mode_set(mode="OBJECT")
    pose = present(rig.pose)
    for pose_bone in pose.bones:
        pose_bone.rotation_mode = "XYZ"
    for side in ("L", "R"):
        ik = require(
            pose.bones[f"shin.{side}"].constraints.new("IK"), bpy.types.KinematicConstraint
        )
        ik.target, ik.subtarget, ik.chain_count = rig, f"MCH_{side}", 2
        ik.use_stretch = False
        ik.pole_target, ik.pole_subtarget = rig, f"POLE_{side}"
        rotation = require(
            pose.bones[f"foot.{side}"].constraints.new("COPY_ROTATION"),
            bpy.types.CopyRotationConstraint,
        )
        rotation.target, rotation.subtarget = rig, f"MCH_{side}"
        rotation.owner_space = rotation.target_space = "WORLD"
        upper = pose.bones[f"thigh.{side}"]
        ik.pole_angle = 0
        present(bpy.context.view_layer).update()
        origin = upper.head.copy()
        axis = (pose.bones[f"MCH_{side}"].head - origin).normalized()
        zero = upper.tail.copy()
        center = origin + axis * (zero - origin).dot(axis)
        u = (zero - center).normalized()
        ik.pole_angle = math.pi / 2
        present(bpy.context.view_layer).update()
        v = (upper.tail - center).normalized()
        desired = (upper.bone.tail_local - center).normalized()
        ik.pole_angle = math.atan2(desired.dot(v), desired.dot(u))
    rig.show_in_front = True
    rig["authoring"] = "Editable FK torso/arms/cape and planted-foot IK; in-place game motion"
    return rig


def author(rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Euler

    scene = present(bpy.context.scene)
    scene.render.fps = FPS
    pose = present(rig.pose)
    controls = [b for b in pose.bones if not b.name.startswith(("MCH_", "POLE_"))]
    for name, seconds in CLIPS.items():
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        action["seconds"] = seconds
        action["loop"] = name in ("idle", "run")
        action["contact_phase"] = 0.45
        rig.animation_data_create().action = action
        end = round(seconds * FPS)
        for frame in range(end + 1):
            t = frame / end
            for bone in controls:
                bone.location = (0, 0, 0)
                bone.rotation_euler = (0, 0, 0)
            body = pose.bones["CTRL_body"]
            chest, head, cape = (pose.bones[n] for n in ("chest", "head", "cape"))
            pulse = math.sin(t * math.tau)
            if name == "idle":
                chest.rotation_euler.x = 0.025 * pulse
                head.rotation_euler.z = 0.045 * math.sin(t * math.tau)
                cape.rotation_euler.x = 0.035 * math.sin(t * math.tau - 0.5)
            elif name == "run":
                body.location.z = -0.075 + 0.035 * math.cos(t * math.tau * 2)
                chest.rotation_euler.x = 0.12
                chest.rotation_euler.z = 0.12 * pulse
                cape.rotation_euler.x = -0.25 + 0.10 * math.sin(t * math.tau - 0.6)
                for side, offset in [("L", 0), ("R", 0.5)]:
                    phase = (t + offset) % 1
                    # 60% planted stance; flight returns smoothly without root travel.
                    x = (
                        0.38 - phase / 0.6 * 0.76
                        if phase < 0.6
                        else -0.38 + (phase - 0.6) / 0.4 * 0.76
                    )
                    z = 0 if phase < 0.6 else 0.25 * math.sin((phase - 0.6) / 0.4 * math.pi)
                    pose.bones[f"CTRL_{side}"].location = (x, 0, z)
                    pose.bones[f"arm.{side}"].rotation_euler.x = (
                        (-1 if side == "L" else 1) * 0.6 * pulse
                    )
            elif name == "dodge":
                ease = math.sin(math.pi * t)
                body.location.z = -0.24 * ease
                chest.rotation_euler.x = 0.6 * ease
                cape.rotation_euler.x = -0.45 * ease
                pose.bones["arm.L"].rotation_euler.x = -0.5 * ease
                pose.bones["arm.R"].rotation_euler.x = -0.35 * ease
            elif name == "death":
                ease = math.sin(min(t / 0.75, 1) * math.pi / 2)
                body.location.z = -0.45 * ease
                chest.rotation_euler.x = 0.65 * ease
                head.rotation_euler.x = 0.45 * ease
                pose.bones["arm.L"].rotation_euler.x = -0.35 * ease
                pose.bones["arm.R"].rotation_euler.x = -0.35 * ease
            else:
                # Anticipation peaks before the .45 contact/release; recover to rest.
                anticipation = math.sin(math.pi * min(t / 0.38, 1))
                hit = max(0, 1 - abs(t - 0.45) / 0.16)
                follow = math.sin(math.pi * max(0, (t - 0.45) / 0.55))
                right = pose.bones["arm.R"]
                fore = pose.bones["forearm.R"]
                left = pose.bones["arm.L"]
                body.location.z = -0.06 * (anticipation + hit)
                if name == "slash":
                    chest.rotation_euler.z = -0.45 * anticipation + 0.45 * (hit + 0.4 * follow)
                    right.rotation_euler.z = -0.8 * anticipation + 0.95 * hit
                    right.rotation_euler.x = 0.45 * anticipation + 0.2 * hit
                    fore.rotation_euler.z = 0.35 * anticipation - 0.25 * hit
                elif name in ("thrust", "punch"):
                    right.rotation_euler.x = -0.5 * anticipation + 1.0 * hit
                    fore.rotation_euler.x = 0.6 * anticipation - 0.3 * hit
                    chest.rotation_euler.x = 0.22 * hit
                    left.rotation_euler.x = -0.35 * hit
                elif name == "shoot":
                    draw = math.sin(math.pi * min(t / 0.9, 1))
                    right.rotation_euler.x = 0.75 * draw
                    left.rotation_euler.x = 0.65 * draw
                    left.rotation_euler.z = -0.8 * draw
                    pose.bones["forearm.L"].rotation_euler.z = 0.6 * draw
                    chest.rotation_euler.z = -0.2 * draw
                elif name == "guard":
                    right.rotation_euler.x = 0.9 * (anticipation + hit)
                    right.rotation_euler.z = 0.3 * anticipation
                    chest.rotation_euler.x = 0.25 * hit
                elif name == "cast":
                    left.rotation_euler.x = 1.4 * (anticipation + 0.8 * hit)
                    left.rotation_euler.z = -0.4 * anticipation
                    head.rotation_euler.x = -0.15 * anticipation
                cape.rotation_euler.x = -0.16 * follow
            for bone in controls:
                # Author pitch/yaw in character space, then convert into each
                # fitted joint's local rest basis (limbs do not share those axes).
                pitch, yaw = bone.rotation_euler.x, bone.rotation_euler.z
                if bone.name.startswith(("arm.", "forearm.")) or bone.name == "cape":
                    pitch = -pitch
                rest = bone.bone.matrix_local.to_quaternion()
                world = Euler((0, pitch, yaw), "XYZ").to_quaternion()
                bone.rotation_euler = (rest.inverted() @ world @ rest).to_euler("XYZ")
                for channel in ("location", "rotation_euler"):
                    bone.keyframe_insert(channel, frame=frame, group=bone.name)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    scene.frame_start, scene.frame_end = 0, 60
    scene.frame_set(0)
