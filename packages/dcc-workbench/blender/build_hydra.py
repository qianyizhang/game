"""Briar Hydra recipe. Build a fresh editable candidate; export never reruns this recipe."""

from __future__ import annotations

import sys
from collections.abc import Sequence
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import bpy
    from mathutils import Vector

    Point = tuple[float, float, float] | Vector

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from authoring_plan import AuthoringRequest, animation_name, parse_request  # noqa: E402
from head_components import install_heads  # noqa: E402
from native_types import (  # noqa: E402
    active_object,
    color_socket,
    cycles_settings,
    float_socket,
    mesh_data,
    present,
    require,
)
from scale_components import install_scales  # noqa: E402


def build(request: AuthoringRequest) -> None:
    from math import cos, pi, sin

    import bpy
    from mathutils import Matrix, Vector

    mod: bpy.types.Modifier
    action_name = animation_name(request.root)
    if request.output.exists():
        raise ValueError("Refusing to overwrite an existing Blender source")
    request.output.parent.mkdir(parents=True, exist_ok=True)
    scene = require(bpy.context.scene, bpy.types.Scene)
    view_layer = require(bpy.context.view_layer, bpy.types.ViewLayer)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.name != "Collection":
            bpy.data.collections.remove(collection)
    asset = require(bpy.data.collections.get("Collection"), bpy.types.Collection)
    asset.name = "DELIVERY | Briar Hydra"
    construction = bpy.data.collections.new("CONSTRUCTION | editable Bezier gestures")
    scene.collection.children.link(construction)
    construction.hide_render = True
    construction.hide_viewport = True

    def material(
        name: str, color: tuple[float, float, float], roughness: float = 0.6, metallic: float = 0
    ) -> bpy.types.Material:
        m = bpy.data.materials.new(name)
        m.diffuse_color = (*color, 1)
        m.use_nodes = True
        bsdf = require(
            require(m.node_tree, bpy.types.ShaderNodeTree).nodes.get("Principled BSDF"),
            bpy.types.ShaderNodeBsdfPrincipled,
        )
        color_socket(present(bsdf.inputs)["Base Color"]).default_value = (*color, 1)
        float_socket(present(bsdf.inputs)["Roughness"]).default_value = roughness
        float_socket(present(bsdf.inputs)["Metallic"]).default_value = metallic
        return m

    skin = material("Marsh skin | baked pigment", (0.12, 0.205, 0.135), 0.58)
    plate = material("Throat | warm worn keratin", (0.25, 0.27, 0.15), 0.64)
    armor = material("Dorsal shields | deep olive", (0.065, 0.12, 0.081), 0.52)
    horn = material("Horn | weathered ivory", (0.42, 0.37, 0.24), 0.48)
    material("Horn tip | dark umber", (0.16, 0.12, 0.07), 0.5)
    mouth = material("Mouth | oxblood", (0.095, 0.018, 0.021), 0.48)
    eye_mat = material("Iris | amber", (0.79, 0.31, 0.035), 0.27)
    pupil_mat = material("Pupil | obsidian", (0.005, 0.009, 0.006), 0.19)
    tooth = material("Teeth | old ivory", (0.66, 0.61, 0.42), 0.35)

    def active(obj: bpy.types.Object) -> None:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        view_layer.objects.active = obj

    def finish(
        obj: bpy.types.Object, name: str, mat: bpy.types.Material | None
    ) -> bpy.types.Object:
        obj.name = name
        if mat:
            mesh_data(obj).materials.append(mat)
        if obj.type == "MESH":
            for p in mesh_data(obj).polygons:
                p.use_smooth = True
        return obj

    def ellipsoid(
        name: str,
        center: Point,
        scale: Point,
        mat: bpy.types.Material,
        segments: int = 24,
        rings: int = 16,
    ) -> bpy.types.Object:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=center)
        obj = active_object()
        obj.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        return finish(obj, name, mat)

    def curve(
        name: str,
        points: Sequence[Point],
        radii: Sequence[float],
        mat: bpy.types.Material,
        resolution: int = 8,
        bevel: int = 5,
        keep: bool = False,
    ) -> bpy.types.Object:
        data = bpy.data.curves.new(name, "CURVE")
        data.dimensions = "3D"
        data.resolution_u = resolution
        data.bevel_depth = 1
        data.bevel_resolution = bevel
        data.use_fill_caps = True
        spline = data.splines.new("BEZIER")
        spline.bezier_points.add(len(points) - 1)
        for p, xyz, radius in zip(spline.bezier_points, points, radii, strict=True):
            p.co = xyz
            p.radius = radius
            p.handle_left_type = "AUTO"
            p.handle_right_type = "AUTO"
        obj = bpy.data.objects.new(name, data)
        asset.objects.link(obj)
        if keep:
            original = obj.copy()
            original.data = data.copy()
            original.name = name + " | editable source"
            construction.objects.link(original)
        active(obj)
        bpy.ops.object.convert(target="MESH")
        return finish(active_object(), name, mat)

    def joined(
        objects: Sequence[bpy.types.Object],
        name: str,
        mat: bpy.types.Material,
        voxel: float | None = None,
        subdiv: bool = False,
    ) -> bpy.types.Object:
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        obj = active_object()
        obj.name = name
        mesh_data(obj).materials.clear()
        mesh_data(obj).materials.append(mat)
        mod: bpy.types.Modifier
        if voxel:
            mod = require(
                obj.modifiers.new("Sculpt union | voxel remesh", "REMESH"), bpy.types.RemeshModifier
            )
            mod.mode = "VOXEL"
            mod.voxel_size = voxel
            mod.use_smooth_shade = True
            bpy.ops.object.modifier_apply(modifier=mod.name)
            mod = require(
                obj.modifiers.new("Relax anatomical transitions", "SMOOTH"),
                bpy.types.SmoothModifier,
            )
            mod.factor = 1.3
            mod.iterations = 5
            bpy.ops.object.modifier_apply(modifier=mod.name)
        if subdiv:
            mod = require(
                obj.modifiers.new("Surface finish | editable subdivision", "SUBSURF"),
                bpy.types.SubsurfModifier,
            )
            mod.levels = 1
            mod.render_levels = 1
        for p in mesh_data(obj).polygons:
            p.use_smooth = True
        return obj

    # Every neck has its own gesture and a smooth, fused root.
    paths = [
        [
            (0, 0.18, 0.44),
            (-0.10, 0.20, 0.88),
            (-0.18, 0.25, 1.43),
            (0.02, 0.15, 2.02),
            (0.12, -0.18, 2.51),
            (0.06, -0.40, 2.80),
        ],
        [
            (-0.27, 0.10, 0.44),
            (-0.56, 0.15, 0.79),
            (-0.84, 0.12, 1.13),
            (-1.00, -0.03, 1.37),
            (-1.03, -0.35, 1.56),
            (-1.08, -0.50, 1.67),
        ],
        [
            (0.28, 0.16, 0.43),
            (0.62, 0.29, 0.82),
            (0.88, 0.32, 1.24),
            (0.99, 0.23, 1.65),
            (0.89, -0.02, 1.99),
            (0.77, -0.23, 2.13),
        ],
    ]
    radii = [
        [0.30, 0.25, 0.195, 0.16, 0.138, 0.155],
        [0.29, 0.245, 0.20, 0.16, 0.136, 0.15],
        [0.30, 0.255, 0.20, 0.163, 0.14, 0.15],
    ]
    coil_points = []
    coil_radii = []
    for i in range(17):
        t = i / 16
        a = t * 2 * pi * 1.11 + 0.1
        r = 0.53 + 0.64 * sin(t * pi / 2)
        coil_points.append((r * cos(a), 0.12 + r * sin(a) * 0.76, 0.29 - 0.19 * t))
        coil_radii.append(0.32 * (1 - t) ** 0.66 + 0.008)
    # Bury the start cap inside the saddle; an exposed cap creates a planar coil seam.
    coil_points.insert(0, (0, 0.16, 0.44))
    coil_radii.insert(0, 0.34)
    parts = [ellipsoid("Shoulder saddle", (0, 0.16, 0.48), (0.61, 0.45, 0.33), skin)]
    parts.append(curve("Coil gesture", coil_points, coil_radii, skin, keep=True))
    for i, path in enumerate(paths):
        parts.append(curve(f"Neck {i + 1} gesture", path, radii[i], skin, keep=True))
    body = joined(parts, "Skin | fused shoulder, necks and anchored coil", skin, 0.038, True)
    body["construction"] = "Bezier profiles, voxel remesh, smooth relaxation, live subdivision"

    # Rig the continuous skin; no independent head objects pretending to bend a neck.
    arm_data = bpy.data.armatures.new("Hydra deformation skeleton")
    rig = bpy.data.objects.new("RIG | Briar Hydra", arm_data)
    asset.objects.link(rig)
    active(rig)
    bpy.ops.object.mode_set(mode="EDIT")
    root_bone = arm_data.edit_bones.new("Coil.anchor")
    root_bone.head = (0, 0.15, 0.2)
    root_bone.tail = (0, 0.15, 0.55)
    for i, path in enumerate(paths):
        previous = root_bone
        for j in range(len(path) - 1):
            bone = arm_data.edit_bones.new(f"Neck.{i}.{j}")
            bone.head = path[j]
            bone.tail = path[j + 1]
            bone.parent = previous
            previous = bone
        head = arm_data.edit_bones.new(f"Head.{i}")
        head.head = path[-1]
        head.tail = Vector(path[-1]) + Vector((0, -0.46, 0.02))
        head.parent = previous
        jaw = arm_data.edit_bones.new(f"Jaw.{i}")
        jaw.head = Vector(path[-1]) + Vector((0, -0.08, -0.10))
        jaw.tail = jaw.head + Vector((0, -0.40, -0.02))
        jaw.parent = head
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.show_in_front = True
    pose = require(rig.pose, bpy.types.Pose)
    arm_data.display_type = "BBONE"

    def attach(obj: bpy.types.Object, bone: str | None = None) -> bpy.types.Object:
        obj.parent = rig
        mod = require(
            obj.modifiers.new("Hydra | deformation", "ARMATURE"), bpy.types.ArmatureModifier
        )
        mod.object = rig
        if bone:
            obj.vertex_groups.new(name=bone).add(
                list(range(len(mesh_data(obj).vertices))), 1, "REPLACE"
            )
        return obj

    def weights_for_point(p: Vector) -> list[tuple[str, float]]:
        if p.z < 0.58:
            return [("Coil.anchor", 1)]
        best = None
        for i, path in enumerate(paths):
            for j in range(len(path) - 1):
                a, b = Vector(path[j]), Vector(path[j + 1])
                t = max(0, min(1, (p - a).dot(b - a) / (b - a).length_squared))
                distance = (p - a - (b - a) * t).length
                if best is None or distance < best[0]:
                    best = (distance, i, j, t)
        if best is None:
            raise ValueError("No neck gesture segments")
        _, i, j, t = best
        # Blend adjacent bone frames around the segment midpoint.
        if t < 0.5:
            prev = f"Neck.{i}.{j - 1}" if j else "Coil.anchor"
            result = [(prev, 0.5 - t), (f"Neck.{i}.{j}", 0.5 + t)]
        else:
            nxt = f"Neck.{i}.{j + 1}" if j < 4 else f"Head.{i}"
            result = [(f"Neck.{i}.{j}", 1.5 - t), (nxt, t - 0.5)]
        return [(n, w) for n, w in result if w > 0.00001]

    attach(body)
    for rest_bone in arm_data.bones:
        body.vertex_groups.new(name=rest_bone.name)
    for vertex in mesh_data(body).vertices:
        p = body.matrix_world @ vertex.co
        for name, weight in weights_for_point(p):
            body.vertex_groups[name].add([vertex.index], weight, "REPLACE")

    def attach_neck_detail(obj: bpy.types.Object) -> None:
        attach(obj)
        for vertex in mesh_data(obj).vertices:
            p = obj.matrix_world @ vertex.co
            for name, weight in weights_for_point(p):
                group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                group.add([vertex.index], weight, "REPLACE")

    # Curved throat scutes overlap into a ventral plane, with quiet shoulders below.
    for i, path in enumerate(paths):
        for j in range(2, 23):
            f = j / 23 * 4.65
            k = min(4, int(f))
            t = f - k
            center = Vector(path[k]).lerp(Vector(path[k + 1]), t)
            radius = radii[i][k] * (1 - t) + radii[i][k + 1] * t
            tangent = (Vector(path[k + 1]) - Vector(path[k])).normalized()
            lateral = require(Vector((1, 0, 0)) - tangent * tangent.x, Vector).normalized()
            front = require(lateral.cross(tangent), Vector).normalized()
            verts = []
            for row in range(3):
                length = (row - 1) * 0.048
                for column in range(9):
                    angle = (column / 8 - 0.5) * 2.0
                    raised = (1 - abs(column - 4) / 4) * 0.012
                    r = radius * 0.99 + raised
                    v = (
                        center
                        + tangent * length
                        + lateral * (sin(angle) * r)
                        + front * (cos(angle) * r)
                    )
                    verts.append(v)
            faces: list[tuple[int, ...]] = [
                (row * 9 + c, row * 9 + c + 1, (row + 1) * 9 + c + 1, (row + 1) * 9 + c)
                for row in range(2)
                for c in range(8)
            ]
            mesh = bpy.data.meshes.new(f"Throat plate cage.{i}.{j}")
            mesh.from_pydata(verts, [], faces)
            mesh.update()
            obj = bpy.data.objects.new(f"Throat.{i}.{j} | fitted transverse scute", mesh)
            asset.objects.link(obj)
            finish(obj, obj.name, plate)
            active(obj)
            mod = require(
                obj.modifiers.new("Thin keratin shell", "SOLIDIFY"), bpy.types.SolidifyModifier
            )
            mod.thickness = 0.008
            bpy.ops.object.modifier_apply(modifier=mod.name)
            attach_neck_detail(obj)
        # A sparse swept dorsal crest follows the back of each neck.
        for j in range(3, 11):
            f = j / 11 * 4.8
            k = min(4, int(f))
            t = f - k
            p = Vector(path[k]).lerp(Vector(path[k + 1]), t)
            r = radii[i][k] * (1 - t) + radii[i][k + 1] * t
            p.y += r * 0.85
            length = 0.16 + 0.055 * sin(j * 0.65)
            obj = curve(
                f"Crest.{i}.{j}",
                [p, p + Vector((0, 0.08, 0.055)), p + Vector((0, length, 0.10))],
                [0.058, 0.044, 0.002],
                armor,
                4,
                2,
            )
            attach_neck_detail(obj)

    # Skull parts are fused before ornament. A wedge-shaped muzzle and hooded eyes.
    for i, path in enumerate(paths):
        c = Vector(path[-1])
        scale = [1.02, 0.88, 0.94][i]
        yaw = [0.03, -0.37, 0.32][i]
        rot = Matrix.Rotation(yaw, 4, "Z")

        def pt(
            x: float,
            y: float,
            z: float,
            center: Vector = c,
            rotation: Matrix = rot,
            factor: float = scale,
        ) -> Vector:
            return center + (rotation @ Vector((x * factor, y * factor, z * factor)))

        # A native quad cage creates cranial planes instead of a cluster of spheres.
        # Each ring specifies y, half-width, crown height and jaw-line height.
        rings = [
            (0.19, 0.105, 0.085, -0.08),
            (0.085, 0.225, 0.17, -0.11),
            (-0.095, 0.245, 0.15, -0.10),
            (-0.25, 0.205, 0.105, -0.068),
            (-0.46, 0.171, 0.061, -0.051),
            (-0.60, 0.119, 0.042, -0.037),
        ]
        verts = []
        for y, w, top, bottom in rings:
            mid = (top + bottom) * 0.5
            for x, z in [
                (0, top),
                (w * 0.70, top * 0.92),
                (w, mid + 0.027),
                (w * 0.92, bottom + 0.025),
                (w * 0.6, bottom),
                (0, bottom),
                (-w * 0.6, bottom),
                (-w * 0.92, bottom + 0.025),
                (-w, mid + 0.027),
                (-w * 0.7, top * 0.92),
            ]:
                verts.append(pt(x, y, z))
        faces = []
        for r in range(len(rings) - 1):
            for a in range(10):
                faces.append(
                    (
                        r * 10 + a,
                        r * 10 + (a + 1) % 10,
                        (r + 1) * 10 + (a + 1) % 10,
                        (r + 1) * 10 + a,
                    )
                )
        faces += [tuple(reversed(range(10))), tuple((len(rings) - 1) * 10 + a for a in range(10))]
        mesh = bpy.data.meshes.new(f"Skull cage.{i}")
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        skull = bpy.data.objects.new(f"Skull.{i} | sculpted cranial cage", mesh)
        asset.objects.link(skull)
        finish(skull, skull.name, skin)
        active(skull)
        # Recalculate winding and keep subdivision editable in the artist source.
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode="OBJECT")
        mod = require(
            skull.modifiers.new("Cranial planes | subdivision", "SUBSURF"),
            bpy.types.SubsurfModifier,
        )
        mod.levels = 2
        mod.render_levels = 2
        attach(skull, f"Head.{i}")
        jaw_obj = ellipsoid(
            f"Jaw.{i} | fitted lower mandible",
            pt(0, -0.30, -0.14),
            (0.17 * scale, 0.31 * scale, 0.043 * scale),
            skin,
        )
        jaw_obj.rotation_euler.z = yaw
        attach(jaw_obj, f"Jaw.{i}")
        # Oral planes lie inside the skull and mandible, not over the lip edges.
        for lower in [False, True]:
            obj = ellipsoid(
                f"Oral.{'lower' if lower else 'upper'}.{i}",
                pt(0, -0.29, -0.102 if not lower else -0.11),
                (0.155 * scale, 0.26 * scale, 0.023 * scale),
                mouth,
                24,
                10,
            )
            obj.rotation_euler.z = yaw
            attach(obj, f"Jaw.{i}" if lower else f"Head.{i}")
        for side in [-1, 1]:
            # Eyes are mostly buried in the temple; small dark slits sit on amber.
            eye = ellipsoid(
                f"Eye.{i}.{side}",
                pt(side * 0.210, -0.15, 0.044),
                (0.026 * scale, 0.051 * scale, 0.027 * scale),
                eye_mat,
                20,
                12,
            )
            eye.rotation_euler.z = yaw
            attach(eye, f"Head.{i}")
            pupil = ellipsoid(
                f"Pupil.{i}.{side}",
                pt(side * 0.233, -0.162, 0.044),
                (0.006 * scale, 0.009 * scale, 0.022 * scale),
                pupil_mat,
                16,
                10,
            )
            pupil.rotation_euler.z = yaw
            attach(pupil, f"Head.{i}")
            brow = curve(
                f"Brow.{i}.{side}",
                [
                    pt(side * 0.13, -0.30, 0.074),
                    pt(side * 0.222, -0.16, 0.081),
                    pt(side * 0.215, 0.025, 0.102),
                ],
                [0.018, 0.025, 0.013],
                armor,
                6,
                3,
            )
            attach(brow, f"Head.{i}")
            nostril = ellipsoid(
                f"Nostril.{i}.{side}",
                pt(side * 0.094, -0.52, 0.037),
                (0.023, 0.031, 0.008),
                pupil_mat,
                16,
                8,
            )
            nostril.rotation_euler.z = yaw
            attach(nostril, f"Head.{i}")
            # Swept horns retain editable native curve sources in the construction collection.
            tip = 0.39 if not (i == 1 and side == -1) else 0.25
            points = [
                pt(side * 0.15, 0.055, 0.145),
                pt(side * 0.24, 0.18, 0.255),
                pt(side * 0.30, 0.36, tip),
                pt(side * 0.25, 0.53, tip + 0.08),
            ]
            obj = curve(
                f"Crown horn.{i}.{side}", points, [0.085, 0.063, 0.029, 0.0015], horn, 9, 4, True
            )
            attach(obj, f"Head.{i}")
            # A lower cheek spur helps the head read from the rear.
            obj = curve(
                f"Cheek spur.{i}.{side}",
                [
                    pt(side * 0.21, 0.05, -0.055),
                    pt(side * 0.32, 0.20, -0.015),
                    pt(side * 0.38, 0.34, 0.10),
                ],
                [0.062, 0.041, 0.001],
                armor,
                6,
                3,
            )
            attach(obj, f"Head.{i}")
            # Individually fitted, uneven teeth; the longest pair sit back from the tip.
            for j in range(8):
                y = -0.49 + j * 0.045
                x = side * (0.107 + 0.04 * sin(j / 7 * pi))
                length = 0.047 + (0.032 if j == 2 else 0.009 * sin(j * 2.1))
                for lower in [False, True]:
                    z = -0.092 if not lower else -0.10
                    end = z - length if not lower else z + length * 0.66
                    obj = curve(
                        f"Tooth.{i}.{side}.{j}.{lower}",
                        [pt(x, y, z), pt(x * 0.97, y - 0.009, end)],
                        [0.013, 0.0006],
                        tooth,
                        2,
                        2,
                    )
                    attach(obj, f"Jaw.{i}" if lower else f"Head.{i}")
        # Central forehead shields have different sizes, avoiding a bead necklace.
        for j, (y, z, s) in enumerate(
            [(-0.13, 0.132, 0.082), (0.02, 0.162, 0.095), (0.16, 0.099, 0.063)]
        ):
            obj = ellipsoid(
                f"Crown shield.{i}.{j}",
                pt(0, y, z),
                (s * scale, 0.083 * scale, 0.013 * scale),
                armor,
                16,
                8,
            )
            obj.rotation_euler.z = yaw
            attach(obj, f"Head.{i}")

    # UVs and a real Blender procedural-material bake. This survives glTF delivery.
    # All skin objects share one packed pigment atlas. The shader remains in the file.
    skin_objects = [
        o for o in asset.objects if o.type == "MESH" and skin in list(mesh_data(o).materials)
    ]
    bpy.ops.object.select_all(action="DESELECT")
    for obj in skin_objects:
        obj.select_set(True)
    view_layer.objects.active = body
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.015)
    bpy.ops.object.mode_set(mode="OBJECT")
    tree = require(skin.node_tree, bpy.types.ShaderNodeTree)
    nodes = tree.nodes
    links = tree.links
    bsdf = require(nodes.get("Principled BSDF"), bpy.types.ShaderNodeBsdfPrincipled)
    texcoord = require(nodes.new("ShaderNodeTexCoord"), bpy.types.ShaderNodeTexCoord)
    noise = require(nodes.new("ShaderNodeTexNoise"), bpy.types.ShaderNodeTexNoise)
    float_socket(present(noise.inputs)["Scale"]).default_value = 8.5
    float_socket(present(noise.inputs)["Detail"]).default_value = 3.0
    links.new(present(texcoord.outputs)["Object"], present(noise.inputs)["Vector"])
    ramp = require(nodes.new("ShaderNodeValToRGB"), bpy.types.ShaderNodeValToRGB)
    require(ramp.color_ramp, bpy.types.ColorRamp).elements[0].position = 0.2
    require(ramp.color_ramp, bpy.types.ColorRamp).elements[0].color = (0.033, 0.065, 0.040, 1)
    require(ramp.color_ramp, bpy.types.ColorRamp).elements[1].position = 0.8
    require(ramp.color_ramp, bpy.types.ColorRamp).elements[1].color = (0.105, 0.155, 0.069, 1)
    links.new(present(noise.outputs)["Fac"], present(ramp.inputs)["Fac"])
    links.new(present(ramp.outputs)["Color"], present(bsdf.inputs)["Base Color"])
    image = bpy.data.images.new("Hydra | baked marsh pigment", width=2048, height=2048)
    # Generated enum contains only NONE; native baking verifies the configured color space.
    require(image.colorspace_settings, bpy.types.ColorManagedInputColorspaceSettings).name = "sRGB"  # type: ignore[assignment]
    bake_node = require(nodes.new("ShaderNodeTexImage"), bpy.types.ShaderNodeTexImage)
    bake_node.image = image
    nodes.active = bake_node

    # Generated 4.5 stubs omit the bundled Cycles engine; native build verifies it.
    scene.render.engine = "CYCLES"  # type: ignore[assignment]
    cycles_settings(scene.cycles).samples = 1
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False
    scene.render.bake.use_pass_color = True
    scene.render.bake.margin = 8
    # Bake one selected object at a time without clearing the shared atlas.
    scene.render.bake.use_clear = True
    for obj in skin_objects:
        active(obj)
        nodes.active = bake_node
        bpy.ops.object.bake(type="DIFFUSE")
        scene.render.bake.use_clear = False
    image.pack()
    voronoi = require(nodes.new("ShaderNodeTexVoronoi"), bpy.types.ShaderNodeTexVoronoi)
    voronoi.feature = "DISTANCE_TO_EDGE"
    float_socket(present(voronoi.inputs)["Scale"]).default_value = 72
    links.new(present(texcoord.outputs)["Object"], present(voronoi.inputs)["Vector"])
    bump = require(nodes.new("ShaderNodeBump"), bpy.types.ShaderNodeBump)
    float_socket(present(bump.inputs)["Strength"]).default_value = 0.32
    float_socket(present(bump.inputs)["Distance"]).default_value = 0.018
    links.new(present(voronoi.outputs)["Distance"], present(bump.inputs)["Height"])
    links.new(present(bump.outputs)["Normal"], present(bsdf.inputs)["Normal"])
    normal_image = bpy.data.images.new("Hydra | baked scale relief", width=2048, height=2048)
    require(
        normal_image.colorspace_settings, bpy.types.ColorManagedInputColorspaceSettings
    ).name = "Non-Color"  # type: ignore[assignment]
    normal_tex = require(nodes.new("ShaderNodeTexImage"), bpy.types.ShaderNodeTexImage)
    normal_tex.image = normal_image
    scene.render.bake.use_clear = True
    for obj in skin_objects:
        active(obj)
        nodes.active = normal_tex
        bpy.ops.object.bake(type="NORMAL")
        scene.render.bake.use_clear = False
    normal_image.pack()
    normal_map = require(nodes.new("ShaderNodeNormalMap"), bpy.types.ShaderNodeNormalMap)
    float_socket(present(normal_map.inputs)["Strength"]).default_value = 0.65
    links.new(present(normal_tex.outputs)["Color"], present(normal_map.inputs)["Color"])
    links.new(present(normal_map.outputs)["Normal"], present(bsdf.inputs)["Normal"])
    links.new(present(bake_node.outputs)["Color"], present(bsdf.inputs)["Base Color"])
    # Keep the procedural graph as an editable upstream source, disconnected at delivery.
    noise.label = "Authoring pigment — rebake after surface edits"
    ramp.label = "Authoring palette — baked to atlas"

    # Motion is one named Blender action, with different phases and fixed support.
    scene.frame_start = 1
    scene.frame_end = 145
    scene.render.fps = 24
    for f in range(1, 146, 3):
        t = (f - 1) / 144 * 2 * pi
        for i in range(3):
            phase = i * 1.7
            for j in range(5):
                pose_bone = pose.bones[f"Neck.{i}.{j}"]
                pose_bone.rotation_mode = "XYZ"
                influence = (j / 4) ** 1.3
                pose_bone.rotation_euler = (
                    0.018 * sin(t + phase - j * 0.30) * influence,
                    0.018 * sin(t + phase * 0.7) * influence,
                    0.028 * sin(t + phase - j * 0.25) * influence,
                )
                if i == 1 and j in (1, 2, 3):
                    # Preserve the author-reviewed searching-role revision in fresh builds.
                    offset = {
                        1: (0.0528920367, -0.0974007770, 0.1300596744),
                        2: (0.0608559698, -0.0522891097, 0.2087160945),
                        3: (0.1081512943, 0.0589239262, 0.0750417858),
                    }[j]
                    for axis in range(3):
                        pose_bone.rotation_euler[axis] += offset[axis]
                pose_bone.keyframe_insert("rotation_euler", frame=f, group=f"Neck {i + 1}")
            pose_head = pose.bones[f"Head.{i}"]
            pose_head.rotation_mode = "XYZ"
            pose_head.rotation_euler = (
                0.035 * sin(t + phase),
                0.045 * sin(t + phase + 0.6),
                0.055 * sin(t + phase),
            )
            pose_head.keyframe_insert("rotation_euler", frame=f, group=f"Head {i + 1}")
            pose_jaw = pose.bones[f"Jaw.{i}"]
            pose_jaw.rotation_mode = "XYZ"
            pose_jaw.rotation_euler = (
                [0.42, 0.07, 0.16][i] + ([0.14, 0.035, 0.06][i]) * (0.5 + 0.5 * sin(t + phase)),
                0,
                0,
            )
            pose_jaw.keyframe_insert("rotation_euler", frame=f, group=f"Jaw {i + 1}")
    action = require(require(rig.animation_data, bpy.types.AnimData).action, bpy.types.Action)
    action.name = action_name
    # Linear interpolation avoids unexpected handle overshoot; endpoints coincide.
    for curve_data in action.fcurves:
        for key in curve_data.keyframe_points:
            key.interpolation = "LINEAR"
    scene.frame_set(1)
    scene["dcc_brief"] = "briefs/briar-hydra.json"
    scene["dcc_recipe"] = "blender/build_hydra.py"
    scene["dcc_native_features"] = (
        "Bezier curves; voxel remesh; smooth; live subdivision; armature; F-curves; "
        "UV atlas; procedural pigment and normal bake"
    )
    scene["dcc_note"] = (
        "Editable source. Export preserves manual edits. "
        "Construction curves are retained separately."
    )
    # The file opens with the model and rig easy to inspect.
    active(body)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                space = require(area.spaces.active, bpy.types.SpaceView3D)
                region = require(space.region_3d, bpy.types.RegionView3D)
                region.view_distance = 5.8
                region.view_location = (0, 0, 1.4)
                require(space.shading, bpy.types.View3DShading).type = "MATERIAL"
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    install_heads(asset, rig)
    install_scales(asset, rig)
    bpy.ops.wm.save_as_mainfile(filepath=str(request.output), compress=True)
    print("DCC_SOURCE_SAVED", request.output)


def main(argv: list[str]) -> None:
    build(parse_request(argv, build=True))


if __name__ == "__main__":
    main(sys.argv)
