"""Regional coat pigment and fitted sculptural fur; no runtime procedural shader."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING, Protocol, runtime_checkable

from geometry import material
from native_types import float_socket, mesh_data, present, require
from parameters import Form, Point

if TYPE_CHECKING:
    import bpy


@runtime_checkable
class PixelArray(Protocol):
    def foreach_set(self, values: list[float]) -> None: ...


PALETTES = {
    "ash": ((0.055, 0.075, 0.092), (0.26, 0.30, 0.32), (0.70, 0.68, 0.58)),
    "russet": ((0.095, 0.024, 0.012), (0.44, 0.14, 0.037), (0.83, 0.72, 0.53)),
    "moss": ((0.035, 0.055, 0.043), (0.18, 0.24, 0.16), (0.62, 0.60, 0.43)),
}


def pigment(point: Point, form: Form) -> tuple[float, float, float, float]:
    x, y, z = point[0] / form.length, abs(point[1] / form.width), point[2] / form.height
    dark, mid, pale = PALETTES[form.name]
    saddle = max(0.0, min(1.0, (z - 1.18) / 0.3)) * max(0.0, min(1.0, (1.18 - x) / 0.45))
    light = (
        max(0.0, min(1.0, (1.06 - z) / 0.32)) if x < 0.8 else max(0.0, min(1.0, (1.74 - z) / 0.21))
    )
    if 0.45 < x < 0.98 and y < 0.22 and z < 1.45:
        light = max(light, 0.8)
    # Charcoal muzzle bridge / eye mask and pale lower cheek keep the face legible.
    if x > 1.08:
        saddle = max(saddle, max(0.0, min(0.8, (z - 1.72) / 0.14)))
    fleck = 1 + 0.035 * math.sin(x * 71 + y * 39) * math.sin(z * 97 - x * 23)
    value = [mid[k] * (1 - saddle * 0.78) + dark[k] * saddle * 0.78 for k in range(3)]
    result = [
        max(0.0, (value[k] * (1 - light * 0.86) + pale[k] * light * 0.86) * fleck) for k in range(3)
    ]
    return result[0], result[1], result[2], 1


def coat_material() -> bpy.types.Material:
    import bpy

    coat = material("Coat | directional short fur", (0.4, 0.4, 0.4), 0.88)
    nodes = present(coat.node_tree).nodes
    attr = require(nodes.new("ShaderNodeVertexColor"), bpy.types.ShaderNodeVertexColor)
    attr.layer_name = "Pigment"
    present(coat.node_tree).links.new(
        present(attr.outputs)["Color"], present(nodes["Principled BSDF"].inputs)["Base Color"]
    )
    # Small, seamless normal texture travels with the mesh through standard glTF.
    # The packed pixels are saved in the master; export does not rerun this recipe.
    size = 256
    texture = bpy.data.images.new("Short fur grain", width=size, height=size, alpha=True)
    color_space = "Non-Color"
    setattr(present(texture.colorspace_settings), "name", color_space)  # noqa: B010
    pixels: list[float] = []
    for row in range(size):
        for col in range(size):
            u, v = col / size, row / size
            angle = math.tau * (38 * v + 0.23 * math.sin(math.tau * 4 * u))
            nx = 0.035 * math.cos(angle) * math.cos(math.tau * 4 * u)
            ny = 0.22 * math.cos(angle) * (0.65 + 0.35 * math.sin(math.tau * 3 * u) ** 2)
            nz = math.sqrt(1 - nx * nx - ny * ny)
            pixels.extend((0.5 + nx * 0.5, 0.5 + ny * 0.5, 0.5 + nz * 0.5, 1))
    pixel_array: object = texture.pixels
    if not isinstance(pixel_array, PixelArray):
        raise TypeError("Missing native image pixel buffer")
    pixel_array.foreach_set(pixels)
    texture.pack()
    image_node = require(nodes.new("ShaderNodeTexImage"), bpy.types.ShaderNodeTexImage)
    image_node.image = texture
    normal = require(nodes.new("ShaderNodeNormalMap"), bpy.types.ShaderNodeNormalMap)
    normal.uv_map = "Coat flow"
    float_socket(present(normal.inputs)["Strength"]).default_value = 0.10
    links = present(coat.node_tree).links
    links.new(present(image_node.outputs)["Color"], present(normal.inputs)["Color"])
    links.new(present(normal.outputs)["Normal"], present(nodes["Principled BSDF"].inputs)["Normal"])
    return coat


def paint(obj: bpy.types.Object, form: Form, coat: bpy.types.Material) -> None:
    import bpy

    mesh = mesh_data(obj)
    mesh.materials.append(coat)
    colors = require(
        mesh.color_attributes.new(name="Pigment", type="FLOAT_COLOR", domain="POINT"),
        bpy.types.FloatColorAttribute,
    )
    for vertex in mesh.vertices:
        color = pigment((vertex.co.x, vertex.co.y, vertex.co.z), form)
        if vertex.co.z < 0.025 * form.height and vertex.normal.z < -0.65:
            color = (0.08, 0.075, 0.065, 1)
        require(colors.data[vertex.index], bpy.types.FloatColorAttributeValue).color = color
    uv = mesh.uv_layers.new(name="Coat flow")
    for polygon in mesh.polygons:
        for index in polygon.loop_indices:
            point = mesh.vertices[mesh.loops[index].vertex_index].co
            x, y, z = point.x / form.length, point.y / form.width, point.z / form.height
            uv.data[index].uv = (x * 0.75 + z * 0.23, math.atan2(y, z - 1.15) / math.tau)


def groom(body: bpy.types.Object, form: Form) -> None:
    """Shallow, directional relief on the continuous skin, strongest around the ruff.

    Broad locks belong to anatomy. These small ridges break smooth toy shading without
    attaching a tiled coat of detached scales or growing noisy detail across the flank.
    """
    data = mesh_data(body)
    data.update()
    for vertex in data.vertices:
        x, y, z = (
            vertex.co.x / form.length,
            abs(vertex.co.y / form.width),
            vertex.co.z / form.height,
        )
        neck = math.exp(-(((x - 0.66) / 0.32) ** 4)) * max(0.0, min(1.0, (z - 1.05) / 0.4))
        cheek = math.exp(-(((x - 1.01) / 0.17) ** 4) - ((z - 1.69) / 0.19) ** 4)
        thigh = math.exp(-(((x + 0.65) / 0.25) ** 4) - ((z - 1.1) / 0.32) ** 4)
        tail = max(0.0, min(1.0, (-x - 0.98) / 0.22))
        amplitude = max(neck * 0.009, cheek * 0.007, thigh * 0.005, tail * 0.008)
        mask = max(0.0, min(1.0, (y - 0.07) / 0.14))
        phase = 110 * (0.76 * x - 0.48 * z + 0.4 * y) + 0.7 * math.sin(23 * z + 13 * y)
        grain = math.sin(phase) * (0.5 + 0.5 * math.sin(17 * x + 19 * z))
        vertex.co += vertex.normal * (amplitude * mask * grain)
    data.update()
