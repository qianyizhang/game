"""Authored lofts: hood silhouette, fitted clothing, asymmetric mantle, boots and mask."""

from __future__ import annotations

import math
from collections.abc import Callable
from typing import TYPE_CHECKING

from hero_rig import Point
from native_types import color_socket, float_socket, mesh_data, present, require

if TYPE_CHECKING:
    import bpy

Weights = Callable[[Point], dict[str, float]]


def material(name: str, color: Point, rough: float = 0.82, metal: float = 0) -> bpy.types.Material:
    import bpy

    mat = bpy.data.materials.new(name)
    mat.diffuse_color.foreach_set((*color, 1))
    mat.use_nodes = True
    shader = require(
        present(mat.node_tree).nodes.get("Principled BSDF"), bpy.types.ShaderNodeBsdfPrincipled
    )
    color_socket(present(shader.inputs)["Base Color"]).default_value = (*color, 1)
    float_socket(present(shader.inputs)["Roughness"]).default_value = rough
    float_socket(present(shader.inputs)["Metallic"]).default_value = metal
    return mat


def mesh(name: str, points: list[Point], faces: list[tuple[int, ...]]) -> bpy.types.Object:
    import bpy

    data = bpy.data.meshes.new(name)
    data.from_pydata(points, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    present(bpy.context.scene).collection.objects.link(obj)
    return obj


def bind(
    obj: bpy.types.Object, rig: bpy.types.Object, mat: bpy.types.Material, weights: Weights
) -> None:
    import bpy

    data = mesh_data(obj)
    data.materials.append(mat)
    for vertex in data.vertices:
        point = (vertex.co.x, vertex.co.y, vertex.co.z)
        for name, weight in weights(point).items():
            group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
            group.add([vertex.index], weight, "REPLACE")
    modifier = require(
        obj.modifiers.new("Fitted deformation", "ARMATURE"), bpy.types.ArmatureModifier
    )
    modifier.object = rig
    obj.parent = rig


def rigid(name: str) -> Weights:
    return lambda _: {name: 1.0}


def transition(a: str, b: str, low: float, high: float) -> Weights:
    def weights(point: Point) -> dict[str, float]:
        t = min(1, max(0, (point[2] - low) / (high - low)))
        return {a: 1 - t, b: t}

    return weights


def loft(
    name: str, sections: list[tuple[Point, float, float]], count: int = 12
) -> bpy.types.Object:
    """Horizontal cross-sections, hand shaped depth/width and center-line."""
    points: list[Point] = []
    for (x, y, z), depth, width in sections:
        points.extend(
            (
                x + depth * math.cos(i * math.tau / count),
                y + width * math.sin(i * math.tau / count),
                z,
            )
            for i in range(count)
        )
    faces: list[tuple[int, ...]] = []
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


def build(rig: bpy.types.Object) -> None:
    cloth = material("Mantle · weathered teal", (0.055, 0.32, 0.29))
    edge = material("Mantle · light fold", (0.13, 0.47, 0.39))
    dark = material("Hood lining · ink", (0.018, 0.04, 0.051))
    trouser = material("Linen · aubergine", (0.15, 0.09, 0.14))
    leather = material("Boots and gloves · oxblood", (0.12, 0.058, 0.052))
    cream = material("Mask · warm ivory", (0.81, 0.66, 0.42), 0.65)
    bronze = material("Clasp · hammered bronze", (0.58, 0.31, 0.08), 0.42, 0.55)
    torso = loft(
        "Tunic",
        [
            ((0, 0, 0.92), 0.18, 0.24),
            ((0, 0, 1.08), 0.17, 0.23),
            ((0, 0, 1.22), 0.145, 0.195),
            ((0.01, 0, 1.43), 0.205, 0.26),
            ((0, 0, 1.58), 0.185, 0.29),
            ((0, 0, 1.67), 0.1, 0.13),
        ],
    )
    bind(torso, rig, dark, transition("pelvis", "chest", 1.1, 1.35))
    belt = loft("Sash", [((0, 0, 1.11), 0.178, 0.237), ((0, 0, 1.18), 0.168, 0.223)])
    bind(belt, rig, bronze, rigid("pelvis"))
    for side, sign in [("L", 1), ("R", -1)]:
        y = 0.16 * sign
        leg = loft(
            f"Trousers {side}",
            [
                ((0, y, 0.25), 0.075, 0.075),
                ((0.07, y, 0.48), 0.09, 0.09),
                ((0.10, y, 0.57), 0.1, 0.095),
                ((0.035, y, 0.78), 0.12, 0.115),
                ((0, y, 1.04), 0.145, 0.14),
            ],
        )
        bind(leg, rig, trouser, transition(f"shin.{side}", f"thigh.{side}", 0.48, 0.67))
        boot = loft(
            f"Boot {side}",
            [
                ((0.095, y, 0.025), 0.23, 0.11),
                ((0.10, y, 0.09), 0.23, 0.105),
                ((0.04, y, 0.17), 0.145, 0.1),
                ((0, y, 0.25), 0.09, 0.082),
                ((0, y, 0.36), 0.09, 0.085),
            ],
        )
        bind(boot, rig, leather, transition(f"foot.{side}", f"shin.{side}", 0.19, 0.32))
        cuff = loft(
            f"Boot cuff {side}", [((0, y, 0.335), 0.094, 0.09), ((0, y, 0.38), 0.099, 0.095)]
        )
        bind(cuff, rig, bronze, rigid(f"shin.{side}"))
        sleeve = loft(
            f"Sleeve {side}",
            [
                ((0.05, 0.4 * sign, 1.25), 0.085, 0.09),
                ((0.04, 0.39 * sign, 1.32), 0.09, 0.105),
                ((0.02, 0.34 * sign, 1.46), 0.105, 0.12),
                ((0, 0.28 * sign, 1.58), 0.135, 0.13),
                ((0, 0.24 * sign, 1.63), 0.10, 0.11),
            ],
        )
        bind(sleeve, rig, cloth if side == "L" else trouser, rigid(f"arm.{side}"))
        # Forearms loft along their long axis; joints overlap inside the sleeve cuff.
        points: list[Point] = []
        for x, z, radius in [
            (0.045, 1.28, 0.085),
            (0.14, 1.265, 0.085),
            (0.25, 1.245, 0.068),
            (0.32, 1.24, 0.055),
        ]:
            points.extend(
                (
                    x,
                    sign * 0.39 + radius * math.cos(i * math.tau / 10),
                    z + radius * math.sin(i * math.tau / 10),
                )
                for i in range(10)
            )
        faces: list[tuple[int, ...]] = [
            (j * 10 + i, j * 10 + (i + 1) % 10, (j + 1) * 10 + (i + 1) % 10, (j + 1) * 10 + i)
            for j in range(3)
            for i in range(10)
        ]
        faces += [tuple(reversed(range(10))), tuple(range(30, 40))]
        arm = mesh(f"Bracer {side}", points, faces)
        bind(arm, rig, leather, rigid(f"forearm.{side}"))
        glove = loft(
            f"Glove {side}",
            [
                ((0.355, 0.38 * sign, 1.18), 0.08, 0.06),
                ((0.37, 0.38 * sign, 1.24), 0.09, 0.065),
                ((0.35, 0.38 * sign, 1.30), 0.065, 0.055),
            ],
            10,
        )
        bind(glove, rig, cream, rigid(f"hand.{side}"))
    # Hood volume tapers into the neck; the warm face emerges through its dark recess.
    hood = loft(
        "Hood",
        [
            ((-0.03, 0, 1.63), 0.13, 0.15),
            ((-0.035, 0, 1.75), 0.22, 0.245),
            ((-0.04, 0, 1.94), 0.265, 0.285),
            ((-0.065, 0, 2.09), 0.24, 0.235),
            ((-0.10, 0, 2.22), 0.095, 0.12),
            ((-0.15, 0, 2.255), 0.02, 0.025),
        ],
        16,
    )
    bind(hood, rig, cloth, rigid("head"))
    inset = loft(
        "Face recess",
        [
            ((0.18, 0, 1.77), 0.095, 0.115),
            ((0.205, 0, 1.87), 0.11, 0.18),
            ((0.19, 0, 2.03), 0.1, 0.18),
            ((0.19, 0, 2.10), 0.08, 0.105),
        ],
        12,
    )
    bind(inset, rig, dark, rigid("head"))
    mask = loft(
        "Ivory half mask",
        [
            ((0.25, 0, 1.80), 0.045, 0.065),
            ((0.29, 0, 1.88), 0.052, 0.13),
            ((0.30, 0, 1.96), 0.06, 0.145),
            ((0.25, 0, 2.045), 0.045, 0.13),
        ],
        12,
    )
    bind(mask, rig, cream, rigid("head"))
    visor = loft(
        "Eye slit", [((0.303, 0, 1.974), 0.060, 0.137), ((0.293, 0, 1.994), 0.058, 0.139)], 12
    )
    bind(visor, rig, dark, rigid("head"))
    # A broad asymmetric mantle, with folded cross-sections and actual thickness.
    points = []
    rows, columns = 7, 9
    for back in (False, True):
        for row in range(rows):
            t = row / (rows - 1)
            for column in range(columns):
                u = column / (columns - 1)
                y = -0.24 + 0.68 * u
                x = -0.18 - 0.17 * t - 0.035 * math.cos(u * math.tau * 2) + (0.018 if back else 0)
                z = 1.66 - t * (0.79 + 0.17 * u) - 0.1 * math.sin(u * math.pi)
                points.append((x, y * (1 + 0.17 * t), z))
    faces = []
    size = rows * columns
    for offset in (0, size):
        for row in range(rows - 1):
            for col in range(columns - 1):
                a = offset + row * columns + col
                face = (a, a + 1, a + columns + 1, a + columns)
                faces.append(tuple(reversed(face)) if offset else face)
    boundary = [
        *range(columns),
        *(row * columns + columns - 1 for row in range(1, rows)),
        *range(size - 2, size - columns - 1, -1),
        *(row * columns for row in range(rows - 2, 0, -1)),
    ]
    for i, a in enumerate(boundary):
        b = boundary[(i + 1) % len(boundary)]
        faces.append((a, a + size, b + size, b))
    mantle = mesh("Asymmetric mantle", points, faces)
    bind(mantle, rig, edge, transition("cape", "chest", 1.15, 1.63))
    clasp = loft(
        "Shoulder clasp",
        [((0.055, 0.285, 1.58), 0.075, 0.065), ((0.055, 0.285, 1.63), 0.065, 0.055)],
        8,
    )
    bind(clasp, rig, bronze, rigid("chest"))
