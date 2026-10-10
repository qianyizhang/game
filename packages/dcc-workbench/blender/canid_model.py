"""Connected, skinned canid master. Bootstrap geometry is never rerun during motion fitting."""

from __future__ import annotations

import json
import math
from typing import TYPE_CHECKING

from canid_rig import Form, Point, activate
from native_types import active_object, color_socket, float_socket, mesh_data, present, require

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

    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=form.point(center))
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
            obj.modifiers.new("Skin | canid-v1", "ARMATURE"), bpy.types.ArmatureModifier
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
    """Flatten the supporting sole and keep its vertices rigid on the paw bone."""
    data = mesh_data(body)
    minimum = min(vertex.co.z for vertex in data.vertices)
    probes: dict[str, int] = {}
    for vertex in data.vertices:
        x, y = vertex.co.x / form.length, vertex.co.y / form.width
        z = 0.12 + (vertex.co.z - 0.12) / form.height
        if -1.02 < x < 1.03 and z < 0.3:
            influence = max(0.0, min(1.0, (0.3 - z) / 0.12))
            vertex.co.z -= minimum * influence
            if z < 0.18:
                foot = f"{'front' if x > 0 else 'hind'}.{'L' if y > 0 else 'R'}"
                for group in body.vertex_groups:
                    group.remove([vertex.index])
                body.vertex_groups[f"paw.{foot}"].add([vertex.index], 1, "REPLACE")
                if foot not in probes or vertex.co.z < data.vertices[probes[foot]].co.z:
                    probes[foot] = vertex.index
    if len(probes) != 4:
        raise ValueError("Missing supporting sole")
    # Align each individual supporting point; asymmetrical remesh sampling can differ.
    for foot, index in probes.items():
        offset = data.vertices[index].co.z
        for vertex in data.vertices:
            if (
                len(vertex.groups) == 1
                and vertex.groups[0].group == body.vertex_groups[f"paw.{foot}"].index
            ):
                vertex.co.z -= offset
    body["sole_probes"] = json.dumps(probes)


