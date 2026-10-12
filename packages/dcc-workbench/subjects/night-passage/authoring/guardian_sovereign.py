"""Unlit Sovereign: broken orbital crown, faceless mask and divided void vestments."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from enemy_form import bind_rows, tube
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
    halo = data.edit_bones.new("halo")
    halo.head, halo.tail = (-0.13, 0, 1.47), (-0.13, 0, 1.72)
    halo.parent = data.edit_bones["chest"]
    bpy.ops.object.mode_set(mode="OBJECT")
    present(rig.pose).bones["halo"].rotation_mode = "XYZ"
    rig["authoring"] = "Fitted humanoid foot IK, FK mask, hands, vestments and orbital crown."
    return rig


def build(rig: bpy.types.Object) -> None:
    void = material("Vestments · midnight violet", (0.065, 0.04, 0.135), 0.92)
    fold = material("Vestment folds · bruised indigo", (0.14, 0.10, 0.25), 0.87)
    silver = material("Crown · worn moon silver", (0.55, 0.62, 0.70), 0.45, 0.70)
    ivory = material("Mask · pale porcelain", (0.70, 0.70, 0.78), 0.7)
    joint = material("Joints · dusk iron", (0.085, 0.085, 0.12), 0.65, 0.45)
    ink = material("Face · unlit seam", (0.009, 0.008, 0.025), 0.95)
    star = material("Marks · cold violet", (0.52, 0.30, 0.86), 0.55)
    shader = present(star.node_tree).nodes.get("Principled BSDF")
    if shader:
        shader.inputs["Emission Color"].default_value = (0.31, 0.08, 0.72, 1.0)
        shader.inputs["Emission Strength"].default_value = 0.35
    body = loft(
        "Vestment_body",
        [
            ((0, 0, 0.62), 0.19, 0.24),
            ((0, 0, 0.83), 0.19, 0.23),
            ((0, 0, 1.13), 0.24, 0.32),
            ((0, 0, 1.31), 0.18, 0.31),
            ((0.005, 0, 1.40), 0.10, 0.15),
        ],
        16,
    )
    bind(body, rig, void, transition("pelvis", "chest", 0.70, 0.94))
    collar = loft(
        "Silver_gorget", [((0.01, 0, 1.28), 0.13, 0.19), ((0.025, 0, 1.42), 0.095, 0.11)], 12
    )
    bind(collar, rig, silver, rigid("head"))
    mask = loft(
        "Faceless_mask",
        [
            ((0.12, 0, 1.37), 0.065, 0.04),
            ((0.16, 0, 1.46), 0.085, 0.095),
            ((0.13, 0, 1.64), 0.09, 0.145),
            ((0.09, 0, 1.73), 0.055, 0.10),
        ],
        12,
    )
    bind(mask, rig, ivory, rigid("head"))
    seam = tube(
        "Unlit_face_seam",
        [
            ((0.199, 0, 1.70), 0.009, 0.012),
            ((0.228, 0, 1.59), 0.011, 0.014),
            ((0.255, 0, 1.46), 0.006, 0.007),
        ],
        8,
    )
    bind(seam, rig, ink, rigid("head"))
    # Three unequal closed tube arcs give the crown real gaps and a visible rotation reference.
    for index, (start, end) in enumerate([(8, 82), (104, 194), (219, 342)]):
        for label, radius, width, mat in [
            ("silver", 0.43, 0.026, silver),
            ("inner", 0.388, 0.013, star),
        ]:
            rows = []
            for step in range(25):
                angle = math.radians(start + (end - start) * step / 24)
                rows.append(
                    (
                        (-0.13, radius * math.sin(angle), 1.47 + radius * math.cos(angle)),
                        width,
                        width,
                    )
                )
            arc = tube(f"Crown_{index}_{label}", rows, 8)
            bind(arc, rig, mat, rigid("halo"))
    chest_mark = loft(
        "Sternum_star",
        [
            ((0.253, 0, 0.90), 0.018, 0.008),
            ((0.262, 0, 1.04), 0.024, 0.08),
            ((0.237, 0, 1.19), 0.018, 0.008),
        ],
        4,
    )
    bind(chest_mark, rig, star, rigid("chest"))
    for side, sign in [("L", 1), ("R", -1)]:
        y = sign * 0.25
        leg = tube(
            f"Dusk_leg_{side}",
            [
                ((0, y, 0.13), 0.075, 0.08),
                ((0.09, y, 0.37), 0.095, 0.09),
                ((0, y, 0.65), 0.105, 0.115),
            ],
            10,
        )
        bind(leg, rig, joint, transition(f"shin.{side}", f"thigh.{side}", 0.29, 0.48))
        foot = loft(
            f"Silver_foot_{side}",
            [
                ((0.08, y, 0.03), 0.22, 0.10),
                ((0.12, y, 0.08), 0.26, 0.105),
                ((0, y, 0.18), 0.085, 0.085),
            ],
            12,
        )
        bind(foot, rig, silver, rigid(f"foot.{side}"))
        skirt = loft(
            f"Divided_robe_{side}",
            [
                ((-0.04, y, 0.25), 0.17, 0.17),
                ((-0.035, y, 0.49), 0.17, 0.20),
                ((0, y, 0.72), 0.15, 0.19),
                ((0, y, 0.79), 0.12, 0.16),
            ],
            12,
        )
        bind(skirt, rig, void, rigid(f"thigh.{side}"))
        mantle = loft(
            f"Tapered_mantle_{side}",
            [
                ((-0.34, sign * 0.29, 0.30), 0.02, 0.035),
                ((-0.33, sign * 0.25, 0.56), 0.035, 0.13),
                ((-0.27, sign * 0.21, 1.06), 0.045, 0.19),
                ((-0.17, sign * 0.19, 1.35), 0.06, 0.19),
            ],
            10,
        )
        bind(mantle, rig, fold, rigid("cloth"))
        root, elbow, wrist, palm = arm_points("brute", side)
        sleeve = tube(
            f"Sleeve_{side}",
            [(root, 0.12, 0.14), (elbow, 0.09, 0.13), (wrist, 0.11, 0.12), (palm, 0.07, 0.08)],
            12,
        )
        bind_rows(
            sleeve,
            rig,
            void,
            [
                {f"arm.{side}": 1},
                {f"arm.{side}": 0.4, f"forearm.{side}": 0.6},
                {f"forearm.{side}": 0.5, f"hand.{side}": 0.5},
                {f"hand.{side}": 1},
            ],
            12,
        )
        shoulder = loft(
            f"Moon_mantle_{side}",
            [
                ((-0.03, sign * 0.44, 1.15), 0.16, 0.15),
                ((-0.05, sign * 0.44, 1.33), 0.22, 0.23),
                ((-0.06, sign * 0.37, 1.44), 0.12, 0.16),
            ],
            12,
        )
        bind(shoulder, rig, silver, rigid(f"arm.{side}"))
        hand = tube(
            f"Porcelain_hand_{side}",
            [
                ((0.40, sign * 0.45, 0.96), 0.07, 0.075),
                ((0.51, sign * 0.45, 0.96), 0.055, 0.11),
                ((0.58, sign * 0.45, 0.96), 0.028, 0.08),
            ],
            10,
        )
        bind(hand, rig, ivory, rigid(f"hand.{side}"))
        palm_mark = loft(
            f"Palm_star_{side}",
            [((0.50, sign * 0.45, 1.002), 0.027, 0.045), ((0.50, sign * 0.45, 1.015), 0.023, 0.04)],
            8,
        )
        bind(palm_mark, rig, star, rigid(f"hand.{side}"))


def author(rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Quaternion, Vector

    author_base(rig, "brute")
    bpy.data.actions.remove(bpy.data.actions["attack"])
    pose = present(rig.pose)
    controls = [b for b in pose.bones if not b.name.startswith(("MCH_", "POLE_"))]

    def turn(name: str, axis: tuple[float, float, float], angle: float) -> None:
        bone = pose.bones[name]
        rest = bone.bone.matrix_local.to_quaternion()
        bone.rotation_euler = (rest.inverted() @ Quaternion(Vector(axis), angle) @ rest).to_euler(
            "XYZ"
        )

    for name in ATTACKS["sovereign"]:
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        action["seconds"], action["loop"], action["contact_phase"] = 1.4, False, 0.45
        rig.animation_data_create().action = action
        for frame in range(43):
            t = frame / 42
            for bone in controls:
                bone.location, bone.rotation_euler = (0, 0, 0), (0, 0, 0)
            draw = (
                math.sin(math.pi / 2 * min(t / 0.33, 1))
                if t < 0.45
                else math.cos(math.pi / 2 * min((t - 0.45) / 0.55, 1))
            )
            hit = max(0, 1 - abs(t - 0.45) / 0.13)
            pose.bones["CTRL_body"].location.z = -0.025 * draw
            if name == "cross":
                turn("arm.L", (0, 0, 1), -0.65 * draw + 1.4 * hit)
                turn("arm.R", (0, 0, 1), 0.65 * draw - 1.4 * hit)
                turn("chest", (0, 0, 1), 0.13 * draw - 0.25 * hit)
                turn("head", (0, 0, 1), -0.13 * draw + 0.25 * hit)
            elif name == "rain":
                for side in ("L", "R"):
                    turn(f"arm.{side}", (0, 1, 0), -1.9 * draw)
                    turn(f"forearm.{side}", (0, 1, 0), -0.3 * draw)
                turn("head", (0, 1, 0), -0.15 * draw)
            elif name == "pulse":
                turn("arm.L", (0, 0, 1), -0.6 * draw + 1.5 * hit)
                turn("arm.R", (0, 0, 1), 0.6 * draw - 1.5 * hit)
                turn("chest", (0, 1, 0), -0.12 * draw + 0.25 * hit)
                turn("halo", (1, 0, 0), 0.12 * draw)
            else:
                turn("arm.L", (0, 0, 1), 0.85 * draw)
                turn("arm.R", (0, 1, 0), -0.8 * draw)
                turn("forearm.R", (0, 1, 0), -0.4 * draw)
                turn("halo", (1, 0, 0), -0.3 * draw + 1.6 * hit)
                turn("head", (0, 0, 1), 0.14 * draw)
            turn("cloth", (0, 1, 0), 0.08 * draw - 0.12 * hit)
            for bone in controls:
                for channel in ("location", "rotation_euler", "scale"):
                    bone.keyframe_insert(channel, frame=frame, group=bone.name)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    present(bpy.context.scene).frame_set(0)
