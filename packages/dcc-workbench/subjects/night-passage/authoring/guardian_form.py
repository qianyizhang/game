"""Bellwarden: hollow cast-bronze bell, fitted iron limbs and asymmetric striker."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from enemy_form import bind_rows, tube
from enemy_rig import arm_points
from hero_form import bind, loft, material, mesh, rigid, transition
from hero_rig import Point
from native_types import mesh_data

if TYPE_CHECKING:
    import bpy


def bell_shell() -> bpy.types.Object:
    # Closed wall cross-section: outside rises to shoulder, inner profile returns
    # to the open mouth. Ring stitching preserves a real lip and hollow underside.
    profile = [
        (0.55, 0.49),
        (0.59, 0.49),
        (0.65, 0.43),
        (0.77, 0.37),
        (1.02, 0.31),
        (1.18, 0.24),
        (1.25, 0.13),
        (1.21, 0.11),
        (1.14, 0.20),
        (1.00, 0.27),
        (0.76, 0.33),
        (0.63, 0.39),
        (0.58, 0.45),
        (0.55, 0.45),
    ]
    count = 32
    points: list[Point] = [
        (radius * 0.82 * math.cos(i * math.tau / count), radius * math.sin(i * math.tau / count), z)
        for z, radius in profile
        for i in range(count)
    ]
    faces: list[tuple[int, ...]] = [
        (
            j * count + i,
            j * count + (i + 1) % count,
            ((j + 1) % len(profile)) * count + (i + 1) % count,
            ((j + 1) % len(profile)) * count + i,
        )
        for j in range(len(profile))
        for i in range(count)
    ]
    return mesh("Toll_bell_hollow", points, faces)


def add_neck(rig: bpy.types.Object) -> None:
    iron = material("Neck · forged coupling", (0.07, 0.105, 0.105), 0.68, 0.55)
    neck = tube(
        "Mask_neck_coupling",
        [
            ((0.04, 0, 1.26), 0.075, 0.075),
            ((0.14, 0, 1.35), 0.075, 0.07),
            ((0.20, 0, 1.43), 0.065, 0.06),
        ],
    )
    bind(neck, rig, iron, rigid("head"))


def build(rig: bpy.types.Object) -> None:
    add_neck(rig)
    bronze = material("Bell · aged bronze", (0.40, 0.23, 0.075), 0.48, 0.72)
    rim = material("Bell · worn striking edge", (0.66, 0.46, 0.19), 0.35, 0.75)
    iron = material("Frame · dark forged iron", (0.07, 0.105, 0.105), 0.68, 0.55)
    verdigris = material("Mantle · muted verdigris", (0.08, 0.24, 0.20), 0.9)
    wood = material("Striker · scorched heartwood", (0.16, 0.074, 0.035), 0.9)
    ivory = material("Face · old ivory", (0.76, 0.67, 0.44), 0.72)
    dark = material("Face · recessed slit", (0.014, 0.025, 0.028), 0.96)
    shell = bell_shell()
    bind(shell, rig, bronze, rigid("bell"))
    mesh_data(shell).materials.append(rim)
    for face in mesh_data(shell).polygons:
        if face.index < 64 or face.index >= 12 * 32:
            face.material_index = 1
    clapper = loft(
        "Clapper",
        [
            ((0, 0, 0.40), 0.06, 0.07),
            ((0, 0, 0.43), 0.10, 0.10),
            ((0, 0, 0.51), 0.065, 0.065),
            ((0, 0, 0.87), 0.035, 0.035),
        ],
    )
    bind(clapper, rig, rim, rigid("bell"))
    for side, sign in [("L", 1), ("R", -1)]:
        y = sign * 0.25
        foot = loft(
            f"Iron_sabatons_{side}",
            [
                ((0.09, y, 0.03), 0.24, 0.13),
                ((0.09, y, 0.10), 0.24, 0.135),
                ((0.03, y, 0.18), 0.15, 0.115),
                ((0, y, 0.24), 0.10, 0.10),
            ],
        )
        bind(foot, rig, iron, rigid(f"foot.{side}"))
        leg = tube(
            f"Root_leg_{side}",
            [
                ((0, y, 0.14), 0.075, 0.075),
                ((0.09, y, 0.37), 0.09, 0.08),
                ((0, y, 0.69), 0.11, 0.10),
            ],
        )
        bind(leg, rig, wood, transition(f"shin.{side}", f"thigh.{side}", 0.30, 0.45))
        root, elbow, wrist, palm = arm_points("brute", side)
        arm = tube(
            f"Forged_arm_{side}",
            [(root, 0.12, 0.12), (elbow, 0.085, 0.085), (wrist, 0.075, 0.075), (palm, 0.09, 0.085)],
        )
        bind_rows(
            arm,
            rig,
            iron,
            [
                {f"arm.{side}": 1},
                {f"arm.{side}": 0.5, f"forearm.{side}": 0.5},
                {f"forearm.{side}": 0.6, f"hand.{side}": 0.4},
                {f"hand.{side}": 1},
            ],
        )
        guard = loft(
            f"Shoulder_cowl_{side}",
            [
                ((-0.03, sign * 0.43, 1.15), 0.16, 0.16),
                ((-0.06, sign * 0.43, 1.34), 0.21, 0.19),
                ((-0.08, sign * 0.40, 1.43), 0.15, 0.14),
            ],
        )
        bind(guard, rig, verdigris, rigid("chest"))
    yoke = tube(
        "Suspension_yoke",
        [
            ((0, -0.45, 1.20), 0.065, 0.07),
            ((-0.04, -0.36, 1.50), 0.07, 0.07),
            ((-0.08, 0, 1.68), 0.08, 0.065),
            ((-0.04, 0.36, 1.50), 0.07, 0.07),
            ((0, 0.45, 1.20), 0.065, 0.07),
        ],
        10,
    )
    bind(yoke, rig, iron, rigid("chest"))
    crown = loft(
        "Bell_crown",
        [((0, 0, 1.21), 0.13, 0.13), ((0, 0, 1.31), 0.13, 0.13), ((0, 0, 1.36), 0.09, 0.09)],
    )
    bind(crown, rig, rim, rigid("bell"))
    mask = loft(
        "Warden_mask",
        [
            ((0.23, 0, 1.22), 0.10, 0.045),
            ((0.26, 0, 1.31), 0.12, 0.11),
            ((0.24, 0, 1.48), 0.13, 0.145),
            ((0.18, 0, 1.55), 0.09, 0.11),
        ],
        12,
    )
    bind(mask, rig, ivory, rigid("head"))
    slit = tube(
        "Mask_eye_slit",
        [
            ((0.361, -0.09, 1.425), 0.013, 0.012),
            ((0.374, 0, 1.408), 0.015, 0.012),
            ((0.361, 0.09, 1.425), 0.013, 0.012),
        ],
        6,
    )
    bind(slit, rig, dark, rigid("head"))
    # One forward-heavy striker gives direction; the other open hand invokes roots.
    _, _, wrist, palm = arm_points("brute", "R")
    shaft = tube(
        "Toll_striker_handle",
        [
            (palm, 0.048, 0.048),
            ((0.72, wrist[1], 0.91), 0.04, 0.04),
            ((0.96, wrist[1], 0.89), 0.048, 0.048),
        ],
        10,
    )
    bind(shaft, rig, wood, rigid("hand.R"))
    hammer = loft(
        "Toll_striker_head",
        [
            ((0.91, wrist[1], 0.70), 0.10, 0.105),
            ((0.91, wrist[1], 0.76), 0.14, 0.15),
            ((0.91, wrist[1], 1.02), 0.14, 0.15),
            ((0.91, wrist[1], 1.08), 0.10, 0.105),
        ],
        12,
    )
    bind(hammer, rig, rim, rigid("hand.R"))
    for i in range(3):
        finger = tube(
            f"Root_finger_{i}",
            [
                ((0.43, 0.46 + i * 0.055, 0.97), 0.036, 0.034),
                ((0.58, 0.47 + i * 0.075, 1.02), 0.028, 0.025),
                ((0.66, 0.46 + i * 0.08, 1.13 + i * 0.035), 0.012, 0.012),
            ],
            8,
        )
        bind(finger, rig, wood, rigid("hand.L"))
    mantle = loft(
        "Back_mantle",
        [
            ((-0.20, 0, 0.67), 0.08, 0.27),
            ((-0.27, 0, 0.94), 0.07, 0.30),
            ((-0.18, 0, 1.25), 0.075, 0.31),
            ((-0.12, 0, 1.40), 0.05, 0.23),
        ],
        12,
    )
    bind(mantle, rig, verdigris, rigid("cloth"))
