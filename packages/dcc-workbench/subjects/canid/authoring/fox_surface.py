"""Fox regional pigment over the connected native sculpt."""

from __future__ import annotations

from typing import TYPE_CHECKING

from native_types import mesh_data, require
from parameters import Form
from surface import paint as base_paint

if TYPE_CHECKING:
    import bpy

PALETTES = {"fox": ((0.025, 0.016, 0.012), (0.62, 0.19, 0.045), (0.88, 0.81, 0.62))}


def paint(obj: bpy.types.Object, form: Form, coat: bpy.types.Material) -> None:
    import surface

    surface.PALETTES[form.name] = PALETTES[form.name]
    base_paint(obj, form, coat)
    recolor(obj, form)


def recolor(obj: bpy.types.Object, form: Form) -> None:
    import bpy

    mesh = mesh_data(obj)
    colors = require(mesh.color_attributes["Pigment"], bpy.types.FloatColorAttribute)
    dark, copper, cream = PALETTES[form.name]
    for vertex in mesh.vertices:
        x, y, z = (
            vertex.co.x / form.length,
            abs(vertex.co.y / form.width),
            vertex.co.z / form.height,
        )
        underside = max(0.0, min(1.0, (1.16 - z) / 0.18))
        center = max(0.0, min(1.0, (0.19 - y) / 0.10))
        pale = underside * center if -0.7 < x < 0.85 and z > 0.78 else 0.0
        if 0.65 < x < 1.0 and z > 0.85:
            pale = max(pale, max(0.0, min(1.0, (1.54 - z) / 0.2)) * center)
        if x > 1.0:
            pale = max(pale, max(0.0, min(1.0, (1.73 - z) / 0.11)))
        if x < -1.52:
            pale = max(pale, min(1.0, (-x - 1.52) / 0.14))
        stockings = max(0.0, min(1.0, (0.63 - z) / 0.16)) if x > -1.10 else 0.0
        dorsal = max(0.0, min(0.18, (z - 1.48) * 0.6)) if x < 0.8 else 0.0
        color = tuple(
            (copper[k] * (1 - pale) + cream[k] * pale) * (1 - stockings - dorsal)
            + dark[k] * (stockings + dorsal)
            for k in range(3)
        )
        require(colors.data[vertex.index], bpy.types.FloatColorAttributeValue).color = (*color, 1)
