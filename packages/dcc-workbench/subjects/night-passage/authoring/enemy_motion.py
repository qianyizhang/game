"""Reviewed saved-master gesture and sickle attachment repairs; no geometry rebuild."""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from authoring_plan import save_working_source  # noqa: E402
from enemy_delivery import mesh_digest  # noqa: E402
from enemy_form import tube  # noqa: E402
from enemy_rig import FPS, Kind, arm_points  # noqa: E402
from hero_rig import activate  # noqa: E402
from native_types import mesh_data, present, require  # noqa: E402

if TYPE_CHECKING:
    import bpy


def sickle(source: Path) -> None:
    import bpy

    bpy.ops.wm.open_mainfile(filepath=str(source))
    if present(bpy.context.scene)["enemy_kind"] != "hunter":
        raise ValueError("Sickle repair requires the saved hunter")
    obj = bpy.data.objects["Sickle_grip"]
    old = mesh_data(obj)
    materials = list(old.materials)
    groups = [group.name for group in obj.vertex_groups]
    weights = [[(group.group, group.weight) for group in vertex.groups] for vertex in old.vertices]
    _, _, wrist, palm = arm_points("hunter", "R")
    replacement = tube(
        "Sickle_grip_repair", [(palm, 0.026, 0.026), ((0.67, wrist[1], 1.035), 0.026, 0.026)], 8
    )
    if len(old.vertices) != len(mesh_data(replacement).vertices):
        raise ValueError("Attachment repair changed fitted weight indexing")
    obj.data = replacement.data
    obj.vertex_groups.clear()
    for name in groups:
        obj.vertex_groups.new(name=name)
    for mat in materials:
        mesh_data(obj).materials.append(mat)
    for index, entries in enumerate(weights):
        for group, weight in entries:
            obj.vertex_groups[group].add([index], weight, "REPLACE")
    bpy.data.objects.remove(replacement, do_unlink=True)
    if old.users == 0:
        bpy.data.meshes.remove(old)
    save_working_source(source)


def sagittal(bone: bpy.types.PoseBone, angle: float) -> None:
    from mathutils import Quaternion, Vector

    axis = bone.bone.matrix_local.to_3x3().inverted() @ Vector((0, 1, 0))
    bone.rotation_euler = Quaternion(axis, angle).to_euler("XYZ")


def draw_control(rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Vector

    data = require(rig.data, bpy.types.Armature)
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    hand = data.edit_bones["hand.L"]
    target = data.edit_bones.new("CTRL_draw")
    target.head, target.tail = hand.head, hand.head + Vector((0, 0.1, 0))
    target.parent, target.use_deform = data.edit_bones["CTRL_body"], False
    orientation = data.edit_bones.new("MCH_draw_orientation")
    orientation.head, orientation.tail, orientation.roll = hand.head, hand.tail, hand.roll
    orientation.parent, orientation.use_deform = target, False
    pole = data.edit_bones.new("POLE_draw")
    pole.head, pole.tail, pole.use_deform = (-0.4, 0.65, 1.18), (-0.4, 0.65, 1.30), False
    bpy.ops.object.mode_set(mode="OBJECT")
    pose = present(rig.pose)
    pose.bones["CTRL_draw"].rotation_mode = "XYZ"
    ik = require(pose.bones["forearm.L"].constraints.new("IK"), bpy.types.KinematicConstraint)
    ik.target, ik.subtarget, ik.chain_count, ik.use_stretch = rig, "CTRL_draw", 2, False
    ik.pole_target, ik.pole_subtarget, ik.pole_angle = rig, "POLE_draw", 0
    upper = pose.bones["arm.L"]
    present(bpy.context.view_layer).update()
    origin = upper.head.copy()
    axis = (pose.bones["CTRL_draw"].head - origin).normalized()
    zero = upper.tail.copy()
    center = origin + axis * (zero - origin).dot(axis)
    u = (zero - center).normalized()
    ik.pole_angle = math.pi / 2
    present(bpy.context.view_layer).update()
    v = (upper.tail - center).normalized()
    desired = (upper.bone.tail_local - center).normalized()
    ik.pole_angle = math.atan2(desired.dot(v), desired.dot(u))
    rotation = require(
        pose.bones["hand.L"].constraints.new("COPY_ROTATION"), bpy.types.CopyRotationConstraint
    )
    rotation.target, rotation.subtarget = rig, "MCH_draw_orientation"
    rotation.owner_space = rotation.target_space = "WORLD"


def attack(source: Path, kind: Kind) -> None:
    import bpy

    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    if scene["enemy_kind"] != kind:
        raise ValueError("Source kind does not match the reviewed attack")
    before = mesh_digest()
    rig = bpy.data.objects["EnemyRig"]
    rig.animation_data_create().action = bpy.data.actions["attack"]
    scene.frame_set(0)
    if kind == "archer":
        draw_control(rig)
    pose = present(rig.pose)
    controls = [bone for bone in pose.bones if not bone.name.startswith(("MCH_", "POLE_"))]
    for frame in range(FPS + 1):
        t = frame / FPS
        for bone in controls:
            bone.location, bone.rotation_euler = (0, 0, 0), (0, 0, 0)
        if kind == "brute":
            if t <= 0.30:
                angle = -1.15 * math.sin(math.pi / 2 * t / 0.30)
            elif t < 13 / 30:
                angle = -1.15 + 1.35 * ((t - 0.30) / (13 / 30 - 0.30)) ** 2
            elif t <= 14 / 30:
                angle = 0.20
            else:
                angle = 0.20 * (1 - (t - 14 / 30) / (1 - 14 / 30)) ** 2
            sagittal(pose.bones["arm.R"], angle)
            pose.bones["CTRL_body"].location.z = -0.018 * max(0, 1 - abs(t - 0.45) / 0.15)
            pose.bones["arm.L"].rotation_euler.x = -0.12 * math.sin(math.pi * t)
        else:
            pull = (
                math.sin(math.pi / 2 * t / 0.35)
                if t < 0.35
                else 1.0
                if t <= 13 / 30
                else max(0, 1 - (t - 13 / 30) / 0.10)
            )
            pose.bones["CTRL_draw"].location = (-0.26 * pull, 0.06 * pull, 0.16 * pull)
            pose.bones["head"].rotation_euler.y = -0.02 * pull
        for bone in controls:
            for channel in ("location", "rotation_euler", "scale"):
                bone.keyframe_insert(channel, frame=frame, group=bone.name)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    scene.frame_set(0)
    if mesh_digest() != before:
        raise ValueError("Attack fitting changed meshes or weights")
    save_working_source(source)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument(
        "--command", choices=["sickle-grip", "brute-attack", "archer-attack"], required=True
    )
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    if args.command == "sickle-grip":
        sickle(args.source.resolve())
    else:
        attack(args.source.resolve(), "brute" if args.command == "brute-attack" else "archer")


if __name__ == "__main__":
    main()
