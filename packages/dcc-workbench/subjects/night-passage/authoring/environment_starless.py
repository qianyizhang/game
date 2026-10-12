"""Starless Gate: an open lunar arch, slotted limestone piers and caged cold lights."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from environment_form import ROOTS
from environment_geometry import block, join_parts
from hero_form import loft, material, mesh
from hero_rig import Point
from native_types import mesh_data, present

if TYPE_CHECKING:
    import bpy


def arch() -> bpy.types.Object:
    """Closed half-elliptical masonry band, with a real opening and outward faces."""
    points: list[Point] = []
    steps = 12
    for y in [270, 298]:
        for rx, rz in [(80, 51), (60, 36)]:
            for i in range(steps + 1):
                a = i * math.pi / steps
                points.append((rx * math.cos(a), y, 24 + rz * math.sin(a)))
    stride = steps + 1
    layer = stride * 2
    faces: list[tuple[int, ...]] = []
    for i in range(steps):
        # Front/back annulus faces and the outer/inner connecting surfaces.
        faces.extend(
            [
                (i, i + 1, stride + i + 1, stride + i),
                (layer + i, layer + stride + i, layer + stride + i + 1, layer + i + 1),
                (i, layer + i, layer + i + 1, i + 1),
                (stride + i, stride + i + 1, layer + stride + i + 1, layer + stride + i),
            ]
        )
    faces.extend(
        [
            (0, stride, layer + stride, layer),
            (steps, layer + steps, layer + stride + steps, stride + steps),
        ]
    )
    return mesh("Gate_arch", points, faces)


def build() -> None:
    import bpy

    floor = material("Starless · midnight slate", (0.048, 0.055, 0.085), 0.95)
    stone = material("Starless · lunar limestone", (0.46, 0.49, 0.53), 0.9)
    edge = material("Starless · cut stone", (0.24, 0.27, 0.34), 0.86)
    dark = material("Starless · shadow joint", (0.018, 0.021, 0.032), 0.98)
    metal = material("Starless · tarnished silver", (0.30, 0.34, 0.40), 0.49, 0.7)
    light = material("Starless · cold crystal", (0.44, 0.58, 0.76), 0.45)
    shader = present(light.node_tree).nodes.get("Principled BSDF")
    if shader:
        shader.inputs["Emission Color"].default_value = (0.25, 0.45, 0.85, 1)
        shader.inputs["Emission Strength"].default_value = 0.7
    groups = {}
    for name in ROOTS:
        root = bpy.data.objects.new(name, None)
        present(bpy.context.scene).collection.objects.link(root)
        groups[name] = root

    def put(obj: bpy.types.Object, root: str, mat: bpy.types.Material) -> None:
        obj.parent = groups[root]
        mesh_data(obj).materials.append(mat)

    put(block("Gate_foundation", (0, 0, -21), (960, 600, 38)), "Floor", dark)
    for row in range(3):
        for col in range(3):
            put(
                block(
                    f"Slate_{row}_{col}",
                    (-297 + col * 297, -177 + row * 177, -1),
                    (295.5, 175.5, 2),
                ),
                "Floor",
                floor,
            )
    # A quiet court. No constellations on the combat plane that could imitate void seals.
    for y in [-283, 283]:
        for i in range(6):
            put(
                block(f"Limestone_edge_{y}_{i}", (-400 + i * 160, y, 2), (158, 28, 8)),
                "Boundary",
                stone,
            )
    for x in [-463, 463]:
        for i in range(4):
            put(
                block(f"Limestone_side_{x}_{i}", (x, -201 + i * 134, 2), (28, 132, 8)),
                "Boundary",
                stone,
            )
    put(arch(), "Boundary", stone)
    for side in [-1, 1]:
        put(block(f"Arch_jamb_{side}", (side * 70, 284, 12), (20, 28, 24)), "Boundary", stone)
        put(block(f"Arch_foot_{side}", (side * 70, 284, 4), (30, 30, 8)), "Boundary", edge)
        # Two distant, lower stelae keep the central opening dominant.
        x = side * 335
        put(block(f"Stele_foot_{side}", (x, 284, 4), (48, 28, 8)), "Boundary", edge)
        put(block(f"Stele_{side}", (x, 284, 27), (30, 24, 48)), "Boundary", stone)
        put(block(f"Stele_inset_{side}", (x, 271.5, 29), (10, 1, 26)), "Boundary", dark)
        put(block(f"Stele_light_{side}", (x, 270.8, 40), (4, 0.6, 4)), "Boundary", light)
    # An eight-sided plinth supports two piers and a single cap, leaving a tall slot.
    put(
        loft("Pillar_base", [((0, 0, 0), 30, 30), ((0, 0, 6), 30, 30), ((0, 0, 12), 24, 24)], 8),
        "Pillar",
        edge,
    )
    for side in [-1, 1]:
        put(
            loft(
                f"Slotted_pier_{side}",
                [
                    ((side * 14, 0, 9), 8, 15),
                    ((side * 13, 0, 22), 7, 13),
                    ((side * 13, 0, 67), 6, 12),
                    ((side * 13, 0, 72), 8, 14),
                ],
                8,
            ),
            "Pillar",
            stone,
        )
    put(block("Slot_sill", (0, 0, 17), (22, 16, 6)), "Pillar", metal)
    put(
        loft("Pillar_cap", [((0, 0, 68), 24, 24), ((0, 0, 75), 27, 27), ((0, 0, 81), 21, 21)], 8),
        "Pillar",
        stone,
    )
    lamp_forms: list[tuple[str, list[tuple[Point, float, float]], bpy.types.Material]] = [
        ("Beacon_foot", [((0, 0, 0), 8, 8), ((0, 0, 5), 8, 8), ((0, 0, 8), 4, 4)], edge),
        ("Beacon_stem", [((0, 0, 5), 2.5, 2.5), ((0, 0, 24), 2.5, 2.5)], metal),
        ("Beacon_cup", [((0, 0, 22), 3, 3), ((0, 0, 25), 7, 7)], metal),
        ("Beacon_crystal", [((0, 0, 24), 1, 1), ((0, 0, 31), 4, 4), ((0, 0, 39), 0.2, 0.2)], light),
        ("Beacon_crown", [((0, 0, 40), 6, 6), ((0, 0, 42), 6, 6), ((0, 0, 44), 2, 2)], stone),
    ]
    for name, sections, mat in lamp_forms:
        put(loft(name, sections, 8), "Lantern", mat)
    for x in [-5, 5]:
        put(block(f"Beacon_guard_{x}", (x, 0, 32.5), (1.5, 1.5, 17)), "Lantern", metal)
    join_parts(groups)
    present(bpy.context.scene)["environment_kind"] = "starless"
