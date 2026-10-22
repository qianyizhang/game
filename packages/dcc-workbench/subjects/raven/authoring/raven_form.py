"""Raven construction: connected breast, folded vanes, wedge bill and four-toed feet."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from native_types import active_object, color_socket, float_socket, mesh_data, present, require
from raven_rig import FEET, Point, activate, foot, joints

if TYPE_CHECKING:
    import bpy


def material(name: str, color: Point, rough: float = 0.8) -> bpy.types.Material:
    import bpy

    mat = bpy.data.materials.new(name)
    mat.diffuse_color.foreach_set((*color, 1))
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


def smooth(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def bind(
    obj: bpy.types.Object, rig: bpy.types.Object, rigid: str | None = None, wing: str | None = None
) -> None:
    import bpy
    from mathutils import Vector

    data = mesh_data(obj)
    groups = {n: obj.vertex_groups.new(name=n) for n, _, _, _ in joints()}
    segments = {n: (Vector(a), Vector(b)) for n, a, b, _ in joints()}
    for vertex in data.vertices:
        x, y, z = vertex.co.x, vertex.co.y, vertex.co.z
        if rigid:
            weights = {rigid: 1.0}
        elif wing:
            span = abs(y)
            elbow = smooth((span - 0.61) / 0.25)
            wrist = smooth((span - 1.10) / 0.26)
            root = smooth((span - 0.16) / 0.25)
            weights = {
                "body": 1 - root,
                f"shoulder.{wing}": root * (1 - elbow),
                f"elbow.{wing}": root * elbow * (1 - wrist),
                f"wrist.{wing}": root * wrist,
            }
        else:
            neck = smooth((z - 1.18) / 0.27) * smooth((x + 0.18) / 0.35)
            head = smooth((x - 0.20) / 0.20) * smooth((z - 1.40) / 0.17)
            weights = {"body": 1 - neck, "neck": neck * (1 - head), "head": neck * head}
            side = "L" if y > 0 else "R"
            distances = {}
            for n in [f"shank.{side}", f"tarsus.{side}"]:
                a, b = segments[n]
                d = b - a
                closest = a + d * max(0, min(1, (vertex.co - a).dot(d) / d.length_squared))
                distances[n] = (vertex.co - closest).length
            leg = smooth((0.83 - z) / 0.22) * (1 - smooth((min(distances.values()) - 0.055) / 0.13))
            weights = {n: w * (1 - leg) for n, w in weights.items()}
            limbs = {n: 1 / max(0.02, d) ** 4 for n, d in distances.items()}
            total = sum(limbs.values())
            weights.update({n: w / total * leg for n, w in limbs.items()})
        total = sum(weights.values())
        for n, w in weights.items():
            if w > 0:
                groups[n].add([vertex.index], w / total, "REPLACE")
    mod = require(obj.modifiers.new("Avian skin", "ARMATURE"), bpy.types.ArmatureModifier)
    mod.object, obj.parent = rig, rig
    for polygon in data.polygons:
        polygon.use_smooth = True


def finish(obj: bpy.types.Object, levels: int = 1) -> None:
    import bpy

    activate(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    if levels:
        sub = require(obj.modifiers.new("Soft sculpted vane", "SUBSURF"), bpy.types.SubsurfModifier)
        sub.levels = levels
        bpy.ops.object.modifier_apply(modifier=sub.name)


def feather(
    name: str, root: Point, tip: Point, width: float, thickness: float = 0.018
) -> bpy.types.Object:
    from mathutils import Vector

    a, b = Vector(root), Vector(tip)
    direction = (b - a).normalized()
    cross = require(direction.cross(Vector((0, 0, 1))), Vector).normalized()
    points: list[Point] = []
    faces: list[tuple[int, ...]] = []
    count = 10
    for t, w in [(0, 0.22), (0.15, 0.82), (0.42, 1), (0.75, 0.76), (0.94, 0.30), (1, 0.02)]:
        center = a + (b - a) * t + Vector((0, 0, 0.025 * math.sin(math.pi * t)))
        for i in range(count):
            angle = i * math.tau / count
            p = (
                center
                + cross * (width * w * math.cos(angle))
                + Vector((0, 0, thickness * math.sin(angle) * w))
            )
            points.append((p.x, p.y, p.z))
    for j in range(5):
        for i in range(count):
            aidx, bidx = j * count + i, j * count + (i + 1) % count
            faces.append((aidx, bidx, bidx + count, aidx + count))
    faces.extend([tuple(reversed(range(count))), tuple(range(50, 60))])
    obj = mesh(name, points, faces)
    finish(obj)
    return obj


def build(rig: bpy.types.Object) -> None:
    import bpy

    coat = material("Charcoal · living contour plumage", (0.025, 0.033, 0.047), 0.66)
    wingmat = material("Indigo graphite · flight vanes", (0.032, 0.047, 0.075), 0.46)
    cover = material("Blue slate · broad coverts", (0.041, 0.060, 0.085), 0.53)
    horn = material("Worn black keratin", (0.018, 0.022, 0.025), 0.37)
    legs = material("Scaly charcoal feet", (0.065, 0.070, 0.073), 0.70)
    iris = material("Obsidian eye", (0.006, 0.008, 0.010), 0.12)
    dark = material("Bill seam", (0.004, 0.005, 0.008), 0.82)
    parts = [
        loft(
            "Breast and rump",
            [
                (-0.73, 1.02, 0.045, 0.08),
                (-0.59, 1.07, 0.25, 0.25),
                (-0.35, 1.11, 0.34, 0.38),
                (-0.03, 1.19, 0.35, 0.42),
                (0.18, 1.33, 0.27, 0.38),
                (0.31, 1.46, 0.22, 0.32),
            ],
        ),
        sphere("Nape", (0.24, 0, 1.52), (0.26, 0.225, 0.36)),
        sphere("Long crown", (0.47, 0, 1.76), (0.32, 0.215, 0.21)),
        sphere("Jaw and cheek", (0.52, 0, 1.65), (0.245, 0.225, 0.17)),
    ]
    for side in FEET:
        y = foot(side)[1]
        parts.append(sphere(f"Feathered thigh {side}", (-0.12, y * 0.90, 0.79), (0.17, 0.14, 0.26)))
        parts.append(
            tube(
                f"Lower limb {side}",
                [(-0.04, y, 0.76), (-0.19, y, 0.37), (0, y, 0.085)],
                [0.070, 0.041, 0.032],
            )
        )
    activate(parts[0])
    for obj in parts:
        obj.select_set(True)
    bpy.ops.object.join()
    body = active_object()
    body.name = "Continuous breast nape and crown"
    remesh = require(
        body.modifiers.new("Connected living anatomy", "REMESH"), bpy.types.RemeshModifier
    )
    remesh.mode, remesh.voxel_size, remesh.use_smooth_shade = "VOXEL", 0.022, True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    mod = require(body.modifiers.new("Broad quiet planes", "SMOOTH"), bpy.types.SmoothModifier)
    mod.factor, mod.iterations = 0.65, 5
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mesh_data(body).materials.append(coat)
    bind(body, rig)

    def piece(obj: bpy.types.Object, mat: bpy.types.Material, bone: str) -> None:
        mesh_data(obj).materials.append(mat)
        bind(obj, rig, bone)

    # Deep, gently curved upper bill; an actual tapered closed volume.
    bill = loft(
        "Heavy raven bill",
        [
            (0.60, 1.73, 0.145, 0.125),
            (0.77, 1.73, 0.115, 0.103),
            (0.96, 1.70, 0.075, 0.068),
            (1.16, 1.645, 0.009, 0.012),
        ],
    )
    finish(bill, 2)
    piece(bill, horn, "head")
    jaw = loft(
        "Lower mandible",
        [(0.60, 1.63, 0.13, 0.056), (0.80, 1.63, 0.10, 0.045), (1.13, 1.638, 0.006, 0.008)],
    )
    finish(jaw, 2)
    piece(jaw, horn, "head")
    for side, s in [("L", 1), ("R", -1)]:
        piece(
            sphere(f"Inset eye {side}", (0.55, s * 0.204, 1.79), (0.045, 0.015, 0.038)),
            iris,
            "head",
        )
        piece(
            tube(
                f"Fitted orbital brow {side}",
                [(0.46, s * 0.208, 1.819), (0.53, s * 0.224, 1.827), (0.61, s * 0.203, 1.807)],
                [0.013, 0.014, 0.006],
            ),
            coat,
            "head",
        )
        piece(
            tube(
                f"Bill seam {side}",
                [(0.69, s * 0.125, 1.650), (0.85, s * 0.097, 1.646), (1.05, s * 0.035, 1.639)],
                [0.004, 0.004, 0.002],
            ),
            dark,
            "head",
        )
        piece(
            sphere(f"Nostril {side}", (0.766, s * 0.099, 1.769), (0.022, 0.006, 0.009)),
            dark,
            "head",
        )
        # Connected shoulder-to-hand coverts: a closed thin airfoil with blended joints.
        points = []
        faces: list[tuple[int, ...]] = []
        sections = [
            (0.18, 0.03, 1.30, 0.18, 0.085),
            (0.37, -0.01, 1.33, 0.25, 0.09),
            (0.59, -0.065, 1.33, 0.28, 0.068),
            (0.74, -0.10, 1.32, 0.29, 0.05),
            (0.94, -0.05, 1.32, 0.30, 0.041),
            (1.23, 0.02, 1.30, 0.24, 0.035),
            (1.48, -0.035, 1.29, 0.17, 0.025),
            (1.77, -0.10, 1.27, 0.045, 0.008),
        ]
        for y, x, z, trail, thick in sections:
            for i in range(16):
                angle = i * math.tau / 16
                points.append(
                    (
                        x - trail * 0.35 + trail * 0.65 * math.cos(angle),
                        s * y,
                        z + thick * math.sin(angle),
                    )
                )
        for j in range(len(sections) - 1):
            for i in range(16):
                a, b = j * 16 + i, j * 16 + (i + 1) % 16
                faces.append((a, b, b + 16, a + 16))
        faces.extend([tuple(reversed(range(16))), tuple(range(112, 128))])
        mantle = mesh(f"Continuous wing mantle {side}", points, faces)
        finish(mantle, 2)
        mesh_data(mantle).materials.append(cover)
        bind(mantle, rig, wing=side)
        # Overlapping secondaries form a continuous trailing plane, no leaf garland.
        for i in range(9):
            y = 0.62 + i * 0.071
            x = -0.11 + (y - 0.74) * 0.24
            obj = feather(
                f"Secondary {side} {i + 1}",
                (x, s * y, 1.302),
                (x - 0.49, s * (y + 0.09), 1.265),
                0.066,
                0.014,
            )
            piece(obj, wingmat, f"secondary.{side}.{i}")
        for i in range(9):
            y = 1.18 + i * 0.066
            x = 0.015 - (y - 1.23) * 0.23
            obj = feather(
                f"Primary {side} {i + 1}",
                (x, s * y, 1.287),
                (x - 0.75 + i * 0.09, s * (y + 0.35 + i * 0.025), 1.255 - i * 0.002),
                0.085 - i * 0.0016,
                0.013,
            )
            piece(obj, wingmat, f"primary.{side}.{i}")
        # Two broad covert overlaps soften the secondary roots without tiling the breast.
        for i in range(3):
            y = 0.69 + i * 0.18
            obj = feather(
                f"Greater covert {side} {i + 1}",
                (-0.045, s * y, 1.358),
                (-0.31, s * (y + 0.05), 1.334),
                0.10,
                0.009,
            )
            piece(obj, cover, f"elbow.{side}")
        for digit, dx, dy in [(1, 0.28, -0.10), (2, 0.35, 0), (3, 0.28, 0.10), (4, -0.18, -0.035)]:
            fy = foot(side)[1]
            tip = (dx, fy + dy, 0.045)
            obj = tube(
                f"Toe {side} digit {digit}",
                [(0, fy, 0.085), (dx * 0.48, fy + dy * 0.5, 0.063), tip],
                [0.031, 0.023, 0.014],
            )
            piece(obj, legs, f"foot.{side}")
            claw = tube(
                f"Claw {side} digit {digit}",
                [
                    tip,
                    (dx + (0.047 if dx > 0 else -0.035), fy + dy, 0.052),
                    (dx + (0.063 if dx > 0 else -0.05), fy + dy, 0.019),
                ],
                [0.016, 0.013, 0.0015],
            )
            piece(claw, horn, f"foot.{side}")
    for i in range(10):
        offset = (i - 4.5) / 4.5
        obj = feather(
            f"Wedge tail vane {i + 1}",
            (-0.50, offset * 0.14, 0.99),
            (-1.48 + 0.22 * abs(offset), offset * 0.26, 0.56 + 0.07 * abs(offset)),
            0.068,
            0.018,
        )
        piece(obj, wingmat, "tail")
    # Sparse throat hackles emerge from the throat, leaving a quiet continuous breast.
    for i in range(7):
        y = (i - 3) * 0.047
        obj = feather(
            f"Throat hackle {i + 1}",
            (0.57 - abs(y) * 0.3, y, 1.52),
            (0.43 - abs(y) * 0.35, y * 1.23, 1.31 + abs(y) * 0.35),
            0.029,
            0.012,
        )
        piece(obj, coat, "neck")
    activate(rig)
