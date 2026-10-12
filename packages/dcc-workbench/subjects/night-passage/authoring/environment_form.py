"""Root Sepulcher architecture in game units, authored around reusable part origins."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from enemy_form import tube
from hero_form import loft, material, mesh
from hero_rig import Point
from native_types import active_object, mesh_data, present

if TYPE_CHECKING:
    import bpy

ROOTS = ("Floor", "Boundary", "Lantern", "Pillar")


def build() -> None:
    import bpy

    stone = material("Sepulcher · quiet slate", (0.105, 0.15, 0.12), 0.96)
    edge = material("Sepulcher · weathered limestone", (0.30, 0.35, 0.26), 0.95)
    dark = material("Sepulcher · deep joints", (0.040, 0.065, 0.052), 1)
    roots = material("Sepulcher · old roots", (0.14, 0.085, 0.042), 0.98)
    moss = material("Sepulcher · moss", (0.13, 0.22, 0.07), 1)
    bronze = material("Sepulcher · lantern bronze", (0.28, 0.20, 0.085), 0.62, 0.5)
    glow = material("Sepulcher · amber light", (0.9, 0.62, 0.24), 0.65)
    shader = present(glow.node_tree).nodes.get("Principled BSDF")
    if shader:
        shader.inputs["Emission Color"].default_value = (1.0, 0.50, 0.15, 1.0)
        shader.inputs["Emission Strength"].default_value = 0.7
    groups = {}
    for name in ROOTS:
        root = bpy.data.objects.new(name, None)
        present(bpy.context.scene).collection.objects.link(root)
        groups[name] = root

    def place(obj: bpy.types.Object, parent: str, mat: bpy.types.Material) -> None:
        obj.parent = groups[parent]
        mesh_data(obj).materials.append(mat)

    def block(
        name: str,
        center: tuple[float, float, float],
        size: tuple[float, float, float],
        bevel: float = 2,
    ) -> bpy.types.Object:
        x, y, z = center
        w, d, h = size
        b = min(bevel, w / 4, d / 4)
        outline = [
            (-w / 2 + b, -d / 2),
            (w / 2 - b, -d / 2),
            (w / 2, -d / 2 + b),
            (w / 2, d / 2 - b),
            (w / 2 - b, d / 2),
            (-w / 2 + b, d / 2),
            (-w / 2, d / 2 - b),
            (-w / 2, -d / 2 + b),
        ]
        points = [(x + a, y + c, z + side * h / 2) for side in (-1, 1) for a, c in outline]
        faces = [tuple(reversed(range(8))), tuple(range(8, 16))]
        faces.extend((i, (i + 1) % 8, (i + 1) % 8 + 8, i + 8) for i in range(8))
        return mesh(name, points, faces)

    place(block("Floor_foundation", (0, 0, -21), (960, 600, 38), 8), "Floor", dark)
    # Broad slabs keep combat warnings dominant. All surfaces end at or below zero.
    for row in range(5):
        for col in range(8):
            x, y = -390.25 + col * 111.5, -213.2 + row * 106.6
            obj = block(f"Tomb_slab_{row}_{col}", (x, y, -1.5), (110.5, 105.6, 3), 1)
            place(obj, "Floor", stone)
    for y in [-280, 280]:
        for i in range(10):
            x = -432 + i * 96
            place(block(f"Coping_{y}_{i}", (x, y, 3), (94, 22, 10), 3), "Boundary", edge)
            place(block(f"Plinth_{y}_{i}", (x, y, -8), (95, 24, 14), 2), "Boundary", stone)
    for x in [-462, 462]:
        for i in range(6):
            y = -237.5 + i * 95
            place(block(f"Side_coping_{x}_{i}", (x, y, 3), (24, 93, 10), 3), "Boundary", edge)
    # Far boundary monuments frame the arena; foreground stays cut away.
    for i, x in enumerate([-410, -225, 225, 410]):
        place(block(f"Tomb_marker_{i}", (x, 284, 29), (40, 24, 58), 5), "Boundary", stone)
        place(block(f"Marker_cap_{i}", (x, 284, 59), (44, 24, 8), 5), "Boundary", edge)
        place(block(f"Marker_seal_{i}", (x, 270, 35), (13, 3, 23), 3), "Boundary", bronze)
        branch = tube(
            f"Boundary_root_{i}",
            [
                ((x - 34, 285, 5), 5, 5),
                ((x - 12, 282, 16), 6, 6),
                ((x + 6, 284, 36), 4, 4),
                ((x + 10, 284, 65), 1.5, 1.5),
            ],
            8,
        )
        place(branch, "Boundary", roots)
        place(block(f"Moss_cap_{i}", (x + 6, 283, 64), (15, 14, 2), 4), "Boundary", moss)
    # The complete column fits its radius-30 collision disc, including cap and roots.
    pillar_forms: list[tuple[str, list[tuple[Point, float, float]], bpy.types.Material]] = [
        ("Pillar_base", [((0, 0, 0), 30, 30), ((0, 0, 8), 30, 30), ((0, 0, 12), 24, 24)], edge),
        ("Pillar_shaft", [((0, 0, 8), 21, 21), ((0, 0, 63), 19, 19), ((0, 0, 72), 22, 22)], stone),
        ("Pillar_cap", [((0, 0, 70), 23, 23), ((0, 0, 74), 30, 30), ((0, 0, 81), 30, 30)], edge),
    ]
    for name, sections, mat in pillar_forms:
        place(loft(name, sections, 12), "Pillar", mat)
    for i, angle in enumerate([0.4, 2.5, 4.7]):
        rows: list[tuple[Point, float, float]] = []
        for z, radius, width, turn in [
            (3, 24, 4, 0),
            (20, 20, 4, 0.2),
            (43, 19, 3, 0.5),
            (68, 23, 1.5, 0.8),
        ]:
            a = angle + turn
            rows.append(((radius * math.cos(a), radius * math.sin(a), z), width, width))
        place(tube(f"Pillar_root_{i}", rows, 8), "Pillar", roots)
    lantern_forms: list[tuple[str, list[tuple[Point, float, float]], bpy.types.Material]] = [
        ("Lantern_foot", [((0, 0, 0), 8, 8), ((0, 0, 5), 8, 8), ((0, 0, 7), 5.5, 5.5)], edge),
        ("Lantern_stem", [((0, 0, 5), 4, 4), ((0, 0, 28), 4, 4), ((0, 0, 30), 7, 7)], bronze),
        (
            "Lantern_light",
            [((0, 0, 30), 4.5, 4.5), ((0, 0, 36), 5, 5), ((0, 0, 40), 3.5, 3.5)],
            glow,
        ),
        ("Lantern_roof", [((0, 0, 40), 7, 7), ((0, 0, 44), 2, 2)], bronze),
    ]
    for name, sections, mat in lantern_forms:
        place(loft(name, sections, 8), "Lantern", mat)
    # Save coherent editable meshes per material instead of a draw call for every slab.
    for root in groups.values():
        materials = {
            present(mesh_data(obj).materials[0]) for obj in root.children if obj.type == "MESH"
        }
        for mat in materials:
            candidates = [
                o
                for o in root.children
                if o.type == "MESH" and mesh_data(o).materials[0] == mat and o.name != "Pillar_cap"
            ]
            if len(candidates) < 2:
                continue
            bpy.ops.object.select_all(action="DESELECT")
            for obj in candidates:
                obj.select_set(True)
            present(bpy.context.view_layer).objects.active = candidates[0]
            bpy.ops.object.join()
            active_object().name = f"{root.name}_{mat.name.split(' · ')[-1].replace(' ', '_')}"
    present(bpy.context.scene)["environment_kind"] = "sepulcher"
