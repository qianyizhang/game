"""Sculptural enemy forms: shaped cloth/stone masses, connected limbs and fitted weapons."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING, cast

from enemy_rig import Kind, arm_points, dimensions
from hero_form import bind, loft, material, mesh, rigid, transition
from hero_rig import Point
from native_types import color_socket, float_socket, mesh_data, present, require

if TYPE_CHECKING:
    import bpy


def cross(a: Point, b: Point) -> Point:
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def normalized(point: Point) -> Point:
    length = math.sqrt(sum(v * v for v in point))
    return (point[0] / length, point[1] / length, point[2] / length)


def tube(name: str, rows: list[tuple[Point, float, float]], count: int = 10) -> bpy.types.Object:
    """A continuous tapered sweep with cross-sections fitted to a drawn centerline."""
    points: list[Point] = []
    for index, (center, depth, width) in enumerate(rows):
        before, after = rows[max(0, index - 1)][0], rows[min(len(rows) - 1, index + 1)][0]
        axis = normalized(cast(Point, tuple(after[i] - before[i] for i in range(3))))
        u = normalized(cross(axis, (0, 0, 1) if abs(axis[2]) < 0.9 else (1, 0, 0)))
        v = cross(axis, u)
        for j in range(count):
            a = j * math.tau / count
            points.append(
                cast(
                    Point,
                    tuple(
                        center[i] + math.cos(a) * depth * u[i] + math.sin(a) * width * v[i]
                        for i in range(3)
                    ),
                )
            )
    faces: list[tuple[int, ...]] = [
        (
            j * count + i,
            j * count + (i + 1) % count,
            (j + 1) * count + (i + 1) % count,
            (j + 1) * count + i,
        )
        for j in range(len(rows) - 1)
        for i in range(count)
    ]
    faces.extend(
        [tuple(reversed(range(count))), tuple(range((len(rows) - 1) * count, len(rows) * count))]
    )
    return mesh(name, points, faces)


def bind_rows(
    obj: bpy.types.Object,
    rig: bpy.types.Object,
    mat: bpy.types.Material,
    weights: list[dict[str, float]],
    count: int = 10,
) -> None:
    import bpy

    mesh_data(obj).materials.append(mat)
    for row, entries in enumerate(weights):
        for name, weight in entries.items():
            group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
            group.add(list(range(row * count, (row + 1) * count)), weight, "REPLACE")
    modifier = require(
        obj.modifiers.new("Fitted deformation", "ARMATURE"), bpy.types.ArmatureModifier
    )
    modifier.object = rig
    obj.parent = rig


def plate(
    name: str, outline: list[tuple[float, float]], y: float, thickness: float
) -> bpy.types.Object:
    points = [(x, y + side * thickness / 2, z) for side in (-1, 1) for x, z in outline]
    count = len(outline)
    faces: list[tuple[int, ...]] = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces.extend((i, (i + 1) % count, (i + 1) % count + count, i + count) for i in range(count))
    return mesh(name, points, faces)


def build(rig: bpy.types.Object, kind: Kind) -> None:
    import bpy

    palettes = {
        "hunter": ((0.27, 0.075, 0.06), (0.50, 0.17, 0.10)),
        "archer": ((0.15, 0.24, 0.09), (0.35, 0.43, 0.18)),
        "brute": ((0.20, 0.24, 0.26), (0.37, 0.40, 0.38)),
        "witch": ((0.20, 0.13, 0.32), (0.41, 0.30, 0.53)),
    }
    cloth = material(f"{kind}_body", palettes[kind][0])
    fold = material(f"{kind}_planes", palettes[kind][1])
    ink = material("recess_ink", (0.018, 0.029, 0.034))
    cream = material("carved_bone", (0.72, 0.64, 0.44), 0.72)
    leather = material("worn_leather", (0.09, 0.057, 0.048))
    metal = material("forged_bronze", (0.48, 0.31, 0.14), 0.52, 0.52)
    hip, shoulder, width, stance = dimensions(kind)
    sections: list[tuple[Point, float, float]]
    if kind == "brute":
        sections = [
            ((-0.06, 0, 0.48), 0.24, 0.27),
            ((-0.09, 0, 0.68), 0.29, 0.34),
            ((-0.17, 0, 0.98), 0.35, 0.44),
            ((-0.23, 0, 1.26), 0.41, 0.48),
            ((-0.27, 0, 1.43), 0.35, 0.34),
            ((-0.15, 0, 1.49), 0.20, 0.14),
        ]
    elif kind == "witch":
        sections = [
            ((-0.12, 0, 0.20), 0.12, 0.18),
            ((-0.10, 0, 0.28), 0.23, 0.28),
            ((-0.11, 0, 0.57), 0.24, 0.28),
            ((-0.08, 0, 0.86), 0.16, 0.20),
            ((-0.015, 0, 1.12), 0.22, 0.29),
            ((0, 0, 1.25), 0.15, 0.19),
        ]
    else:
        sections = [
            ((-0.065, 0, hip - 0.13), 0.16, 0.20),
            ((-0.04, 0, hip + 0.04), 0.13, 0.16),
            ((0.005, 0, hip + 0.21), 0.12, 0.14),
            ((0.045 if kind == "hunter" else -0.015, 0, shoulder - 0.11), 0.16, width),
            ((0.025, 0, shoulder + 0.03), 0.11, width * 0.8),
        ]
    body = loft("Body", sections, 16)
    bind(body, rig, cloth, transition("pelvis", "chest", hip + 0.06, hip + 0.23))
    if kind != "witch":
        for side, sign in [("L", 1), ("R", -1)]:
            y = stance * sign
            size = 0.13 if kind == "brute" else 0.074
            leg = loft(
                f"Leg_{side}",
                [
                    ((0, y, 0.14), size * 0.7, size * 0.7),
                    ((0.05, y, 0.30), size, size),
                    ((0.09, y, 0.40), size * 1.06, size),
                    ((0.03, y, 0.58), size * 1.2, size * 1.1),
                    ((0, y, hip + 0.07), size * 1.3, size * 1.2),
                ],
                10,
            )
            bind(
                leg,
                rig,
                leather if kind != "brute" else cloth,
                transition(f"shin.{side}", f"thigh.{side}", 0.31, 0.46),
            )
            boot = loft(
                f"Boot_{side}",
                [
                    ((0.08, y, 0.025), size * 2, size * 1.2),
                    ((0.08, y, 0.09), size * 2, size * 1.18),
                    ((0.01, y, 0.17), size * 1.12, size),
                    ((0, y, 0.27), size * 0.81, size * 0.80),
                ],
                8,
            )
            bind(
                boot,
                rig,
                fold if kind == "brute" else leather,
                transition(f"foot.{side}", f"shin.{side}", 0.16, 0.25),
            )
    for side in ("L", "R"):
        root, elbow, wrist, palm = arm_points(kind, side)
        radius = 0.17 if kind == "brute" else 0.085 if kind == "witch" else 0.075
        middle = cast(Point, tuple((root[i] + elbow[i]) / 2 for i in range(3)))
        fore = cast(Point, tuple((elbow[i] + wrist[i]) / 2 for i in range(3)))
        limb = tube(
            f"Arm_{side}",
            [
                (root, radius * 1.3, radius * 1.1),
                (middle, radius * 1.15, radius),
                (elbow, radius, radius),
                (fore, radius * 0.8, radius * 0.85),
                (wrist, radius * 0.55, radius * 0.65),
                (palm, radius * 0.6, radius * 0.6),
            ],
        )
        bind_rows(
            limb,
            rig,
            cloth if kind != "hunter" else fold,
            [
                {f"arm.{side}": 1},
                {f"arm.{side}": 1},
                {f"arm.{side}": 0.5, f"forearm.{side}": 0.5},
                {f"forearm.{side}": 1},
                {f"forearm.{side}": 0.4, f"hand.{side}": 0.6},
                {f"hand.{side}": 1},
            ],
        )
    if kind == "brute":
        skull = loft(
            "Stone_mask",
            [
                ((0.14, 0, 1.12), 0.12, 0.15),
                ((0.29, 0, 1.22), 0.20, 0.22),
                ((0.34, 0, 1.35), 0.21, 0.22),
                ((0.25, 0, 1.47), 0.16, 0.17),
                ((0.15, 0, 1.50), 0.08, 0.08),
            ],
            12,
        )
        bind(skull, rig, fold, rigid("head"))
        for sign in (-1, 1):
            shoulder_plate = loft(
                f"Carapace_{sign}",
                [
                    ((-0.13, sign * 0.36, 1.16), 0.22, 0.13),
                    ((-0.18, sign * 0.38, 1.32), 0.29, 0.19),
                    ((-0.20, sign * 0.34, 1.46), 0.19, 0.14),
                ],
                8,
            )
            bind(shoulder_plate, rig, metal, rigid("chest"))
        slit = loft(
            "Eye_slit", [((0.527, 0, 1.338), 0.025, 0.15), ((0.521, 0, 1.362), 0.028, 0.15)], 8
        )
        bind(slit, rig, ink, rigid("head"))
    else:
        top = 1.63 if kind == "hunter" else 1.82 if kind == "archer" else 1.74
        back = -0.05 if kind == "hunter" else -0.13
        head_z = shoulder + 0.14
        hood = loft(
            "Hood",
            [
                ((0.01, 0, shoulder - 0.04), 0.11, 0.13),
                ((0.03, 0, head_z), 0.20, 0.19),
                ((back, 0, top - 0.12), 0.18, 0.16),
                ((back - 0.07, 0, top), 0.025, 0.03),
            ],
            14,
        )
        bind(hood, rig, fold if kind != "witch" else cloth, rigid("head"))
        recess = loft(
            "Face_recess",
            [
                ((0.16, 0, head_z - 0.06), 0.068, 0.09),
                ((0.21, 0, head_z + 0.07), 0.066, 0.145),
                ((0.16, 0, top - 0.12), 0.07, 0.10),
            ],
            12,
        )
        bind(recess, rig, ink, rigid("head"))
        if kind == "hunter":
            mask = loft(
                "Sickle_mask",
                [
                    ((0.22, 0, head_z - 0.035), 0.05, 0.045),
                    ((0.29, 0, head_z + 0.03), 0.056, 0.09),
                    ((0.285, 0, head_z + 0.13), 0.065, 0.14),
                    ((0.23, 0, head_z + 0.17), 0.025, 0.10),
                ],
                10,
            )
            bind(mask, rig, cream, rigid("head"))
        eye = loft(
            "Eyes",
            [
                ((0.28 if kind == "hunter" else 0.267, 0, head_z + 0.09), 0.045, 0.105),
                ((0.28 if kind == "hunter" else 0.267, 0, head_z + 0.108), 0.045, 0.105),
            ],
            10,
        )
        bind(eye, rig, ink if kind == "hunter" else cream, rigid("head"))
        # Broad folded back cloth with asymmetric hem, closed thickness and quiet planes.
        points: list[Point] = []
        rows, columns = 6, 7
        for back_face in (False, True):
            for row in range(rows):
                t = row / (rows - 1)
                for column in range(columns):
                    u = column / (columns - 1)
                    y = width * (2 * u - 0.8) * (1 + 0.10 * t)
                    z = (
                        shoulder
                        - t * (0.58 if kind == "hunter" else 0.79)
                        - 0.055 * math.sin(u * math.pi)
                    )
                    x = (
                        -0.11
                        - 0.13 * t
                        - 0.025 * math.cos(u * math.tau * 2)
                        + (0.02 if back_face else 0)
                    )
                    points.append((x, y, z))
        faces: list[tuple[int, ...]] = []
        total = rows * columns
        for offset in (0, total):
            for row in range(rows - 1):
                for col in range(columns - 1):
                    a = offset + row * columns + col
                    face = (a, a + 1, a + columns + 1, a + columns)
                    faces.append(tuple(reversed(face)) if offset else face)
        boundary = [
            *range(columns),
            *(row * columns + columns - 1 for row in range(1, rows)),
            *range(total - 2, total - columns - 1, -1),
            *(row * columns for row in range(rows - 2, 0, -1)),
        ]
        for i, a in enumerate(boundary):
            b = boundary[(i + 1) % len(boundary)]
            faces.append((a, a + total, b + total, b))
        mantle = mesh("Back_shroud", points, faces)
        bind(
            mantle,
            rig,
            cloth if kind == "archer" else fold,
            transition("cloth", "chest", shoulder - 0.38, shoulder - 0.03),
        )
    _, _, wrist, palm = arm_points(kind, "R")
    if kind == "brute":
        handle = tube(
            "Maul_handle",
            [
                (palm, 0.046, 0.046),
                (((palm[0] + 0.85) / 2, wrist[1], (palm[2] + 0.41) / 2), 0.038, 0.038),
                ((0.85, wrist[1], 0.41), 0.045, 0.045),
            ],
            8,
        )
        bind(handle, rig, leather, rigid("hand.R"))
        maul = loft(
            "Maul_head",
            [
                ((0.85, wrist[1], 0.24), 0.13, 0.20),
                ((0.85, wrist[1], 0.29), 0.18, 0.28),
                ((0.85, wrist[1], 0.51), 0.18, 0.28),
                ((0.85, wrist[1], 0.58), 0.13, 0.20),
            ],
            8,
        )
        bind(maul, rig, fold, rigid("hand.R"))
        collar = loft(
            "Maul_binding",
            [((0.85, wrist[1], 0.37), 0.186, 0.285), ((0.85, wrist[1], 0.43), 0.186, 0.285)],
            8,
        )
        bind(collar, rig, metal, rigid("hand.R"))
    elif kind == "hunter":
        handle = tube(
            "Sickle_grip", [(palm, 0.026, 0.026), ((0.67, wrist[1], 1.035), 0.026, 0.026)], 8
        )
        bind(handle, rig, leather, rigid("hand.R"))
        angles = [-math.pi / 2 + i * math.pi * 1.15 / 10 for i in range(11)]
        outline = [(0.67 + 0.25 * math.cos(a), 1.24 + 0.25 * math.sin(a)) for a in angles]
        outline += [
            (0.67 + 0.16 * math.cos(a), 1.24 + 0.16 * math.sin(a)) for a in reversed(angles)
        ]
        blade = plate("Sickle_blade", outline, wrist[1], 0.035)
        bind(blade, rig, cream, rigid("hand.R"))
    elif kind == "archer":
        bow_rows = [
            (
                (0.40 + 0.14 * math.sin(i * math.pi / 12), wrist[1], 0.72 + i * 0.76 / 12),
                0.022 + 0.005 * math.sin(i * math.pi / 12),
                0.025,
            )
            for i in range(13)
        ]
        bow = tube("Reed_bow", bow_rows, 8)
        bind(bow, rig, metal, rigid("hand.R"))
        string = tube(
            "Bow_string",
            [
                ((0.40, wrist[1], 0.72), 0.008, 0.008),
                ((0.40, wrist[1], 1.10), 0.008, 0.008),
                ((0.40, wrist[1], 1.48), 0.008, 0.008),
            ],
            4,
        )
        bind_rows(string, rig, cream, [{"hand.R": 1}, {"hand.L": 1}, {"hand.R": 1}], 4)
        arrow = tube(
            "Reed_arrow",
            [((0.34, wrist[1], 1.10), 0.012, 0.012), ((0.94, wrist[1], 1.10), 0.012, 0.012)],
            6,
        )
        bind(arrow, rig, cream, rigid("hand.L"))
    else:
        handle = tube(
            "Lantern_hanger", [(palm, 0.018, 0.018), ((0.50, wrist[1], 0.88), 0.020, 0.020)], 8
        )
        bind(handle, rig, metal, rigid("hand.R"))
        glow = material("Lantern_spirit", (0.85, 0.50, 0.12), 0.60)
        shader = require(
            present(glow.node_tree).nodes.get("Principled BSDF"), bpy.types.ShaderNodeBsdfPrincipled
        )
        color_socket(present(shader.inputs)["Emission Color"]).default_value = (
            1.0,
            0.40,
            0.06,
            1.0,
        )
        float_socket(present(shader.inputs)["Emission Strength"]).default_value = 1.2
        lantern = loft(
            "Lantern_light",
            [
                ((0.50, wrist[1], 0.65), 0.04, 0.045),
                ((0.50, wrist[1], 0.70), 0.075, 0.08),
                ((0.50, wrist[1], 0.82), 0.075, 0.08),
                ((0.50, wrist[1], 0.86), 0.05, 0.05),
            ],
            8,
        )
        bind(lantern, rig, glow, rigid("hand.R"))
        for height in (0.67, 0.84):
            rim = loft(
                f"Lantern_rim_{round(height * 100)}",
                [
                    ((0.50, wrist[1], height - 0.015), 0.084, 0.088),
                    ((0.50, wrist[1], height + 0.015), 0.084, 0.088),
                ],
                8,
            )
            bind(rim, rig, metal, rigid("hand.R"))
        for sign in (-1, 1):
            brace = tube(
                f"Lantern_frame_{sign}",
                [
                    ((0.50, wrist[1] + sign * 0.075, 0.66), 0.010, 0.010),
                    ((0.50, wrist[1] + sign * 0.084, 0.85), 0.010, 0.010),
                ],
                6,
            )
            bind(brace, rig, metal, rigid("hand.R"))
    for obj in present(bpy.context.scene).objects:
        if obj.type == "MESH":
            for polygon in mesh_data(obj).polygons:
                polygon.use_smooth = kind != "brute"
    rig["material_interpretation"] = (
        "Carved stone and forged maul"
        if kind == "brute"
        else "Layered shroud, carved mask and fitted held tool"
    )
