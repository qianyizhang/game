"""Cinder Court: hewn basalt, copper furnace monuments and open ember braziers."""

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


def build() -> None:
    import bpy

    basalt = material("Cinder · charcoal basalt", (0.055, 0.046, 0.045), 0.94)
    edge = material("Cinder · weathered volcanic stone", (0.16, 0.115, 0.09), 0.98)
    deep = material("Cinder · soot recess", (0.018, 0.016, 0.018), 1)
    copper = material("Cinder · aged copper", (0.31, 0.125, 0.052), 0.66, 0.55)
    iron = material("Cinder · black iron", (0.055, 0.061, 0.060), 0.57, 0.75)
    ember = material("Cinder · banked ember", (0.62, 0.125, 0.025), 0.85)
    flame = material("Cinder · amber flame", (0.95, 0.50, 0.10), 0.75)
    for mat, color, strength in [
        (ember, (0.8, 0.085, 0.012, 1), 0.5),
        (flame, (1.0, 0.32, 0.025, 1), 1.2),
    ]:
        shader = present(mat.node_tree).nodes.get("Principled BSDF")
        if shader:
            shader.inputs["Emission Color"].default_value = color
            shader.inputs["Emission Strength"].default_value = strength
    groups = {}
    for name in ROOTS:
        root = bpy.data.objects.new(name, None)
        present(bpy.context.scene).collection.objects.link(root)
        groups[name] = root

    def put(obj: bpy.types.Object, root: str, mat: bpy.types.Material) -> None:
        obj.parent = groups[root]
        mesh_data(obj).materials.append(mat)

    put(block("Court_foundation", (0, 0, -21), (960, 600, 38)), "Floor", deep)
    # No glowing floor cracks: orange ground marks remain exclusively gameplay warnings.
    for row in range(4):
        for col in range(4):
            x, y = -334.5 + col * 223, -199.5 + row * 133
            put(block(f"Basalt_slab_{row}_{col}", (x, y, -1), (221.5, 131.5, 2)), "Floor", basalt)
    for y in [-282, 282]:
        for i in range(8):
            x = -420 + i * 120
            put(block(f"Court_coping_{y}_{i}", (x, y, 2), (118, 26, 8)), "Boundary", edge)
            put(block(f"Copper_edge_{y}_{i}", (x, y, 6.5), (100, 4, 1)), "Boundary", copper)
    for x in [-463, 463]:
        for i in range(6):
            y = -237.5 + i * 95
            put(block(f"Court_side_{x}_{i}", (x, y, 2), (26, 93, 8)), "Boundary", edge)
            put(block(f"Copper_side_{x}_{i}", (x, y, 6.5), (4, 75, 1)), "Boundary", copper)
    # Three broad peaked furnaces give the far edge a different rhythm from the archive.
    for index, x in enumerate([-350, 0, 350]):
        put(block(f"Furnace_back_{index}", (x, 285, 28), (84, 26, 56)), "Boundary", basalt)
        put(block(f"Furnace_recess_{index}", (x, 270, 30), (48, 3, 34)), "Boundary", deep)
        put(block(f"Furnace_embers_{index}", (x, 268.8, 22), (42, 1.2, 12)), "Boundary", ember)
        for j in range(5):
            put(
                block(f"Furnace_grate_{index}_{j}", (x - 20 + j * 10, 268.5, 31), (2, 1, 28)),
                "Boundary",
                iron,
            )
        for side in [-1, 1]:
            put(
                block(f"Furnace_jamb_{index}_{side}", (x + side * 32, 280, 30), (12, 24, 60)),
                "Boundary",
                edge,
            )
        points: list[Point] = [
            (x - 47, 270, 52),
            (x + 47, 270, 52),
            (x, 270, 74),
            (x - 47, 298, 52),
            (x + 47, 298, 52),
            (x, 298, 74),
        ]
        put(
            mesh(
                f"Furnace_pediment_{index}",
                points,
                [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)],
            ),
            "Boundary",
            copper,
        )
    pillar_forms: list[tuple[str, list[tuple[Point, float, float]], bpy.types.Material]] = [
        ("Pillar_base", [((0, 0, 0), 30, 30), ((0, 0, 8), 30, 30), ((0, 0, 13), 23, 23)], edge),
        (
            "Basalt_shaft",
            [((0, 0, 9), 22, 22), ((0, 0, 30), 20, 20), ((0, 0, 54), 18, 18), ((0, 0, 70), 21, 21)],
            basalt,
        ),
        ("Pillar_cap", [((0, 0, 66), 21, 21), ((0, 0, 73), 30, 30), ((0, 0, 81), 24, 24)], copper),
        ("Lower_binding", [((0, 0, 16), 22, 22), ((0, 0, 21), 22, 22)], iron),
        ("Upper_binding", [((0, 0, 56), 21, 21), ((0, 0, 61), 21, 21)], copper),
    ]
    for name, sections, mat in pillar_forms:
        put(loft(name, sections, 6), "Pillar", mat)
    # Flush inset bars on three facets are dim material accents, not hazard-like ground marks.
    for i in range(3):
        a = math.pi / 6 + i * math.tau / 3
        obj = block(f"Column_seal_{i}", (0, 0, 0), (3, 0.8, 17))
        for vertex in mesh_data(obj).vertices:
            x, y, z = float(vertex.co.x), float(vertex.co.y), float(vertex.co.z)
            height = z + 39
            surface = (20 - (height - 30) / 12) * math.cos(math.pi / 6)
            vertex.co = (
                math.cos(a) * (surface + 0.15 + y) + math.sin(a) * x,
                math.sin(a) * (surface + 0.15 + y) - math.cos(a) * x,
                height,
            )
        put(obj, "Pillar", copper)
    lamp_forms: list[tuple[str, list[tuple[Point, float, float]], bpy.types.Material]] = [
        ("Brazier_foot", [((0, 0, 0), 8, 8), ((0, 0, 5), 8, 8), ((0, 0, 8), 4.5, 4.5)], edge),
        ("Brazier_stem", [((0, 0, 5), 3, 3), ((0, 0, 23), 3, 3)], iron),
        (
            "Brazier_bowl",
            [((0, 0, 21), 3.5, 3.5), ((0, 0, 27), 7.8, 7.8), ((0, 0, 29), 7.8, 7.8)],
            copper,
        ),
        ("Brazier_coals", [((0, 0, 28.5), 6.5, 6.5), ((0, 0, 30), 6, 6)], ember),
        (
            "Brazier_flame",
            [
                ((0, 0, 29), 4.5, 4.5),
                ((0.5, 0, 34), 5, 4),
                ((-1, 0, 39), 2.6, 2),
                ((2, 0, 44), 0.1, 0.1),
            ],
            flame,
        ),
    ]
    for name, sections, mat in lamp_forms:
        put(loft(name, sections, 8), "Lantern", mat)
    join_parts(groups)
    present(bpy.context.scene)["environment_kind"] = "cinder"
