"""Fresh boar sculpt: continuous wedge, loaded shoulders, split hooves and fitted tusks."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from boar_rig import FEET, Point, activate, hoof, joints
from native_types import active_object, color_socket, float_socket, mesh_data, present, require

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

            def smooth(value: float) -> float:
                value = max(0.0, min(1.0, value))
                return value * value * (3 - 2 * value)

            head = smooth((x - 0.33) / 0.49)
            chest = smooth((x + 0.68) / 0.68)
            weights = {
                "head": head,
                "chest": (1 - head) * chest,
                "pelvis": (1 - head) * (1 - chest),
            }
            # Blend into the nearby limb volume continuously. A hard z/x/y
            # region split tears the neck underside during deep rooting.
            foot = ("fore" if x > -0.18 else "rear") + (".L" if y > 0 else ".R")
            distances = {}
            for name in [f"upper.{foot}", f"lower.{foot}"]:
                a, b = segments[name]
                d = b - a
                closest = a + d * max(0, min(1, (v.co - a).dot(d) / d.length_squared))
                distances[name] = (v.co - closest).length
            leg = smooth((0.86 - z) / 0.30) * (1 - smooth((min(distances.values()) - 0.11) / 0.15))
            leg *= 1 - smooth((x - 0.55) / 0.24)
            weights = {name: weight * (1 - leg) for name, weight in weights.items()}
            limb_weights = {
                name: 1 / max(0.025, distance) ** 5 for name, distance in distances.items()
            }
            total = sum(limb_weights.values())
            weights.update({name: weight / total * leg for name, weight in limb_weights.items()})
        total = sum(weights.values())
        for name, weight in weights.items():
            if weight > 0:
                groups[name].add([v.index], weight / total, "REPLACE")
    modifier = require(obj.modifiers.new("Boar skin", "ARMATURE"), bpy.types.ArmatureModifier)
    modifier.object, obj.parent = rig, rig
    for polygon in data.polygons:
        polygon.use_smooth = True


def build(rig: bpy.types.Object) -> None:
    import bpy

    coat = material("Slate umber · coarse living coat", (0.18, 0.125, 0.085))
    crest = material("Charcoal bristle ridge", (0.075, 0.058, 0.044))
    horn = material("Hoof keratin", (0.07, 0.063, 0.053), 0.49)
    ivory = material("Warm worn ivory", (0.63, 0.48, 0.29), 0.4)
    snout = material("Snout leather", (0.21, 0.13, 0.10), 0.58)
    dark = material("Nostril and mouth recess", (0.022, 0.018, 0.015), 0.7)
    eye = material("Deep amber eye", (0.16, 0.074, 0.018), 0.25)
    parts = [
        loft(
            "Body block",
            [
                (-1.24, 1.00, 0.12, 0.19),
                (-1.10, 1.00, 0.37, 0.39),
                (-0.72, 1.03, 0.47, 0.48),
                (-0.25, 1.07, 0.51, 0.54),
                (0.18, 1.11, 0.49, 0.61),
                (0.48, 1.10, 0.37, 0.55),
                (0.73, 1.02, 0.25, 0.38),
            ],
        )
    ]
    parts.append(
        loft(
            "Head wedge",
            [
                (0.42, 1.07, 0.27, 0.36),
                (0.72, 1.06, 0.34, 0.38),
                (0.99, 0.89, 0.29, 0.30),
                (1.28, 0.74, 0.215, 0.215),
                (1.62, 0.65, 0.20, 0.16),
            ],
        )
    )
    for foot in FEET:
        x, y, _ = hoof(foot)
        fore = foot.startswith("fore")
        parts.append(
            sphere(
                f"Shoulder {foot}",
                (0.38 if fore else -0.83, y * 0.87, 0.94),
                (0.30 if fore else 0.32, 0.235, 0.42),
            )
        )
        parts.append(
            tube(
                f"Limb {foot}",
                [
                    (0.44 if fore else -0.83, y, 0.94),
                    (0.27 if fore else -0.57, y, 0.55),
                    (x, y, 0.19),
                ],
                [0.18, 0.12, 0.087],
            )
        )
    activate(parts[0])
    for obj in parts:
        obj.select_set(True)
    bpy.ops.object.join()
    body = active_object()
    body.name = "Boar hide"
    remesh = require(body.modifiers.new("Continuous anatomy", "REMESH"), bpy.types.RemeshModifier)
    remesh.mode, remesh.voxel_size, remesh.use_smooth_shade = "VOXEL", 0.028, True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth = require(body.modifiers.new("Broad planes", "SMOOTH"), bpy.types.SmoothModifier)
    smooth.factor, smooth.iterations = 0.65, 4
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    sub = require(body.modifiers.new("Soft silhouette", "SUBSURF"), bpy.types.SubsurfModifier)
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)
    mesh_data(body).materials.append(coat)
    bind(body, rig)

    def piece(obj: bpy.types.Object, mat: bpy.types.Material, bone: str) -> None:
        mesh_data(obj).materials.append(mat)
        bind(obj, rig, bone)

    # Each hoof has two real separated digits with a level bearing sole.
    for foot in FEET:
        x, y, _ = hoof(foot)
        for digit, offset in enumerate((-0.054, 0.054)):
            points = [
                (x + dx, y + offset + dy, z)
                for z, width, rear, front in [
                    (0.012, 0.047, -0.083, 0.17),
                    (0.21, 0.036, -0.060, 0.095),
                ]
                for dx, dy in [(rear, -width), (front, -width), (front, width), (rear, width)]
            ]
            obj = mesh(
                f"Hoof {foot} digit {digit + 1}",
                points,
                [
                    (3, 2, 1, 0),
                    (4, 5, 6, 7),
                    (0, 1, 5, 4),
                    (1, 2, 6, 5),
                    (2, 3, 7, 6),
                    (3, 0, 4, 7),
                ],
            )
            activate(obj)
            bevel = require(obj.modifiers.new("Worn hoof rim", "BEVEL"), bpy.types.BevelModifier)
            bevel.width, bevel.segments = 0.012, 3
            bpy.ops.object.modifier_apply(modifier=bevel.name)
            piece(obj, horn, f"hoof.{foot}")
    piece(sphere("Nasal disk", (1.642, 0, 0.65), (0.065, 0.215, 0.162)), snout, "head")
    for side, sign in [("L", 1), ("R", -1)]:
        piece(
            sphere(f"Nostril {side}", (1.699, sign * 0.104, 0.679), (0.015, 0.036, 0.026)),
            dark,
            "head",
        )
        piece(sphere(f"Eye {side}", (0.94, sign * 0.279, 1.10), (0.065, 0.033, 0.043)), eye, "head")
        piece(
            tube(
                f"Brow {side}",
                [
                    (0.80, sign * 0.278, 1.145),
                    (0.91, sign * 0.305, 1.155),
                    (1.02, sign * 0.273, 1.13),
                ],
                [0.033, 0.039, 0.017],
            ),
            coat,
            "head",
        )
        piece(
            tube(
                f"Mouth {side}",
                [
                    (1.12, sign * 0.20, 0.62),
                    (1.23, sign * 0.203, 0.562),
                    (1.58, sign * 0.176, 0.545),
                ],
                [0.005, 0.007, 0.004],
            ),
            dark,
            "head",
        )
        piece(
            tube(
                f"Lower tusk {side}",
                [
                    (0.98, sign * 0.19, 0.66),
                    (1.18, sign * 0.33, 0.64),
                    (1.30, sign * 0.365, 0.76),
                    (1.31, sign * 0.34, 0.96),
                ],
                [0.078, 0.057, 0.034, 0.001],
            ),
            ivory,
            "head",
        )
        # Rooted flattened rings retain the ear silhouette after subdivision.
        points = []
        faces: list[tuple[int, ...]] = []
        sections = [
            (0.64, 0.20, 1.31, 0.13, 0.055),
            (0.64, 0.29, 1.43, 0.18, 0.05),
            (0.69, 0.42, 1.57, 0.16, 0.035),
            (0.79, 0.53, 1.65, 0.075, 0.02),
            (0.84, 0.55, 1.65, 0.008, 0.004),
        ]
        for cx, cy, cz, width, thickness in sections:
            for i in range(12):
                angle = i * math.tau / 12
                points.append(
                    (
                        cx + width * math.cos(angle),
                        sign * (cy - thickness * math.sin(angle) * 0.75),
                        cz + thickness * math.sin(angle) * 0.65,
                    )
                )
        for j in range(4):
            for i in range(12):
                a, b = j * 12 + i, j * 12 + (i + 1) % 12
                faces.append((a, b, b + 12, a + 12))
        faces.extend([tuple(reversed(range(12))), tuple(range(48, 60))])
        obj = mesh(f"Cupped ear {side}", points, faces)
        activate(obj)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode="OBJECT")
        sub = require(obj.modifiers.new("Ear softness", "SUBSURF"), bpy.types.SubsurfModifier)
        sub.levels = 2
        bpy.ops.object.modifier_apply(modifier=sub.name)
        piece(obj, coat, f"ear.{side}")
    ridge = loft(
        "Rooted bristle mantle",
        [
            (-1.07, 1.40, 0.015, 0.02),
            (-0.85, 1.51, 0.07, 0.07),
            (-0.5, 1.58, 0.085, 0.07),
            (-0.15, 1.65, 0.09, 0.075),
            (0.18, 1.70, 0.08, 0.075),
            (0.42, 1.65, 0.03, 0.03),
        ],
    )
    mesh_data(ridge).materials.append(crest)
    bind(ridge, rig)
    for i in range(13):
        x = -0.88 + i * 0.097
        z = 1.56 + 0.19 * math.sin((i / 15) * math.pi / 2)
        height = 0.028 + (i % 3) * 0.012
        obj = tube(
            f"Bristle tips {i}",
            [(x, 0, z - 0.045), (x - 0.06, 0, z), (x - 0.12, 0, z + height)],
            [0.031, 0.022, 0.001],
        )
        piece(obj, crest, "pelvis" if x < -0.4 else "chest")
    piece(
        tube(
            "Short curled tail",
            [(-1.16, 0, 1.14), (-1.38, 0.025, 1.02), (-1.48, 0.08, 0.80), (-1.40, 0.12, 0.70)],
            [0.055, 0.041, 0.025, 0.008],
        ),
        coat,
        "tail",
    )
    activate(rig)
