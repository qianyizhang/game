"""Small static architecture primitives shared by the authored regional kits."""

from __future__ import annotations

from typing import TYPE_CHECKING

from hero_form import mesh
from native_types import active_object, mesh_data, present

if TYPE_CHECKING:
    import bpy


def block(
    name: str, center: tuple[float, float, float], size: tuple[float, float, float]
) -> bpy.types.Object:
    x, y, z = center
    w, d, h = size
    b = min(2.0, w / 5, d / 5)
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


def join_parts(groups: dict[str, bpy.types.Object]) -> None:
    """Join repeated material surfaces, retaining the independently editable pillar cap."""
    import bpy

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
