"""Drowned Archive: flooded stone stacks, scroll capitals and caged tide lamps."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from enemy_form import tube
from environment_form import ROOTS
from environment_geometry import block, join_parts
from hero_form import loft, material
from hero_rig import Point
from native_types import mesh_data, present

if TYPE_CHECKING:
    import bpy


def build() -> None:
    import bpy

    stone = material("Archive · ink blue stone", (0.075, 0.14, 0.19), 0.88)
    pale = material("Archive · salt limestone", (0.30, 0.40, 0.39), 0.9)
    deep = material("Archive · drowned recess", (0.024, 0.053, 0.073), 0.95)
    water = material("Archive · still tide", (0.035, 0.14, 0.18), 0.24, 0.15)
    bronze = material("Archive · aged fittings", (0.19, 0.22, 0.16), 0.6, 0.65)
    books = material("Archive · sealed folios", (0.16, 0.24, 0.23), 0.94)
    glow = material("Archive · captive tide light", (0.29, 0.72, 0.75), 0.48)
    shader = present(glow.node_tree).nodes.get("Principled BSDF")
    if shader:
        shader.inputs["Emission Color"].default_value = (0.15, 0.65, 0.72, 1)
        shader.inputs["Emission Strength"].default_value = 0.6
    groups = {}
    for name in ROOTS:
        root = bpy.data.objects.new(name, None)
        present(bpy.context.scene).collection.objects.link(root)
        groups[name] = root

    def put(obj: bpy.types.Object, root: str, mat: bpy.types.Material) -> None:
        obj.parent = groups[root]
        mesh_data(obj).materials.append(mat)

    put(block("Archive_foundation", (0, 0, -21), (960, 600, 38)), "Floor", deep)
    # Narrow still-water joints sit below a broad, walkable stone plane.
    put(block("Tide_bed", (0, 0, -1.5), (956, 596, 1)), "Floor", water)
    for row in range(4):
        for col in range(6):
            x, y = -373.75 + col * 149.5, -201 + row * 134
            put(block(f"Archive_paving_{row}_{col}", (x, y, -0.5), (147.5, 132, 1)), "Floor", stone)
    for y in [-282, 282]:
        for i in range(8):
            put(
                block(f"Quay_edge_{y}_{i}", (-420 + i * 120, y, 3), (118, 26, 10)), "Boundary", pale
            )
    for x in [-463, 463]:
        for i in range(6):
            put(
                block(f"Quay_side_{x}_{i}", (x, -237.5 + i * 95, 3), (26, 93, 10)), "Boundary", pale
            )
    # The archive stacks rise only along the far edge. Their arches enclose actual recesses.
    for index, x in enumerate([-360, -120, 120, 360]):
        put(block(f"Niche_back_{index}", (x, 295, 32), (70, 8, 64)), "Boundary", deep)
        for side in [-1, 1]:
            put(
                block(f"Niche_pier_{index}_{side}", (x + side * 31, 282, 23), (10, 26, 46)),
                "Boundary",
                stone,
            )
        arc: list[tuple[Point, float, float]] = [
            ((x + 31 * math.cos(a), 282, 43 + 25 * math.sin(a)), 4.5, 4.5)
            for a in [i * math.pi / 16 for i in range(17)]
        ]
        put(tube(f"Niche_arch_{index}", arc, 8), "Boundary", pale)
        for shelf, z in enumerate([15, 37]):
            put(block(f"Shelf_{index}_{shelf}", (x, 279, z), (54, 17, 3)), "Boundary", bronze)
            for book in range(5):
                height = [14, 17, 12, 16, 13][(book + index) % 5]
                put(
                    block(
                        f"Folio_{index}_{shelf}_{book}",
                        (x - 20 + book * 10, 283, z + 1.5 + height / 2),
                        (7.5, 12, height),
                    ),
                    "Boundary",
                    books,
                )
    # The cap and base meet the same radius-30 collision footprint as every other kit.
    pillar_forms: list[tuple[str, list[tuple[Point, float, float]], bpy.types.Material]] = [
        ("Pillar_base", [((0, 0, 0), 30, 30), ((0, 0, 7), 30, 30), ((0, 0, 13), 22, 22)], pale),
        (
            "Archive_column",
            [((0, 0, 9), 19, 19), ((0, 0, 61), 17, 17), ((0, 0, 68), 21, 21)],
            stone,
        ),
        ("Pillar_cap", [((0, 0, 67), 21, 21), ((0, 0, 74), 30, 30), ((0, 0, 81), 26, 26)], pale),
        ("Column_tide_band", [((0, 0, 13), 20, 20), ((0, 0, 17), 20, 20)], bronze),
    ]
    for name, sections, mat in pillar_forms:
        put(loft(name, sections, 12), "Pillar", mat)
    for side in [-1, 1]:
        # Paired scroll volutes grow into the capital, with a visible coiled end.
        points: list[tuple[Point, float, float]] = []
        for i in range(19):
            a = i * math.pi * 1.65 / 18
            radius = 9 - i * 0.3
            points.append(
                ((side * (12 + radius * math.cos(a)), -18, 67 + radius * math.sin(a)), 1.8, 1.8)
            )
        put(tube(f"Scroll_capital_{side}", points, 8), "Pillar", bronze)
    lamp_forms: list[tuple[str, list[tuple[Point, float, float]], bpy.types.Material]] = [
        ("Lamp_foot", [((0, 0, 0), 8, 8), ((0, 0, 5), 8, 8), ((0, 0, 8), 5, 5)], pale),
        ("Lamp_stem", [((0, 0, 5), 3, 3), ((0, 0, 24), 3, 3), ((0, 0, 27), 7, 7)], bronze),
        ("Tide_pearl", [((0, 0, 27), 3, 3), ((0, 0, 32), 4.8, 4.8), ((0, 0, 37), 2.5, 2.5)], glow),
        ("Lamp_crown", [((0, 0, 38), 7, 7), ((0, 0, 41), 5, 5), ((0, 0, 44), 1, 1)], bronze),
    ]
    for name, sections, mat in lamp_forms:
        put(loft(name, sections, 12), "Lantern", mat)
    for i in range(4):
        a = i * math.pi / 2
        put(
            tube(
                f"Lamp_cage_{i}",
                [
                    ((r * math.cos(a), r * math.sin(a), z), 0.8, 0.8)
                    for r, z in [(5, 25), (6.5, 31), (5, 39)]
                ],
                6,
            ),
            "Lantern",
            bronze,
        )
    join_parts(groups)
    present(bpy.context.scene)["environment_kind"] = "archive"
