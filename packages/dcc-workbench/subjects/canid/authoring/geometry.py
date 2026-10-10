"""Connected, skinned canid master. Bootstrap geometry is never rerun during motion fitting."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

from native_types import active_object, color_socket, float_socket, mesh_data, present, require
from parameters import FEET, Form, Point, contact_offset, paw_origin
from rig import activate

if TYPE_CHECKING:
    import bpy


def material(name: str, color: Point, roughness: float = 0.65) -> bpy.types.Material:
    import bpy

    result = bpy.data.materials.new(name)
    result.diffuse_color = (*color, 1)
    result.use_nodes = True
    shader = require(
        present(result.node_tree).nodes.get("Principled BSDF"), bpy.types.ShaderNodeBsdfPrincipled
    )
    color_socket(present(shader.inputs)["Base Color"]).default_value = (*color, 1)
    float_socket(present(shader.inputs)["Roughness"]).default_value = roughness
    return result


def ellipsoid(name: str, center: Point, scale: Point, form: Form) -> bpy.types.Object:
    import bpy

    bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=20, location=form.point(center))
    obj = active_object()
    obj.name = name
    obj.scale = (scale[0] * form.length, scale[1] * form.width, scale[2] * form.height)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def tube(name: str, points: list[Point], radii: list[float], form: Form) -> bpy.types.Object:
    import bpy

    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 10
    curve.bevel_depth = 1
    curve.bevel_resolution = 4
    curve.use_fill_caps = True
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, xyz, radius in zip(spline.bezier_points, points, radii, strict=True):
        point.co = form.point(xyz)
        point.radius = radius
        point.handle_left_type = point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    present(bpy.context.scene).collection.objects.link(obj)
    activate(obj)
    bpy.ops.object.convert(target="MESH")
    return obj


def bind(
    obj: bpy.types.Object, rig: bpy.types.Object, form: Form, rigid: str | None = None
) -> None:
    import bpy

    if rigid:
        group = obj.vertex_groups.new(name=rigid)
        group.add(list(range(len(mesh_data(obj).vertices))), 1, "REPLACE")
        modifier = require(
            obj.modifiers.new("Skin | articulated canid", "ARMATURE"), bpy.types.ArmatureModifier
        )
        modifier.object = rig
        obj.parent = rig
    else:
        activate(rig)
        obj.select_set(True)
        bpy.ops.object.parent_set(type="ARMATURE_AUTO")
        activate(obj)
        bpy.ops.object.vertex_group_limit_total(limit=4)
        bpy.ops.object.vertex_group_normalize_all(lock_active=False)
    for polygon in mesh_data(obj).polygons:
        polygon.use_smooth = True


def ground_soles(body: bpy.types.Object, form: Form) -> None:
    """Flatten paw pads and pin a real toe vertex for stance/heel-roll verification."""
    from mathutils import Vector

    data = mesh_data(body)
    probes: dict[str, int] = {}
    for foot in FEET:
        origin = Vector(form.point(paw_origin(foot)))
        pivot = origin + Vector(contact_offset(form))
        candidates = []
        for vertex in data.vertices:
            delta = vertex.co - origin
            if (
                abs(delta.x) < 0.31 * form.length
                and abs(delta.y) < 0.135 * form.width
                and vertex.co.z < 0.22 * form.height
            ):
                if vertex.co.z < 0.025 * form.height:
                    vertex.co.z = max(0.0, (vertex.co.x - pivot.x) * 0.60)
                # Shallow toe clefts on the top of the pad, with quiet continuous roots.
                lateral = abs(delta.y / form.width)
                if 0.12 < delta.x / form.length < 0.29 and vertex.co.z > 0.07 * form.height:
                    import math

                    vertex.co.z -= 0.014 * math.exp(-(((lateral - 0.033) / 0.013) ** 2))
                for group in body.vertex_groups:
                    group.remove([vertex.index])
                body.vertex_groups[f"paw.{foot}"].add([vertex.index], 1, "REPLACE")
                candidates.append(vertex)
        nearest = min(candidates, key=lambda v: (v.co - pivot).length)
        nearest.co = pivot
        probes[foot] = nearest.index
    body["sole_probes"] = json.dumps(probes)
