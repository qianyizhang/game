"""Ash Regent: furnace plate, split regalia and a hooked cinder blade."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from enemy_form import bind_rows, plate, tube
from enemy_rig import arm_points
from enemy_rig import author as author_base
from enemy_rig import make_rig as make_base
from guardian_catalog import ATTACKS
from hero_form import bind, loft, material, rigid, transition
from native_types import present

if TYPE_CHECKING:
    import bpy


def make_rig() -> bpy.types.Object:
    rig = make_base("brute")
    rig.name = "GuardianRig"
    rig["authoring"] = (
        "Fitted humanoid foot IK; FK furnace armor and split regalia. X-forward, Z-up."
    )
    return rig


def build(rig: bpy.types.Object) -> None:
    iron = material("Armor · charcoal iron", (0.052, 0.045, 0.048), 0.65, 0.50)
    edge = material("Edges · worn copper", (0.45, 0.19, 0.075), 0.43, 0.65)
    gold = material("Crown · pale brass", (0.64, 0.43, 0.15), 0.42, 0.7)
    ash = material("Mask · cooled ash", (0.47, 0.45, 0.39), 0.8)
    cloth = material("Regalia · scorched burgundy", (0.22, 0.037, 0.043), 0.97)
    dark = material("Furnace recess", (0.012, 0.007, 0.009), 0.95)
    ember = material("Furnace · amber coals", (1.0, 0.20, 0.025), 0.7)
    shader = present(ember.node_tree).nodes.get("Principled BSDF")
    if shader:
        shader.inputs["Emission Color"].default_value = (1.0, 0.075, 0.005, 1.0)
        shader.inputs["Emission Strength"].default_value = 0.45
    torso = loft(
        "Forged_cuirass",
        [
            ((0, 0, 0.65), 0.16, 0.20),
            ((0, 0, 0.77), 0.22, 0.29),
            ((0, 0, 1.12), 0.25, 0.32),
            ((-0.02, 0, 1.32), 0.22, 0.33),
            ((-0.02, 0, 1.40), 0.14, 0.22),
        ],
        12,
    )
    bind(torso, rig, iron, rigid("chest"))
    for name, x, radius, mat in [
        ("Furnace_backing", 0.26, 0.045, dark),
        ("Furnace_coals", 0.30, 0.035, ember),
    ]:
        obj = loft(
            name,
            [
                ((x, 0, 0.86), radius, 0.15),
                ((x, 0, 1.03), radius, 0.20),
                ((x, 0, 1.19), radius, 0.16),
            ],
            12,
        )
        bind(obj, rig, mat, rigid("chest"))
    # Raised grate and frame enclose the ember inset without painting fake openings.
    for i in range(-2, 3):
        bar = tube(
            f"Grate_{i}",
            [
                ((0.343, i * 0.073, 0.84), 0.018, 0.02),
                ((0.35, i * 0.086, 1.04), 0.022, 0.024),
                ((0.33, i * 0.073, 1.21), 0.02, 0.02),
            ],
            6,
        )
        bind(bar, rig, iron, rigid("chest"))
    for z, width in [(0.84, 0.18), (1.21, 0.18)]:
        rim = tube(
            f"Furnace_rim_{z}",
            [
                ((0.32, -width, z), 0.035, 0.025),
                ((0.36, 0, z), 0.035, 0.025),
                ((0.32, width, z), 0.035, 0.025),
            ],
            8,
        )
        bind(rim, rig, edge, rigid("chest"))
    neck = loft("Gorget", [((0.02, 0, 1.30), 0.11, 0.14), ((0.03, 0, 1.47), 0.09, 0.12)], 12)
    bind(neck, rig, edge, rigid("head"))
    helmet = loft(
        "Crowned_helm",
        [
            ((0.10, 0, 1.37), 0.12, 0.13),
            ((0.11, 0, 1.51), 0.17, 0.18),
            ((0.06, 0, 1.67), 0.16, 0.18),
            ((0.02, 0, 1.72), 0.11, 0.14),
        ],
        10,
    )
    bind(helmet, rig, iron, rigid("head"))
    mask = loft(
        "Ash_mask",
        [
            ((0.22, 0, 1.40), 0.035, 0.06),
            ((0.27, 0, 1.49), 0.045, 0.125),
            ((0.24, 0, 1.61), 0.04, 0.13),
        ],
        8,
    )
    bind(mask, rig, ash, rigid("head"))
    visor = tube(
        "Ember_visor",
        [
            ((0.269, -0.11, 1.567), 0.014, 0.014),
            ((0.29, 0, 1.55), 0.014, 0.014),
            ((0.269, 0.11, 1.567), 0.014, 0.014),
        ],
        6,
    )
    bind(visor, rig, ember, rigid("head"))
    for i in [-1, 0, 1]:
        tine = tube(
            f"Crown_tine_{i}",
            [
                ((0.025, i * 0.13, 1.62), 0.05, 0.035),
                ((0.005, i * 0.19, 1.78), 0.035, 0.025),
                ((0.09, i * 0.22, 1.91 if i == 0 else 1.85), 0.006, 0.008),
            ],
            8,
        )
        bind(tine, rig, gold, rigid("head"))
    for side, sign in [("L", 1), ("R", -1)]:
        y = sign * 0.25
        leg = tube(
            f"Armored_leg_{side}",
            [
                ((0, y, 0.13), 0.085, 0.085),
                ((0.09, y, 0.37), 0.13, 0.11),
                ((0, y, 0.66), 0.135, 0.14),
            ],
            10,
        )
        bind(leg, rig, iron, transition(f"shin.{side}", f"thigh.{side}", 0.29, 0.48))
        boot = loft(
            f"Sabatons_{side}",
            [
                ((0.10, y, 0.03), 0.25, 0.13),
                ((0.13, y, 0.09), 0.27, 0.13),
                ((0.03, y, 0.19), 0.12, 0.10),
            ],
            10,
        )
        bind(boot, rig, edge, rigid(f"foot.{side}"))
        tasset = loft(
            f"Split_tasset_{side}",
            [
                ((0.02, y, 0.43), 0.16, 0.18),
                ((0.015, y, 0.61), 0.17, 0.19),
                ((0, y, 0.78), 0.13, 0.17),
            ],
            8,
        )
        bind(tasset, rig, cloth, rigid(f"thigh.{side}"))
        root, elbow, wrist, palm = arm_points("brute", side)
        arm = tube(
            f"Forged_arm_{side}",
            [(root, 0.115, 0.14), (elbow, 0.10, 0.11), (wrist, 0.115, 0.12), (palm, 0.09, 0.085)],
            10,
        )
        bind_rows(
            arm,
            rig,
            iron,
            [
                {f"arm.{side}": 1},
                {f"arm.{side}": 0.4, f"forearm.{side}": 0.6},
                {f"forearm.{side}": 0.5, f"hand.{side}": 0.5},
                {f"hand.{side}": 1},
            ],
            10,
        )
        knuckles = tube(
            f"Gauntlet_{side}",
            [((0.43, sign * 0.45, 0.97), 0.10, 0.12), ((0.53, sign * 0.45, 0.97), 0.085, 0.11)],
            8,
        )
        bind(knuckles, rig, gold, rigid(f"hand.{side}"))
    blade = plate(
        "Cinder_hook",
        [
            (0.49, 0.92),
            (0.66, 0.91),
            (1.03, 1.10),
            (1.13, 1.36),
            (0.92, 1.22),
            (0.64, 1.08),
            (0.49, 1.02),
        ],
        0.45,
        0.055,
    )
    bind(blade, rig, iron, rigid("hand.L"))
    blade_edge = tube(
        "Cinder_edge",
        [
            ((0.64, 0.45, 0.94), 0.018, 0.021),
            ((1.03, 0.45, 1.10), 0.023, 0.024),
            ((1.13, 0.45, 1.36), 0.004, 0.004),
        ],
        6,
    )
    bind(blade_edge, rig, ember, rigid("hand.L"))
    add_regalia(rig)


def add_regalia(rig: bpy.types.Object) -> None:
    edge = material("Regalia edges · copper", (0.45, 0.19, 0.075), 0.43, 0.65)
    cloth = material("Mantle · burgundy", (0.22, 0.037, 0.043), 0.97)
    for side, sign in [("L", 1), ("R", -1)]:
        shoulder = loft(
            f"Pauldron_{side}",
            [
                ((-0.035, sign * 0.43, 1.18), 0.18, 0.13),
                ((-0.04, sign * 0.45, 1.32), 0.25, 0.22),
                ((-0.06, sign * 0.45, 1.45), 0.19, 0.17),
                ((-0.12, sign * 0.45, 1.58 if side == "L" else 1.50), 0.04, 0.07),
            ],
            8,
        )
        bind(shoulder, rig, edge, rigid(f"arm.{side}"))
        # Separate tapered cloth panels leave a real central opening in rear view.
        mantle = loft(
            f"Mantle_panel_{side}",
            [
                ((-0.39, sign * 0.18, 0.62 if side == "L" else 0.72), 0.02, 0.045),
                ((-0.34, sign * 0.14, 0.80), 0.032, 0.085),
                ((-0.27, sign * 0.13, 1.14), 0.035, 0.11),
                ((-0.19, sign * 0.125, 1.34), 0.035, 0.12),
            ],
            8,
        )
        bind(mantle, rig, cloth, rigid("cloth"))


def author(rig: bpy.types.Object) -> None:
    import bpy

    author_base(rig, "brute")
    bpy.data.actions.remove(bpy.data.actions["attack"])
    author_attacks(rig)


def author_attacks(rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Quaternion, Vector

    pose = present(rig.pose)
    controls = [b for b in pose.bones if not b.name.startswith(("MCH_", "POLE_"))]

    def turn(name: str, axis: tuple[float, float, float], angle: float) -> None:
        bone = pose.bones[name]
        rest = bone.bone.matrix_local.to_quaternion()
        bone.rotation_euler = (rest.inverted() @ Quaternion(Vector(axis), angle) @ rest).to_euler(
            "XYZ"
        )

    for name in ATTACKS["ashregent"]:
        previous = bpy.data.actions.get(name)
        if previous:
            bpy.data.actions.remove(previous)
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
                turn("arm.L", (0, 0, 1), 0.65 * draw - 1.15 * hit)
                turn("arm.R", (0, 0, 1), -0.55 * draw + 0.90 * hit)
                turn("chest", (0, 0, 1), -0.12 * draw + 0.22 * hit)
                turn("head", (0, 0, 1), 0.12 * draw - 0.20 * hit)
            elif name == "rain":
                turn("arm.R", (0, 1, 0), -2.0 * draw)
                turn("forearm.R", (0, 1, 0), -0.30 * draw - 0.12 * hit)
                turn("arm.L", (0, 0, 1), 0.3 * draw)
                turn("head", (0, 1, 0), -0.18 * draw)
            else:
                turn("chest", (0, 1, 0), -0.12 * draw + 0.35 * hit)
                turn("head", (0, 1, 0), -0.05 * draw + 0.12 * hit)
                turn("arm.L", (0, 0, 1), 0.55 * draw)
                turn("arm.R", (0, 0, 1), -0.65 * draw + 0.95 * hit)
            turn("cloth", (0, 1, 0), 0.10 * draw - 0.12 * hit)
            for bone in controls:
                for channel in ("location", "rotation_euler", "scale"):
                    bone.keyframe_insert(channel, frame=frame, group=bone.name)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    present(bpy.context.scene).frame_set(0)