def build_character(form: Form, rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Vector

    pieces = []
    anatomy: list[tuple[Point, Point]] = [
        ((0.04, 0, 1.25), (0.78, 0.285, 0.36)),
        ((0.45, 0, 1.26), (0.37, 0.32, 0.44)),
        ((-0.62, 0, 1.23), (0.35, 0.29, 0.35)),
        ((-0.25, 0, 1.17), (0.49, 0.235, 0.25)),
        ((0.7, 0, 1.49), (0.32, 0.27, 0.38)),
        ((0.89, 0, 1.62), (0.3, 0.23, 0.31)),
        ((1.12, 0, 1.74), (0.32, 0.215, 0.245)),
        ((1.37, 0, 1.64), (0.32, 0.15, 0.14)),
        ((1.56, 0, 1.64), (0.21, 0.105, 0.105)),
        ((1.33, 0, 1.55), (0.25, 0.115, 0.078)),
    ]
    for side in (-1, 1):
        y = side * 0.26
        anatomy.extend(
            [
                ((0.59, y * 0.78, 1.23), (0.22, 0.16, 0.35)),
                ((0.75, y, 0.105), (0.15, 0.092, 0.09)),
                ((-0.67, y * 0.85, 1.18), (0.20, 0.15, 0.26)),
                ((-0.72, y, 0.105), (0.15, 0.09, 0.09)),
                ((1.27, side * 0.175, 1.79), (0.17, 0.075, 0.07)),
                ((0.96, side * 0.16, 1.62), (0.24, 0.13, 0.23)),
            ]
        )
    for i, (center, scale) in enumerate(anatomy):
        pieces.append(ellipsoid(f"mass.{i}", center, scale, form))
    for side in (-1, 1):
        y = side * 0.26
        pieces.append(
            tube(
                "Foreleg",
                [
                    (0.61, y, 1.32),
                    (0.51, y, 1.04),
                    (0.47, y, 0.81),
                    (0.58, y, 0.48),
                    (0.65, y, 0.22),
                    (0.74, y, 0.105),
                ],
                [0.17, 0.13, 0.085, 0.059, 0.049, 0.072],
                form,
            )
        )
        pieces.append(
            tube(
                "Hindleg",
                [
                    (-0.68, y, 1.24),
                    (-0.55, y, 1.0),
                    (-0.42, y, 0.83),
                    (-0.68, y, 0.49),
                    (-0.83, y, 0.25),
                    (-0.72, y, 0.105),
                ],
                [0.19, 0.15, 0.105, 0.068, 0.053, 0.07],
                form,
            )
        )
    pieces.append(
        tube(
            "Brush",
            [
                (-0.87, 0, 1.27),
                (-1.13, 0, 1.11),
                (-1.4, 0.02, 0.88),
                (-1.6, 0.04, 0.61),
                (-1.73, 0.08, 0.34),
            ],
            [0.15, 0.18, 0.175, 0.14, 0.006],
            form,
        )
    )
    bpy.ops.object.select_all(action="DESELECT")
    for obj in pieces:
        obj.select_set(True)
    present(bpy.context.view_layer).objects.active = pieces[0]
    bpy.ops.object.join()
    body = active_object()
    body.name = "Coat"
    mesh_data(body).remesh_voxel_size = 0.028
    bpy.ops.object.voxel_remesh()
    smooth = require(
        body.modifiers.new("Connected transitions", "SMOOTH"), bpy.types.SmoothModifier
    )
    smooth.factor, smooth.iterations = 1.2, 5
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    decimate = require(
        body.modifiers.new("Working topology", "DECIMATE"), bpy.types.DecimateModifier
    )
    decimate.ratio = 0.6
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    coat = material("Coat | regional pigment", (0.3, 0.3, 0.3))
    data = mesh_data(body)
    data.materials.append(coat)
    colors = require(
        data.color_attributes.new(name="Pigment", type="FLOAT_COLOR", domain="POINT"),
        bpy.types.FloatColorAttribute,
    )
    palettes = {
        "ash": ((0.16, 0.18, 0.19), (0.46, 0.43, 0.35), (0.72, 0.66, 0.51)),
        "russet": ((0.17, 0.047, 0.018), (0.5, 0.19, 0.055), (0.82, 0.72, 0.52)),
        "moss": ((0.064, 0.085, 0.067), (0.24, 0.29, 0.19), (0.61, 0.6, 0.42)),
    }
    dark, mid, pale = palettes[form.name]
    for vertex in data.vertices:
        x = vertex.co.x / form.length
        y = abs(vertex.co.y / form.width)
        z = 0.12 + (vertex.co.z - 0.12) / form.height
        top = max(0, min(1, (z - 1.15) / 0.4)) if x < 1.1 else max(0, min(1, (z - 1.67) / 0.22))
        light = max(0, min(1, (1.1 - z) / 0.25)) if x < 1.05 else max(0, min(1, (1.66 - z) / 0.12))
        if x > 0.4 and y < 0.17 and z < 1.4:
            light = max(light, 0.8)
        if form.name == "russet" and z < 0.32:
            light = 1
        value = [mid[k] * (1 - top * 0.8) + dark[k] * top * 0.8 for k in range(3)]
        value = [value[k] * (1 - light * 0.85) + pale[k] * light * 0.85 for k in range(3)]
        require(colors.data[vertex.index], bpy.types.FloatColorAttributeValue).color = (*value, 1)
    nodes = present(coat.node_tree).nodes
    attr = require(nodes.new("ShaderNodeVertexColor"), bpy.types.ShaderNodeVertexColor)
    attr.layer_name = "Pigment"
    present(coat.node_tree).links.new(
        present(attr.outputs)["Color"], present(nodes["Principled BSDF"].inputs)["Base Color"]
    )
    bind(body, rig, form)
    ground_soles(body, form)
    black = material("Nose and lip | charcoal", (0.012, 0.017, 0.019), 0.34)
    iris = material("Eye | warm amber", (0.56, 0.25, 0.045), 0.25)
    ear_mat = material("Ear | warm shadow", (0.15, 0.075, 0.057))
    outer = material("Ear | coat", mid)
    nose = ellipsoid("Nose", (1.726, 0, 1.654), (0.071, 0.096, 0.071), form)
    mesh_data(nose).materials.append(black)
    bind(nose, rig, form, "head")
    for side in (-1, 1):
        for name, center, scale, mat in [
            ("Socket", (1.304, side * 0.189, 1.762), (0.075, 0.035, 0.047), black),
            ("Eye", (1.325, side * 0.211, 1.766), (0.039, 0.021, 0.027), iris),
            ("Pupil", (1.338, side * 0.229, 1.768), (0.019, 0.008, 0.021), black),
        ]:
            obj = ellipsoid(f"{name}.{side}", center, scale, form)
            mesh_data(obj).materials.append(mat)
            bind(obj, rig, form, "head")
        # Tapered ear with a broad fitted root, shallow inner bowl, and pointed tip.
        vertices = []
        for center, rx, ry in [
            ((1.04, side * 0.15, 1.81), 0.14, 0.095),
            ((1.02, side * 0.19, 2.03), 0.085, 0.052),
            ((1.06, side * 0.23, 2.19), 0.008, 0.008),
        ]:
            for k in range(12):
                angle = k * math.tau / 12
                vertices.append(
                    form.point(
                        (
                            center[0] + rx * math.cos(angle),
                            center[1] + ry * math.sin(angle),
                            center[2],
                        )
                    )
                )
        faces: list[tuple[int, ...]] = [
            (i * 12 + k, i * 12 + (k + 1) % 12, (i + 1) * 12 + (k + 1) % 12, (i + 1) * 12 + k)
            for i in range(2)
            for k in range(12)
        ]
        faces.append(tuple(range(24, 36)))
        mesh = bpy.data.meshes.new("Ear")
        mesh.from_pydata(vertices, [], faces)
        mesh.materials.append(outer)
        mesh.materials.append(ear_mat)
        obj = bpy.data.objects.new(f"Ear.{side}", mesh)
        present(bpy.context.scene).collection.objects.link(obj)
        for poly in mesh.polygons:
            if poly.center.x > form.point((1.04, 0, 0))[0]:
                poly.material_index = 1
        bind(obj, rig, form, "head")
        # A narrow mouth crease follows the muzzle instead of cutting a detached jaw.
        curve = bpy.data.curves.new("Lip", "CURVE")
        curve.dimensions = "3D"
        curve.bevel_depth = 0.008
        curve.bevel_resolution = 2
        spline = curve.splines.new("BEZIER")
        spline.bezier_points.add(2)
        for p, xyz in zip(
            spline.bezier_points,
            [(1.22, side * 0.137, 1.56), (1.46, side * 0.116, 1.568), (1.66, side * 0.079, 1.591)],
            strict=True,
        ):
            p.co = form.point(xyz)
            p.handle_left_type = p.handle_right_type = "AUTO"
        obj = bpy.data.objects.new(f"Lip.{side}", curve)
        present(bpy.context.scene).collection.objects.link(obj)
        activate(obj)
        bpy.ops.object.convert(target="MESH")
        mesh_data(obj).materials.append(black)
        bind(obj, rig, form, "head")
    # Native camera and lighting are review aids, excluded from delivery.
    scene = present(bpy.context.scene)
    scene.world = bpy.data.worlds.new("Studio")
    scene.world.color = (0.18, 0.18, 0.18)
    bpy.ops.object.camera_add(location=(4.3, -6.8, 3.0))
    camera = active_object()
    camera.rotation_euler = (
        (Vector((0, 0, 1)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    )
    require(camera.data, bpy.types.Camera).type = "ORTHO"
    require(camera.data, bpy.types.Camera).ortho_scale = 4.8
    scene.camera = camera
    for location, energy, size in [
        ((2, -4, 6), 850, 5),
        ((-3, 2, 4), 1000, 4),
        ((1, 4, 3), 450, 3),
    ]:
        bpy.ops.object.light_add(type="AREA", location=location)
        lamp_object = active_object()
        lamp = require(lamp_object.data, bpy.types.AreaLight)
        lamp.energy, lamp.shape, lamp.size = energy, "DISK", size
        lamp_object.rotation_euler = (
            (Vector((0, 0, 1)) - lamp_object.location).to_track_quat("-Z", "Y").to_euler()
        )
    activate(rig)
