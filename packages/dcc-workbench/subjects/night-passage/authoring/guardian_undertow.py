"""Undertow: a low shell-backed tide guardian with webbed limbs and fin counter-motion."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from enemy_form import bind_rows, plate, tube
from enemy_rig import arm_points
from enemy_rig import author as author_base
from enemy_rig import make_rig as make_base
from guardian_catalog import ATTACKS
from hero_form import bind, loft, material, rigid, transition
from hero_rig import activate
from native_types import present, require

if TYPE_CHECKING:
    import bpy


def make_rig() -> bpy.types.Object:
    import bpy

    rig = make_base("brute")
    rig.name = "GuardianRig"
    activate(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    data = require(rig.data, bpy.types.Armature)
    for name, head, tail, parent in [
        ("fin.L", (-0.12, 0.30, 1.14), (-0.22, 0.55, 1.35), "chest"),
        ("fin.R", (-0.12, -0.30, 1.14), (-0.22, -0.55, 1.35), "chest"),
        ("tail", (-0.22, 0, 0.84), (-0.56, 0, 0.54), "pelvis"),
    ]:
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        bone.parent = data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    for pose_bone in present(rig.pose).bones:
        pose_bone.rotation_mode = "XYZ"
    rig["authoring"] = (
        "Planted-foot humanoid IK; shell-backed torso, FK fins and tail. X-forward, Z-up."
    )
    return rig


def build(rig: bpy.types.Object) -> None:
    skin = material("Tide skin · blue-green", (0.045, 0.23, 0.27), 0.78)
    shell = material("Carapace · deep sea enamel", (0.025, 0.095, 0.15), 0.48, 0.18)
    fin = material("Fins · weathered turquoise", (0.085, 0.36, 0.37), 0.8)
    ivory = material("Throat · pale sea stone", (0.56, 0.72, 0.65), 0.78)
    dark = material("Recesses · abyssal ink", (0.009, 0.025, 0.034), 0.92)
    eye = material("Eyes · amber", (0.88, 0.46, 0.10), 0.38)
    ridge = material("Shell ridge · sea glass", (0.14, 0.40, 0.41), 0.5, 0.12)
    # A joined forward-heavy body replaces the bell construct's upright silhouette.
    body = loft(
        "Tidal_body",
        [
            ((0, 0, 0.53), 0.20, 0.23),
            ((0.02, 0, 0.71), 0.25, 0.28),
            ((0.07, 0, 0.93), 0.34, 0.33),
            ((0.14, 0, 1.08), 0.39, 0.34),
            ((0.17, 0, 1.20), 0.40, 0.31),
            ((0.12, 0, 1.32), 0.29, 0.25),
            ((0.02, 0, 1.38), 0.16, 0.17),
        ],
        20,
    )
    bind(body, rig, skin, transition("chest", "head", 1.02, 1.23))
    throat = loft(
        "Pale_throat",
        [
            ((0.17, 0, 0.64), 0.055, 0.14),
            ((0.28, 0, 0.82), 0.065, 0.21),
            ((0.40, 0, 1.02), 0.10, 0.25),
            ((0.46, 0, 1.12), 0.10, 0.26),
            ((0.47, 0, 1.16), 0.085, 0.24),
        ],
        16,
    )
    bind(throat, rig, ivory, transition("chest", "head", 1.00, 1.16))
    back = loft(
        "Tidal_carapace",
        [
            ((-0.17, 0, 0.72), 0.18, 0.27),
            ((-0.25, 0, 0.90), 0.23, 0.35),
            ((-0.24, 0, 1.15), 0.27, 0.36),
            ((-0.19, 0, 1.34), 0.22, 0.29),
            ((-0.08, 0, 1.46), 0.12, 0.17),
            ((-0.015, 0, 1.49), 0.03, 0.055),
        ],
        20,
    )
    bind(back, rig, shell, rigid("chest"))
    spine = tube(
        "Shell_keel",
        [
            ((-0.32, 0, 0.79), 0.035, 0.055),
            ((-0.48, 0, 1.03), 0.04, 0.065),
            ((-0.45, 0, 1.25), 0.035, 0.055),
            ((-0.15, 0, 1.47), 0.025, 0.025),
        ],
        10,
    )
    bind(spine, rig, ridge, rigid("chest"))
    for side, sign in [("L", 1), ("R", -1)]:
        y = sign * 0.25
        leg = tube(
            f"Tidal_leg_{side}",
            [
                ((0, y, 0.13), 0.095, 0.09),
                ((0.09, y, 0.37), 0.13, 0.12),
                ((0, y, 0.67), 0.16, 0.14),
            ],
            12,
        )
        bind(leg, rig, skin, transition(f"shin.{side}", f"thigh.{side}", 0.29, 0.48))
        foot = loft(
            f"Webbed_foot_{side}",
            [
                ((0.13, y, 0.025), 0.25, 0.17),
                ((0.16, y, 0.07), 0.28, 0.18),
                ((0.11, y, 0.13), 0.23, 0.155),
                ((0, y, 0.21), 0.10, 0.10),
            ],
            14,
        )
        bind(foot, rig, fin, rigid(f"foot.{side}"))
        root, elbow, wrist, palm = arm_points("brute", side)
        arm = tube(
            f"Tidal_arm_{side}",
            [(root, 0.14, 0.15), (elbow, 0.11, 0.13), (wrist, 0.10, 0.11), (palm, 0.13, 0.10)],
            12,
        )
        bind_rows(
            arm,
            rig,
            skin,
            [
                {f"arm.{side}": 1},
                {f"arm.{side}": 0.5, f"forearm.{side}": 0.5},
                {f"forearm.{side}": 0.6, f"hand.{side}": 0.4},
                {f"hand.{side}": 1},
            ],
            12,
        )
        hand = loft(
            f"Webbed_palm_{side}",
            [
                ((0.46, sign * 0.47, 0.89), 0.15, 0.11),
                ((0.55, sign * 0.47, 0.95), 0.20, 0.15),
                ((0.52, sign * 0.47, 1.00), 0.17, 0.13),
            ],
            12,
        )
        bind(hand, rig, fin, rigid(f"hand.{side}"))
        # Swept fins have thickness and emerge from fitted shoulder roots.
        frill = plate(
            f"Shoulder_fin_{side}",
            [
                (-0.13, 1.13),
                (-0.10, 1.32),
                (-0.37, 1.54 if side == "L" else 1.43),
                (-0.32, 1.20),
                (-0.56, 0.95),
                (-0.28, 1.00),
            ],
            sign * 0.37,
            0.10,
        )
        bind(frill, rig, fin, rigid(f"fin.{side}"))
        brow = tube(
            f"Brow_{side}",
            [
                ((0.48, sign * 0.11, 1.29), 0.046, 0.042),
                ((0.52, sign * 0.21, 1.27), 0.05, 0.043),
                ((0.43, sign * 0.30, 1.23), 0.04, 0.035),
            ],
            10,
        )
        bind(brow, rig, skin, rigid("head"))
        socket = loft(
            f"Eye_socket_{side}",
            [
                ((0.535, sign * 0.205, 1.19), 0.036, 0.057),
                ((0.548, sign * 0.205, 1.235), 0.04, 0.06),
                ((0.52, sign * 0.205, 1.265), 0.028, 0.04),
            ],
            12,
        )
        bind(socket, rig, dark, rigid("head"))
        iris = loft(
            f"Amber_eye_{side}",
            [
                ((0.564, sign * 0.205, 1.218), 0.022, 0.03),
                ((0.57, sign * 0.205, 1.238), 0.025, 0.031),
                ((0.552, sign * 0.205, 1.255), 0.018, 0.023),
            ],
            12,
        )
        bind(iris, rig, eye, rigid("head"))
        for n in range(2):
            gill = tube(
                f"Gill_{side}_{n}",
                [
                    ((0.28 - n * 0.09, sign * 0.325, 1.12), 0.012, 0.014),
                    ((0.22 - n * 0.08, sign * 0.34, 0.99), 0.014, 0.016),
                ],
                6,
            )
            bind(gill, rig, dark, rigid("head"))
    mouth = tube(
        "Mouth_seam",
        [
            ((0.52, -0.20, 1.105), 0.018, 0.013),
            ((0.58, 0, 1.10), 0.022, 0.014),
            ((0.52, 0.20, 1.105), 0.018, 0.013),
        ],
        10,
    )
    bind(mouth, rig, dark, rigid("head"))
    tail = tube(
        "Tail_stem",
        [
            ((-0.20, 0, 0.72), 0.15, 0.12),
            ((-0.46, 0, 0.57), 0.12, 0.095),
            ((-0.72, 0, 0.46), 0.09, 0.05),
            ((-0.88, 0, 0.54), 0.045, 0.035),
        ],
        12,
    )
    bind(tail, rig, skin, rigid("tail"))
    for sign in [-1, 1]:
        blade = tube(
            f"Tail_fluke_{sign}",
            [
                ((-0.71, 0, 0.46), 0.04, 0.035),
                ((-0.85, sign * 0.18, 0.49), 0.11, 0.035),
                ((-0.93, sign * 0.31, 0.57), 0.06, 0.02),
                ((-1.01, sign * 0.36, 0.62), 0.008, 0.008),
            ],
            10,
        )
        bind(blade, rig, fin, rigid("tail"))


def author(rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Quaternion, Vector

    author_base(rig, "brute")
    bpy.data.actions.remove(bpy.data.actions["attack"])
    scene = present(bpy.context.scene)
    pose = present(rig.pose)
    controls = [b for b in pose.bones if not b.name.startswith(("MCH_", "POLE_"))]

    def turn(name: str, axis: tuple[float, float, float], angle: float) -> None:
        bone = pose.bones[name]
        rest = bone.bone.matrix_local.to_quaternion()
        bone.rotation_euler = (rest.inverted() @ Quaternion(Vector(axis), angle) @ rest).to_euler(
            "XYZ"
        )

    for name in ATTACKS["undertow"]:
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        action["seconds"], action["loop"], action["contact_phase"] = 1.4, False, 0.45
        rig.animation_data_create().action = action
        end = 42
        for frame in range(end + 1):
            t = frame / end
            for bone in controls:
                bone.location, bone.rotation_euler = (0, 0, 0), (0, 0, 0)
            draw = (
                math.sin(math.pi / 2 * min(t / 0.33, 1))
                if t < 0.45
                else math.cos(math.pi / 2 * min((t - 0.45) / 0.55, 1))
            )
            hit = max(0, 1 - abs(t - 0.45) / 0.13)
            pose.bones["CTRL_body"].location.z = -0.035 * draw
            if name == "charge":
                turn("chest", (0, 1, 0), 0.22 * draw + 0.16 * hit)
                turn("head", (0, 1, 0), -0.12 * draw)
                turn("arm.L", (0, 0, 1), 0.65 * draw - 0.20 * hit)
                turn("arm.R", (0, 0, 1), -0.65 * draw + 0.20 * hit)
                turn("tail", (0, 1, 0), -0.20 * draw + 0.10 * hit)
            elif name == "volley":
                turn("arm.L", (0, 0, 1), -0.35 * draw + 0.80 * hit)
                turn("arm.R", (0, 0, 1), 0.35 * draw - 0.80 * hit)
                turn("forearm.L", (0, 1, 0), -0.45 * draw)
                turn("forearm.R", (0, 1, 0), -0.45 * draw)
                turn("chest", (0, 1, 0), -0.08 * draw + 0.16 * hit)
                turn("head", (0, 1, 0), -0.12 * draw + 0.12 * hit)
            else:
                turn("arm.L", (0, 0, 1), -0.20 * draw + 1.0 * hit)
                turn("arm.R", (0, 0, 1), 0.20 * draw - 1.0 * hit)
                turn("chest", (0, 1, 0), -0.08 * draw + 0.18 * hit)
                turn("tail", (0, 0, 1), 0.22 * draw - 0.40 * hit)
            turn("fin.L", (1, 0, 0), -0.12 * draw - 0.12 * hit)
            turn("fin.R", (1, 0, 0), 0.12 * draw + 0.12 * hit)
            for bone in controls:
                for channel in ("location", "rotation_euler", "scale"):
                    bone.keyframe_insert(channel, frame=frame, group=bone.name)
    # Keep the saved, fitted base walk. Add secondary fins/tail to its existing keys.
    for name in ("idle", "run"):
        action = bpy.data.actions[name]
        rig.animation_data_create().action = action
        end = round(float(action["seconds"]) * 30)
        for frame in range(end + 1):
            scene.frame_set(frame)
            wave = math.sin(frame / end * math.tau)
            turn("tail", (0, 0, 1), (0.06 if name == "idle" else 0.18) * wave)
            turn("fin.L", (1, 0, 0), 0.04 * wave)
            turn("fin.R", (1, 0, 0), -0.04 * wave)
            for key in ("tail", "fin.L", "fin.R"):
                pose.bones[key].keyframe_insert("rotation_euler", frame=frame, group=key)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    scene.frame_set(0)
