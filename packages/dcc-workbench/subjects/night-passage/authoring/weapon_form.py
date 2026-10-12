"""Five grip-local armaments with distinct profiles and an editable bow draw shape."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from hero_form import material, mesh
from hero_rig import Point
from native_types import mesh_data, present, require

if TYPE_CHECKING:
    import bpy

ROOTS = (
    "weapon_sword",
    "weapon_spear",
    "weapon_shield",
    "weapon_bow",
    "weapon_fists_R",
    "weapon_fists_L",
)


def plate(name: str, outline: list[tuple[float, float]], depth: float) -> bpy.types.Object:
    """Beveled forged profile in the X/Z plane, with deliberate broad face planes."""
    cx = sum(p[0] for p in outline) / len(outline)
    cz = sum(p[1] for p in outline) / len(outline)
    n = len(outline)
    points: list[Point] = []
    for y, inset in [(-depth, 0.82), (-depth * 0.25, 1), (depth * 0.25, 1), (depth, 0.82)]:
        points.extend((cx + (x - cx) * inset, y, cz + (z - cz) * inset) for x, z in outline)
    faces: list[tuple[int, ...]] = []
    for row in range(3):
        for i in range(n):
            a, b = row * n + i, row * n + (i + 1) % n
            faces.append((a, a + n, b + n, b))
    faces += [tuple(range(n)), tuple(reversed(range(3 * n, 4 * n)))]
    return mesh(name, points, faces)


def shaft(
    name: str, points: list[Point], widths: list[float], depths: list[float]
) -> bpy.types.Object:
    """Closed variable-section sweep; X/Z tangent, local Y thickness."""
    from mathutils import Vector

    vertices: list[Point] = []
    sides = 8
    for i, center in enumerate(points):
        tangent = (
            Vector(points[min(i + 1, len(points) - 1)]) - Vector(points[max(0, i - 1)])
        ).normalized()
        normal = Vector((-tangent.z, 0, tangent.x))
        for k in range(sides):
            angle = math.tau * k / sides
            p = (
                Vector(center)
                + normal * widths[i] * math.cos(angle)
                + Vector((0, depths[i] * math.sin(angle), 0))
            )
            vertices.append((p.x, p.y, p.z))
    faces: list[tuple[int, ...]] = []
    for row in range(len(points) - 1):
        for k in range(sides):
            a, b = row * sides + k, row * sides + (k + 1) % sides
            faces.append((a, a + sides, b + sides, b))
    faces += [
        tuple(range(sides)),
        tuple(reversed(range((len(points) - 1) * sides, len(points) * sides))),
    ]
    return mesh(name, vertices, faces)


def build() -> None:
    import bpy

    steel = material("Steel · cool forged planes", (0.30, 0.43, 0.49), 0.38, 0.65)
    edge = material("Edge · silver", (0.68, 0.79, 0.82), 0.26, 0.78)
    gold = material("Bronze · worn fittings", (0.56, 0.30, 0.08), 0.40, 0.65)
    dark = material("Leather · charcoal", (0.025, 0.04, 0.047))
    wood = material("Wood · dark cedar", (0.16, 0.07, 0.035))
    teal = material("Wayfarer · jade", (0.13, 0.52, 0.36), 0.42, 0.35)
    violet = material("Oathkeeper · enamel", (0.28, 0.15, 0.46), 0.46, 0.25)
    blue = material("Far Lantern · blue", (0.16, 0.38, 0.67), 0.48, 0.25)
    ember = material("Ember · red ceramic", (0.65, 0.15, 0.10), 0.53, 0.15)
    cord = material("Bowstring · flax", (0.72, 0.62, 0.43))

    def root(name: str) -> bpy.types.Object:
        obj = bpy.data.objects.new(name, None)
        present(bpy.context.scene).collection.objects.link(obj)
        obj["coordinates"] = "grip origin; X forward, Z up; game units"
        return obj

    def add(
        owner: bpy.types.Object, obj: bpy.types.Object, mat: bpy.types.Material
    ) -> bpy.types.Object:
        obj.parent = owner
        mesh_data(obj).materials.append(mat)
        return obj

    sword = root("weapon_sword")
    add(sword, shaft("Sword grip", [(-7, 0, 0), (6, 0, 0)], [2, 2], [2, 2]), dark)
    add(sword, plate("Sword pommel", [(-10, -3), (-6, -4), (-4, 0), (-6, 4), (-10, 3)], 2.5), gold)
    add(
        sword,
        plate(
            "Sword swept guard",
            [(5, -11), (10, -8), (12, -3), (11, 3), (8, 9), (4, 11), (5, 4), (5, -3)],
            2,
        ),
        gold,
    )
    add(
        sword,
        plate("Dawnless blade", [(10, -3), (35, -5.5), (53, -1), (57, 2), (37, 7), (12, 4)], 1.5),
        edge,
    )
    add(
        sword, plate("Sword fuller", [(13, -1.5), (35, -2), (49, 1), (35, 4), (13, 2)], 1.65), steel
    )

    spear = root("weapon_spear")
    add(
        spear,
        shaft(
            "Spear haft", [(-22, 0, 0), (46, 0, 0), (52, 0, 0)], [1.5, 1.35, 1.8], [1.5, 1.35, 1.8]
        ),
        wood,
    )
    for x in (-21, -4, 5, 45):
        add(
            spear,
            shaft(f"Spear binding {x}", [(x, 0, 0), (x + 2, 0, 0)], [1.9, 1.9], [1.9, 1.9]),
            gold,
        )
    add(
        spear,
        plate("Wayfarer leaf", [(47, 0), (55, -5), (64, -4), (78, 0), (64, 4), (55, 5)], 1.25),
        edge,
    )
    add(spear, plate("Spear jade spine", [(51, 0), (59, -2), (74, 0), (59, 2)], 1.45), teal)
    add(spear, plate("Spear pennant", [(42, -1), (35, -7), (22, -8), (27, -3)], 0.55), teal)

    shield = root("weapon_shield")
    # Build in profile, then rotate its broad face from X/Z to Y/Z toward +X.
    outline = [(-13, 13), (0, 18), (13, 13), (14, -2), (0, -21), (-14, -2)]
    for name, scale, x, mat, depth in [
        ("Oathkeeper rim", 1, 7, gold, 2.1),
        ("Shield enamel", 0.88, 9, violet, 1.2),
        ("Shield central ridge", 0.34, 11, edge, 2.3),
    ]:
        obj = plate(name, [(a * scale, z * scale) for a, z in outline], depth)
        for v in mesh_data(obj).vertices:
            a, b = v.co.x, v.co.y
            v.co.x, v.co.y = x - b, a
        add(shield, obj, mat)
    add(shield, shaft("Shield handle", [(0, 0, -5), (0, 0, 5)], [1.5, 1.5], [1.5, 1.5]), dark)

    bow = root("weapon_bow")
    path: list[Point] = [
        (1, 0, -28),
        (7, 0, -25),
        (12, 0, -18),
        (9, 0, -9),
        (7, 0, 0),
        (9, 0, 9),
        (12, 0, 18),
        (7, 0, 25),
        (1, 0, 28),
    ]
    add(
        bow,
        shaft(
            "Far Lantern recurved limbs",
            [(x - 7, y, z) for x, y, z in path],
            [1, 1.8, 2.5, 2.2, 2.8, 2.2, 2.5, 1.8, 1],
            [1, 1.2, 1.4, 1.5, 2, 1.5, 1.4, 1.2, 1],
        ),
        blue,
    )
    add(bow, shaft("Bow grip", [(0, 0, -5), (0, 0, 5)], [3, 3], [2.3, 2.3]), dark)
    for z, sign in [(-27, -1), (27, 1)]:
        add(
            bow,
            plate(
                f"Bow lantern tip {sign}",
                [(-7, z), (-4, z - 3 * sign), (0, z), (-4, z + 2 * sign)],
                1.6,
            ),
            gold,
        )
    string = add(
        bow,
        shaft("bow_string", [(-6, 0, -28), (-6, 0, 0), (-6, 0, 28)], [0.35] * 3, [0.35] * 3),
        cord,
    )
    string.shape_key_add(name="Basis")
    draw = string.shape_key_add(name="Draw")
    for raw in draw.data:
        vertex = require(raw, bpy.types.ShapeKeyPoint)
        vertex.co.x -= 13 * max(0, 1 - abs(vertex.co.z) / 28)
    add(
        bow,
        shaft("Bow nocked shaft", [(-10, -0.6, 0), (29, -0.6, 0)], [0.55, 0.55], [0.55, 0.55]),
        wood,
    )
    add(bow, plate("Bow arrowhead", [(26, -2), (34, 0), (26, 2)], 0.8), edge)

    for side in ("R", "L"):
        fist = root(f"weapon_fists_{side}")
        add(
            fist,
            shaft(
                f"Gauntlet cuff {side}",
                [(-6, 0, 0), (-2, 0, 0), (5, 0, 0)],
                [4.4, 4.6, 4],
                [4.2, 4.8, 4.2],
            ),
            dark,
        )
        add(
            fist,
            plate(
                f"Ember shell {side}", [(-5, -4), (6, -5), (11, -2), (10, 4), (2, 6), (-5, 4)], 5
            ),
            ember,
        )
        add(
            fist,
            plate(
                f"Gauntlet knuckle ridge {side}", [(5, -4), (10, -3), (12, 0), (10, 4), (5, 5)], 5.3
            ),
            gold,
        )
        add(
            fist,
            plate(f"Gauntlet ember inset {side}", [(-1, -2), (4, -1), (6, 1), (1, 3)], 5.2),
            edge,
        )
