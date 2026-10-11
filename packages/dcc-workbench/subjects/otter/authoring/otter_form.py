"""Fresh otter sculpt: continuous long back, broad muzzle, webbed paws and tapered tail."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from native_types import active_object, color_socket, float_socket, mesh_data, present, require
from otter_rig import FEET, Point, activate, joints, paw

if TYPE_CHECKING:
    import bpy


def material(name: str, color: Point, rough: float = 0.8) -> bpy.types.Material:
    import bpy

    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = require(
        present(mat.node_tree).nodes.get("Principled BSDF"), bpy.types.ShaderNodeBsdfPrincipled
    )
    color_socket(present(shader.inputs)["Base Color"]).default_value = (*color, 1)
    float_socket(present(shader.inputs)["Roughness"]).default_value = rough
    return mat


def sphere(name: str, center: Point, scale: Point) -> bpy.types.Object:
    import bpy

    bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=18, location=center)
    obj = active_object()
    obj.name, obj.scale = name, scale
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def mesh(name: str, points: list[Point], faces: list[tuple[int, ...]]) -> bpy.types.Object:
    import bpy

    data = bpy.data.meshes.new(name)
    data.from_pydata(points, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    present(bpy.context.scene).collection.objects.link(obj)
    return obj


def loft(name: str, sections: list[tuple[float, float, float, float]]) -> bpy.types.Object:
    points: list[Point] = []
    faces: list[tuple[int, ...]] = []
    count = 32
    for x, z, width, height in sections:
        points.extend(
            (x, width * math.cos(i * math.tau / count), z + height * math.sin(i * math.tau / count))
            for i in range(count)
        )
    for j in range(len(sections) - 1):
        for i in range(count):
            a, b = j * count + i, j * count + (i + 1) % count
            faces.append((a, b, b + count, a + count))
    faces.extend(
        [
            tuple(reversed(range(count))),
            tuple(range((len(sections) - 1) * count, len(sections) * count)),
        ]
    )
    return mesh(name, points, faces)


def tube(name: str, points: list[Point], radii: list[float]) -> bpy.types.Object:
    import bpy

    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions, data.resolution_u = "3D", 12
    data.bevel_depth, data.bevel_resolution, data.use_fill_caps = 1, 3, True
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for p, xyz, radius in zip(spline.bezier_points, points, radii, strict=True):
        p.co, p.radius = xyz, radius
        p.handle_left_type = p.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, data)
    present(bpy.context.scene).collection.objects.link(obj)
    activate(obj)
    bpy.ops.object.convert(target="MESH")
    return obj


def smooth(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def bind(obj: bpy.types.Object, rig: bpy.types.Object, rigid: str | None = None) -> None:
    import bpy
    from mathutils import Vector

    data = mesh_data(obj)
    groups = {n: obj.vertex_groups.new(name=n) for n, _, _, _ in joints()}
    segments = {n: (Vector(a), Vector(b)) for n, a, b, _ in joints()}
    for v in data.vertices:
        x, y, z = v.co.x, v.co.y, v.co.z
        if rigid:
            weights = {rigid: 1.0}
        else:
            # Smooth longitudinal partitions give the long mustelid back a continuous bend.
            head = smooth((x - 0.55) / 0.45)
            chest = smooth((x + 0.10) / 0.54)
            spine = smooth((x + 0.95) / 0.68)
            weights = {
                "head": head,
                "chest": (1 - head) * chest,
                "spine": (1 - head) * (1 - chest) * spine,
                "pelvis": (1 - head) * (1 - chest) * (1 - spine),
            }
            if x < -1.35:
                tail = smooth((-x - 1.35) / 0.34)
                second = smooth((-x - 1.83) / 0.42)
                third = smooth((-x - 2.28) / 0.40)
                weights = {name: weight * (1 - tail) for name, weight in weights.items()}
                weights.update(
                    {
                        "tail.01": tail * (1 - second),
                        "tail.02": tail * second * (1 - third),
                        "tail.03": tail * second * third,
                    }
                )
            foot = ("fore" if x > -0.3 else "rear") + (".L" if y > 0 else ".R")
            distances = {}
            for name in [f"upper.{foot}", f"lower.{foot}"]:
                a, b = segments[name]
                d = b - a
                closest = a + d * max(0, min(1, (v.co - a).dot(d) / d.length_squared))
                distances[name] = (v.co - closest).length
            limb = (
                smooth((0.57 - z) / 0.26)
                * (1 - smooth((min(distances.values()) - 0.085) / 0.15))
                * (1 - smooth((x - 0.65) / 0.18))
                * (1 - smooth((-x - 1.25) / 0.20))
            )
            limb *= smooth((abs(y) - 0.15) / 0.12)
            weights = {name: weight * (1 - limb) for name, weight in weights.items()}
            local = {name: 1 / max(0.025, distance) ** 4 for name, distance in distances.items()}
            total = sum(local.values())
            weights.update({name: weight / total * limb for name, weight in local.items()})
        # Four influences is the consumer interface; normalize after dropping negligible weights.
        weights = dict(sorted(weights.items(), key=lambda pair: pair[1], reverse=True)[:4])
        total = sum(weights.values())
        for name, weight in weights.items():
            if weight > 0:
                groups[name].add([v.index], weight / total, "REPLACE")
    modifier = require(obj.modifiers.new("Otter skin", "ARMATURE"), bpy.types.ArmatureModifier)
    modifier.object, obj.parent = rig, rig
    for p in data.polygons:
        p.use_smooth = True


def build(rig: bpy.types.Object) -> None:
    import bpy

    coat = material("Chestnut · dense short living coat", (0.22, 0.115, 0.062), 0.64)
    pale = material("Silvery warm throat", (0.46, 0.36, 0.245), 0.78)
    nose = material("Wet umber nose", (0.035, 0.022, 0.016), 0.34)
    eye = material("Obsidian brown eyes", (0.014, 0.009, 0.006), 0.16)
    claw = material("Small dark claws", (0.07, 0.049, 0.030), 0.52)
    whisker = material("Ivory whiskers", (0.66, 0.59, 0.46), 0.62)
    parts = [
        loft(
            "Long torso",
            [
                (-1.51, 0.61, 0.15, 0.18),
                (-1.31, 0.64, 0.31, 0.30),
                (-1.08, 0.65, 0.37, 0.34),
                (-0.71, 0.65, 0.34, 0.32),
                (-0.28, 0.65, 0.30, 0.30),
                (0.14, 0.67, 0.30, 0.31),
                (0.48, 0.72, 0.29, 0.29),
                (0.78, 0.79, 0.27, 0.26),
            ],
        )
    ]
    parts.append(
        loft(
            "Broad integrated neck and skull",
            [
                (0.50, 0.75, 0.26, 0.24),
                (0.80, 0.84, 0.29, 0.26),
                (1.02, 0.86, 0.30, 0.26),
                (1.22, 0.82, 0.255, 0.215),
                (1.43, 0.78, 0.19, 0.135),
                (1.57, 0.78, 0.125, 0.10),
            ],
        )
    )
    for sign in (-1, 1):
        parts.append(
            sphere("Integrated whisker cheek", (1.37, sign * 0.12, 0.775), (0.23, 0.145, 0.115))
        )
    parts.append(
        loft(
            "Muscular tail continuation",
            [
                (-2.96, 0.15, 0.006, 0.006),
                (-2.76, 0.19, 0.048, 0.035),
                (-2.51, 0.24, 0.086, 0.059),
                (-2.21, 0.32, 0.125, 0.081),
                (-1.91, 0.42, 0.172, 0.12),
                (-1.63, 0.56, 0.23, 0.165),
                (-1.37, 0.63, 0.29, 0.235),
            ],
        )
    )
    for foot in FEET:
        x, y, z = paw(foot)
        fore = foot.startswith("fore")
        parts.append(
            sphere(
                f"Rooted limb mass {foot}",
                (0.44 if fore else -1.11, y * 0.84, 0.54),
                (0.205 if fore else 0.26, 0.17, 0.23),
            )
        )
        parts.append(
            tube(
                f"Short limb {foot}",
                [
                    (0.43 if fore else -1.11, y, 0.61),
                    (0.25 if fore else -0.85, y, 0.33),
                    (x, y, 0.125),
                ],
                [0.115, 0.083, 0.067],
            )
        )
    activate(parts[0])
    for obj in parts:
        obj.select_set(True)
    bpy.ops.object.join()
    body = active_object()
    body.name = "Otter continuous hide"
    remesh = require(
        body.modifiers.new("Connected soft anatomy", "REMESH"), bpy.types.RemeshModifier
    )
    remesh.mode, remesh.voxel_size, remesh.use_smooth_shade = "VOXEL", 0.024, True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smoothing = require(
        body.modifiers.new("Quiet sculpt planes", "SMOOTH"), bpy.types.SmoothModifier
    )
    smoothing.factor, smoothing.iterations = 0.6, 5
    bpy.ops.object.modifier_apply(modifier=smoothing.name)
    sub = require(
        body.modifiers.new("Soft rounded silhouette", "SUBSURF"), bpy.types.SubsurfModifier
    )
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)
    data = mesh_data(body)
    data.materials.append(coat)
    data.materials.append(pale)
    # A quiet lighter throat/muzzle, cut into the connected sculpt rather than attached discs.
    for polygon in data.polygons:
        x, y, z = polygon.center.x, polygon.center.y, polygon.center.z
        if (x > 1.18 and z < 0.84) or (0.30 < x < 1.18 and z < 0.69):
            polygon.material_index = 1
    bind(body, rig)

    def piece(obj: bpy.types.Object, mat: bpy.types.Material, bone: str) -> None:
        mesh_data(obj).materials.append(mat)
        bind(obj, rig, bone)

    for foot in FEET:
        x, y, _ = paw(foot)
        # A continuous broad web bears on a flat sole; five toes emerge at its front rim.
        sections = [(0.018, 0.15, -0.075, 0.20), (0.11, 0.12, -0.072, 0.15)]
        points = [
            (x + dx, y + dy, z)
            for z, width, rear, front in sections
            for dx, dy in [(rear, -width), (front, -width), (front, width), (rear, width)]
        ]
        obj = mesh(
            f"Paw web {foot}",
            points,
            [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)],
        )
        activate(obj)
        bevel = require(obj.modifiers.new("Rounded web rim", "BEVEL"), bpy.types.BevelModifier)
        bevel.width, bevel.segments = 0.035, 4
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        piece(obj, coat, f"paw.{foot}")
        for i in range(5):
            offset = (i - 2) * 0.058
            dx = 0.16 + 0.035 * (1 - abs(i - 2) / 2)
            obj = sphere(
                f"Paw {foot} toe {i + 1}", (x + dx, y + offset, 0.057), (0.093, 0.038, 0.039)
            )
            piece(obj, coat, f"paw.{foot}")
            piece(
                sphere(
                    f"Claw {foot} {i + 1}",
                    (x + dx + 0.077, y + offset, 0.057),
                    (0.036, 0.014, 0.012),
                ),
                claw,
                f"paw.{foot}",
            )
    piece(sphere("Broad soft nose", (1.596, 0, 0.82), (0.051, 0.12, 0.065)), nose, "head")
    for side, sign in [("L", 1), ("R", -1)]:
        piece(
            sphere(f"Eye {side}", (1.17, sign * 0.239, 0.939), (0.060, 0.025, 0.050)), eye, "head"
        )
        piece(
            tube(
                f"Upper eyelid {side}",
                [
                    (1.11, sign * 0.24, 0.959),
                    (1.166, sign * 0.256, 0.979),
                    (1.22, sign * 0.23, 0.956),
                ],
                [0.013, 0.016, 0.009],
            ),
            coat,
            "head",
        )
        piece(
            sphere(f"Small round ear {side}", (0.91, sign * 0.275, 1.055), (0.087, 0.055, 0.103)),
            coat,
            f"ear.{side}",
        )
        piece(
            sphere(f"Ear cup {side}", (0.932, sign * 0.313, 1.061), (0.060, 0.018, 0.064)),
            pale,
            f"ear.{side}",
        )
        piece(
            tube(
                f"Mouth crease {side}",
                [
                    (1.57, sign * 0.027, 0.739),
                    (1.43, sign * 0.13, 0.716),
                    (1.27, sign * 0.165, 0.728),
                ],
                [0.004, 0.006, 0.002],
            ),
            nose,
            "head",
        )
        for i in range(5):
            root = (
                1.405 - 0.035 * (i % 2),
                sign * (0.183 + 0.012 * (i % 2)),
                0.775 + (i - 2) * 0.023,
            )
            tip = (
                1.34 - 0.08 * (i - 2),
                sign * (0.56 - 0.018 * abs(i - 2)),
                0.77 + (i - 2) * 0.071,
            )
            mid = ((root[0] + tip[0]) * 0.5, sign * 0.38, (root[2] + tip[2]) * 0.5 + 0.025)
            piece(
                tube(f"Whisker {side} {i + 1}", [root, mid, tip], [0.005, 0.0035, 0.0008]),
                whisker,
                "head",
            )
    activate(rig)
