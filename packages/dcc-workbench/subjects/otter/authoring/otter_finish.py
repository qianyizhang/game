"""Deliberate saved-sculpt refinement; never called by fitting or export."""

from __future__ import annotations

from pathlib import Path

from authoring_plan import save_working_source
from native_types import mesh_data, present, require
from otter_form import smooth
from otter_rig import activate


def refine(root: Path) -> None:
    import bpy

    path = root / "otter/source.blend"
    bpy.ops.wm.open_mainfile(filepath=str(path))
    body = bpy.data.objects["Otter continuous hide"]
    if body.get("finish_version"):
        raise ValueError("Finish already applied")
    data = mesh_data(body)
    for obj in present(bpy.context.scene).objects:
        if obj.type != "MESH":
            continue
        for v in mesh_data(obj).vertices:
            if v.co.x > 1.10:
                v.co.x = 1.10 + (v.co.x - 1.10) * 0.80
            if obj.name.startswith(("Small round ear", "Ear cup")):
                v.co.z = 0.995 + (v.co.z - 0.995) * 0.64
                sign = 1 if v.co.y > 0 else -1
                v.co.y = sign * 0.255 + (v.co.y - sign * 0.255) * 0.80
    # Local tail relaxation leaves the muscular root and body contour intact.
    activate(body)
    group = body.vertex_groups.new(name="Finish tail relaxation")
    for v in data.vertices:
        if v.co.x < -2.3:
            group.add([v.index], smooth((-v.co.x - 2.3) / 0.45), "REPLACE")
    modifier = require(body.modifiers.new("Tail tip quietness", "SMOOTH"), bpy.types.SmoothModifier)
    modifier.vertex_group = group.name
    modifier.factor = 0.6
    modifier.iterations = 5
    bpy.ops.object.modifier_move_up(modifier=modifier.name)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    body.vertex_groups.remove(present(body.vertex_groups.get("Finish tail relaxation")))
    data = mesh_data(body)
    data.materials.clear()
    mat = bpy.data.materials["Chestnut · dense short living coat"].copy()
    mat.name = "Pigmented otter hide"
    data.materials.append(mat)
    colors = require(
        data.color_attributes.new(name="Pigment", type="FLOAT_COLOR", domain="POINT"),
        bpy.types.FloatColorAttribute,
    )
    for vertex in data.vertices:
        x, z = vertex.co.x, vertex.co.z
        muzzle = smooth((x - 1.13) / 0.16) * smooth((0.96 - z) / 0.12)
        throat = (
            smooth((x - 0.12) / 0.34)
            * (1 - smooth((x - 1.30) / 0.15))
            * smooth((0.75 - z) / 0.20)
            * (1 - smooth((abs(vertex.co.y) - 0.15) / 0.12))
        )
        pale = max(muzzle, throat) * 0.83
        brown = (0.18, 0.079, 0.035)
        silver = (0.52, 0.42, 0.30)
        require(colors.data[vertex.index], bpy.types.FloatColorAttributeValue).color = (
            *[a + (b - a) * pale for a, b in zip(brown, silver, strict=True)],
            1,
        )
    nodes = present(mat.node_tree).nodes
    attr = require(nodes.new("ShaderNodeVertexColor"), bpy.types.ShaderNodeVertexColor)
    attr.layer_name = "Pigment"
    shader = require(present(nodes.get("Principled BSDF")), bpy.types.ShaderNodeBsdfPrincipled)
    present(mat.node_tree).links.new(
        present(attr.outputs)["Color"], present(shader.inputs)["Base Color"]
    )
    body["finish_version"] = 1
    data.update()
    save_working_source(path)
