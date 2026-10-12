"""Four fitted enemy skeletons and distinct in-place authored performances."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING, Literal

from hero_rig import Point
from hero_rig import activate as activate
from native_types import present, require

if TYPE_CHECKING:
    import bpy

Kind = Literal["hunter", "archer", "brute", "witch"]
KINDS: tuple[Kind, ...] = ("hunter", "archer", "brute", "witch")
FPS = 30
CLIPS = ("idle", "run", "attack", "stagger")


def dimensions(kind: Kind) -> tuple[float, float, float, float]:
    """Hip, shoulder, shoulder half-width and foot stance: model units."""
    return {
        "hunter": (0.64, 1.20, 0.23, 0.14),
        "archer": (0.72, 1.34, 0.19, 0.115),
        "brute": (0.64, 1.29, 0.43, 0.25),
        "witch": (0.68, 1.20, 0.24, 0.14),
    }[kind]


def arm_points(kind: Kind, side: str) -> tuple[Point, Point, Point, Point]:
    _, shoulder, width, _ = dimensions(kind)
    sign = 1 if side == "L" else -1
    root: Point = (-0.03, sign * width, shoulder)
    if kind == "archer":
        return (
            root,
            (0.10, sign * 0.29, 1.08),
            (0.42 if side == "L" else 0.54, -0.18 if side == "L" else -0.22, 1.10),
            (0.47 if side == "L" else 0.59, -0.18 if side == "L" else -0.22, 1.10),
        )
    elbow: Point = (0.08, sign * (width + 0.06), shoulder - 0.28)
    wrist: Point = (0.34, sign * (width + 0.02), shoulder - 0.34)
    return root, elbow, wrist, (wrist[0] + 0.10, wrist[1], wrist[2])


def make_rig(kind: Kind) -> bpy.types.Object:
    import bpy
    from mathutils import Vector

    hip, shoulder, width, stance = dimensions(kind)
    data = bpy.data.armatures.new(f"{kind.title()} fitted skeleton")
    rig = bpy.data.objects.new("EnemyRig", data)
    present(bpy.context.scene).collection.objects.link(rig)
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, point in [
        ("CTRL_body", (0, 0, 0)),
        ("CTRL_L", (0, stance, 0.12)),
        ("CTRL_R", (0, -stance, 0.12)),
    ]:
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = point, Vector(point) + Vector((0, 0.10, 0))
        bone.use_deform = False
    head_x = 0.20 if kind in ("hunter", "brute") else 0.01
    head_z = 1.45 if kind == "brute" else 1.59 if kind == "hunter" else 1.72
    joints: list[tuple[str, Point, Point, str]] = [
        ("pelvis", (0, 0, hip), (0, 0, hip + 0.21), "CTRL_body"),
        ("chest", (0, 0, hip + 0.21), (-0.03, 0, shoulder), "pelvis"),
        ("head", (0.04, 0, shoulder), (head_x, 0, head_z), "chest"),
        ("cloth", (-0.14, 0.10, shoulder), (-0.26, 0.11, 0.45), "chest"),
    ]
    for side, sign in [("L", 1), ("R", -1)]:
        y = sign * stance
        root, elbow, wrist, palm = arm_points(kind, side)
        joints += [
            (f"thigh.{side}", (0, y, hip), (0.09, y, 0.37), "pelvis"),
            (f"shin.{side}", (0.09, y, 0.37), (0, y, 0.12), f"thigh.{side}"),
            (f"foot.{side}", (0, y, 0.12), (0.20, y, 0.12), f"shin.{side}"),
            (f"arm.{side}", root, elbow, "chest"),
            (f"forearm.{side}", elbow, wrist, f"arm.{side}"),
            (f"hand.{side}", wrist, palm, f"forearm.{side}"),
        ]
    for name, head, tail, parent in joints:
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        bone.parent = data.edit_bones[parent]
    for side, sign in [("L", 1), ("R", -1)]:
        foot = data.edit_bones[f"foot.{side}"]
        target = data.edit_bones.new(f"MCH_{side}")
        target.head, target.tail, target.roll = foot.head, foot.tail, foot.roll
        target.parent, target.use_deform = data.edit_bones[f"CTRL_{side}"], False
        pole = data.edit_bones.new(f"POLE_{side}")
        pole.head, pole.tail = (1, sign * stance, 0.40), (1, sign * stance, 0.55)
        pole.use_deform = False
    bpy.ops.object.mode_set(mode="OBJECT")
    pose = present(rig.pose)
    for pose_bone in pose.bones:
        pose_bone.rotation_mode = "XYZ"
    if kind != "witch":
        for side in ("L", "R"):
            ik = require(
                pose.bones[f"shin.{side}"].constraints.new("IK"), bpy.types.KinematicConstraint
            )
            ik.target, ik.subtarget, ik.chain_count, ik.use_stretch = rig, f"MCH_{side}", 2, False
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
    rig["kind"] = kind
    rig["authoring"] = "Fitted FK cloth/torso/arms; planted-foot IK except floating witch"
    return rig


def seconds(kind: Kind, clip: str) -> float:
    return {
        "idle": 2.0,
        "run": {"brute": 1.0, "witch": 1.2}.get(kind, 0.8),
        "attack": 1.0,
        "stagger": 0.5,
    }[clip]


def author(rig: bpy.types.Object, kind: Kind) -> None:
    import bpy

    scene = present(bpy.context.scene)
    scene.render.fps = FPS
    pose = present(rig.pose)
    controls = [bone for bone in pose.bones if not bone.name.startswith(("MCH_", "POLE_"))]
    for name in CLIPS:
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        action["seconds"], action["loop"], action["contact_phase"] = (
            seconds(kind, name),
            name in ("idle", "run"),
            0.45,
        )
        rig.animation_data_create().action = action
        end = round(seconds(kind, name) * FPS)
        for frame in range(end + 1):
            t = frame / end
            for bone in controls:
                bone.location, bone.rotation_euler = (0, 0, 0), (0, 0, 0)
            body, chest, head, cloth = (
                pose.bones[n] for n in ("CTRL_body", "chest", "head", "cloth")
            )
            wave = math.sin(t * math.tau)
            if name == "idle":
                chest.rotation_euler.x = 0.018 * wave
                head.rotation_euler.y = (0.035 if kind != "brute" else 0.018) * wave
                cloth.rotation_euler.x = 0.025 * math.sin(t * math.tau - 0.4)
                if kind == "witch":
                    body.location.z = 0.035 * (1 - math.cos(t * math.tau))
            elif name == "run":
                if kind == "witch":
                    body.location.z = 0.055 * (1 - math.cos(t * math.tau))
                    chest.rotation_euler.y = 0.10 * wave
                    cloth.rotation_euler.x = -0.10 + 0.04 * wave
                    pose.bones["arm.R"].rotation_euler.z = 0.10 * math.sin(t * math.tau - 0.5)
                else:
                    stride = 0.12 if kind == "brute" else 0.20
                    body.location.z = -0.025 + 0.01 * math.cos(t * math.tau * 2)
                    chest.rotation_euler.y = (0.055 if kind == "brute" else 0.08) * wave
                    cloth.rotation_euler.x = -0.12 + 0.04 * wave
                    for side, offset in [("L", 0), ("R", 0.5)]:
                        phase = (t + offset) % 1
                        x = (
                            stride - phase / 0.6 * stride * 2
                            if phase < 0.6
                            else -stride + (phase - 0.6) / 0.4 * stride * 2
                        )
                        z = (
                            0
                            if phase < 0.6
                            else (0.06 if kind == "brute" else 0.10)
                            * math.sin((phase - 0.6) / 0.4 * math.pi)
                        )
                        pose.bones[f"CTRL_{side}"].location = (x, 0, z)
                        if kind != "archer":
                            pose.bones[f"arm.{side}"].rotation_euler.x = (
                                (-1 if side == "L" else 1) * 0.16 * wave
                            )
            elif name == "attack":
                draw = (
                    math.sin(math.pi / 2 * min(t / 0.35, 1))
                    if t < 0.45
                    else math.cos(math.pi / 2 * min((t - 0.45) / 0.55, 1))
                )
                hit = max(0, 1 - abs(t - 0.45) / 0.12)
                right, fore, left = (pose.bones[n] for n in ("arm.R", "forearm.R", "arm.L"))
                if kind == "brute":
                    right.rotation_euler.x = -0.70 * draw + 0.48 * hit
                    fore.rotation_euler.z = 0.32 * draw - 0.20 * hit
                    chest.rotation_euler.x = -0.10 * draw + 0.12 * hit
                    body.location.z = -0.025 * hit
                elif kind == "hunter":
                    chest.rotation_euler.y = -0.30 * draw + 0.48 * hit
                    right.rotation_euler.z = -0.65 * draw + 0.95 * hit
                    fore.rotation_euler.z = 0.32 * draw - 0.20 * hit
                    left.rotation_euler.x = 0.20 * draw
                elif kind == "archer":
                    pose.bones["forearm.L"].rotation_euler.y = 0.45 * draw - 0.18 * hit
                    left.rotation_euler.z = -0.22 * draw
                    head.rotation_euler.y = -0.045 * draw
                else:
                    right.rotation_euler.z = 0.32 * draw - 0.45 * hit
                    fore.rotation_euler.y = 0.38 * draw
                    left.rotation_euler.x = -0.35 * draw
                    body.location.z = 0.055 * draw
                    cloth.rotation_euler.y = 0.12 * draw
            else:
                recoil = math.sin(math.pi * t)
                chest.rotation_euler.x = -0.18 * recoil
                head.rotation_euler.z = 0.16 * recoil
                pose.bones["arm.R"].rotation_euler.z = -0.20 * recoil
                cloth.rotation_euler.x = 0.12 * recoil
            for bone in controls:
                for channel in ("location", "rotation_euler", "scale"):
                    bone.keyframe_insert(channel, frame=frame, group=bone.name)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    scene.frame_start, scene.frame_end = 0, 60
    scene.frame_set(0)
