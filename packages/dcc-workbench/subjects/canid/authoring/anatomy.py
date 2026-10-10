"""Connected canid anatomy and fitted face/paw details, constructed before surfacing."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from geometry import bind, ellipsoid, ground_soles, material, tube
from native_types import active_object, mesh_data, present, require
from parameters import FEET, Form, Point, paw_origin
from studio import studio
from surface import PALETTES, coat_material, groom, paint

if TYPE_CHECKING:
    import bpy


def build_character(form: Form, rig: bpy.types.Object) -> None:
    import bpy

    masses: list[tuple[str, Point, Point]] = [
        ("Ribcage", (0.14, 0, 1.28), (0.68, 0.285, 0.355)),
        ("Sternum", (0.45, 0, 1.16), (0.28, 0.24, 0.30)),
        ("Tucked waist", (-0.29, 0, 1.30), (0.44, 0.21, 0.225)),
        ("Pelvis", (-0.66, 0, 1.28), (0.34, 0.26, 0.30)),
        ("Withers", (0.48, 0, 1.49), (0.34, 0.235, 0.26)),
        ("Neck base", (0.69, 0, 1.53), (0.27, 0.22, 0.32)),
        ("Nape", (0.89, 0, 1.73), (0.245, 0.197, 0.285)),
        ("Cranium", (1.12, 0, 1.80), (0.28, 0.192, 0.225)),
        ("Muzzle bridge", (1.40, 0, 1.685), (0.32, 0.126, 0.12)),
        ("Muzzle tip", (1.61, 0, 1.66), (0.12, 0.10, 0.095)),
        ("Jaw", (1.30, 0, 1.584), (0.285, 0.115, 0.073)),
    ]
    for side in (-1, 1):
        y = side * 0.28
        masses.extend(
            [
                ("Scapular plane", (0.51, y * 0.74, 1.36), (0.19, 0.15, 0.27)),
                ("Triceps", (0.49, y * 0.88, 1.10), (0.15, 0.12, 0.25)),
                ("Thigh", (-0.58, y * 0.92, 1.16), (0.20, 0.145, 0.255)),
                ("Stifle", (-0.385, y, 0.858), (0.098, 0.092, 0.116)),
                ("Masseter", (1.055, side * 0.135, 1.663), (0.184, 0.103, 0.18)),
                ("Brow plane", (1.292, side * 0.143, 1.815), (0.112, 0.067, 0.032)),
                ("Whisker bed", (1.51, side * 0.072, 1.631), (0.165, 0.075, 0.067)),
            ]
        )
    pieces = [ellipsoid(name, center, scale, form) for name, center, scale in masses]
    for foot in FEET:
        x, y, _ = paw_origin(foot)
        front = foot.startswith("front")
        points = (
            [
                (0.63, y, 1.25),
                (0.50, y, 1.03),
                (0.39, y, 0.81),
                (0.50, y, 0.57),
                (0.65, y, 0.30),
                (x, y, 0.16),
            ]
            if front
            else [
                (-0.66, y, 1.25),
                (-0.50, y, 1.07),
                (-0.38, y, 0.85),
                (-0.66, y, 0.65),
                (-0.94, y, 0.49),
                (-0.86, y, 0.32),
                (x, y, 0.16),
            ]
        )
        radii = (
            [0.137, 0.11, 0.082, 0.059, 0.048, 0.057]
            if front
            else [0.17, 0.15, 0.088, 0.074, 0.064, 0.043, 0.054]
        )
        pieces.append(tube(f"Limb {foot}", points, radii, form))
        pieces.append(ellipsoid(f"Palm {foot}", (x + 0.085, y, 0.094), (0.155, 0.111, 0.098), form))
        for digit in (-1, 0, 1):
            pieces.append(
                ellipsoid(
                    f"Toe {foot}.{digit}",
                    (x + 0.206 - abs(digit) * 0.012, y + digit * 0.065, 0.057),
                    (0.078, 0.04, 0.059),
                    form,
                )
            )
    pieces.append(
        tube(
            "Brush core",
            [
                (-0.88, 0, 1.31),
                (-1.18, 0, 1.09),
                (-1.48, 0.02, 0.82),
                (-1.72, 0.04, 0.55),
                (-1.86, 0.08, 0.32),
            ],
            [0.133, 0.16, 0.15, 0.12, 0.012],
            form,
        )
    )
    # Broad fur locks grow out of the skin and merge into the connected sculpt.
    for side in (-1, 1):
        for i in range(5):
            root = (0.90 - i * 0.064, side * 0.16, 1.77 - i * 0.064)
            mid = (root[0] - 0.055, side * (0.23 + i * 0.014), root[2] - 0.095)
            tip = (root[0] - 0.18 - (i % 2) * 0.035, side * (0.24 + i * 0.016), root[2] - 0.22)
            pieces.append(tube("Grown ruff", [root, mid, tip], [0.095, 0.073, 0.008], form))
        for i in range(3):
            root = (1.10 - i * 0.04, side * 0.16, 1.77 - i * 0.06)
            mid = (root[0] - 0.1, side * 0.23, root[2] - 0.055)
            tip = (root[0] - 0.23, side * 0.25, root[2] - 0.13)
            pieces.append(tube("Grown cheek", [root, mid, tip], [0.075, 0.068, 0.007], form))
        for i in range(5):
            t = i / 5
            root = (-1.10 - t * 0.6, side * 0.065, 1.11 - t * 0.54)
            mid = (root[0] - 0.08, side * (0.16 - 0.05 * t), root[2] - 0.09)
            tip = (root[0] - 0.19, side * (0.14 - 0.05 * t), root[2] - 0.2)
            pieces.append(tube("Grown brush", [root, mid, tip], [0.09, 0.066, 0.006], form))
    bpy.ops.object.select_all(action="DESELECT")
    for obj in pieces:
        obj.select_set(True)
    present(bpy.context.view_layer).objects.active = pieces[0]
    bpy.ops.object.join()
    body = active_object()
    body.name = "Coat"
    mesh_data(body).remesh_voxel_size = 0.019
    bpy.ops.object.voxel_remesh()
    smooth = require(body.modifiers.new("Connected anatomy", "SMOOTH"), bpy.types.SmoothModifier)
    smooth.factor, smooth.iterations = 0.9, 4
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    decimate = require(
        body.modifiers.new("Working topology", "DECIMATE"), bpy.types.DecimateModifier
    )
    decimate.ratio = 0.68
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    groom(body, form)
    bind(body, rig, form)
    # The face is rigid to its skull; neck blending stays behind the jaw hinge.
    for vertex in mesh_data(body).vertices:
        if vertex.co.x > 1.14 * form.length and vertex.co.z > 1.45 * form.height:
            for group in body.vertex_groups:
                group.remove([vertex.index])
            body.vertex_groups["head"].add([vertex.index], 1, "REPLACE")
    ground_soles(body, form)
    coat = coat_material()
    paint(body, form, coat)
    details(form, rig)
    studio(rig)


def details(form: Form, rig: bpy.types.Object) -> None:
    import bpy

    dark, mid, pale = PALETTES[form.name]
    charcoal = material("Nose | moist charcoal", (0.016, 0.021, 0.024), 0.31)
    black = material("Nostril and mouth recess", (0.002, 0.003, 0.004), 0.75)
    iris = material("Iris | amber", (0.46, 0.21, 0.035), 0.28)
    lid = material("Lid | coat shadow", (mid[0] * 0.58, mid[1] * 0.58, mid[2] * 0.58), 0.72)
    inner = material("Ear | suede", (0.17, 0.098, 0.074), 0.95)
    outer = material("Ear | coat", mid, 0.86)
    claw = material("Claw | keratin", (0.18, 0.15, 0.11), 0.55)
    glint = material("Eye | reflection", (0.8, 0.83, 0.72), 0.17)

    def solid(
        name: str, center: Point, scale: Point, mat: bpy.types.Material, bone: str = "head"
    ) -> None:
        obj = ellipsoid(name, center, scale, form)
        mesh_data(obj).materials.append(mat)
        bind(obj, rig, form, bone)

    solid("Nose", (1.719, 0, 1.667), (0.053, 0.096, 0.064), charcoal)
    for side in (-1, 1):
        suffix = "L" if side > 0 else "R"
        solid(f"Nostril.{suffix}", (1.755, side * 0.055, 1.681), (0.013, 0.022, 0.016), black)
        solid(f"Orbit.{suffix}", (1.301, side * 0.174, 1.788), (0.058, 0.023, 0.033), black)
        solid(f"Eye.{suffix}", (1.307, side * 0.193, 1.789), (0.034, 0.016, 0.023), iris)
        solid(f"Pupil.{suffix}", (1.321, side * 0.205, 1.79), (0.014, 0.006, 0.018), charcoal)
        solid(f"Glint.{suffix}", (1.315, side * 0.211, 1.802), (0.005, 0.003, 0.005), glint)
        for name, points, radii in [
            (
                "Upper lid",
                [
                    (1.257, side * 0.193, 1.79),
                    (1.283, side * 0.211, 1.816),
                    (1.322, side * 0.198, 1.813),
                    (1.35, side * 0.165, 1.787),
                ],
                [0.006, 0.007, 0.007, 0.004],
            ),
            (
                "Lower lid",
                [
                    (1.257, side * 0.19, 1.787),
                    (1.288, side * 0.206, 1.767),
                    (1.322, side * 0.195, 1.768),
                    (1.35, side * 0.165, 1.787),
                ],
                [0.003, 0.004, 0.004, 0.003],
            ),
            (
                "Lip",
                [
                    (1.19, side * 0.125, 1.585),
                    (1.40, side * 0.133, 1.587),
                    (1.59, side * 0.11, 1.6),
                    (1.697, side * 0.06, 1.617),
                ],
                [0.004, 0.005, 0.004, 0.003],
            ),
        ]:
            obj = tube(f"{name}.{suffix}", points, radii, form)
            mesh_data(obj).materials.append(black if name == "Lip" else lid)
            bind(obj, rig, form, "head")
        # A curved shell: broad buried root, cupped front, soft rim and tapered apex.
        vertices: list[Point] = []
        for center, rx, ry in [
            ((1.012, side * 0.155, 1.892), 0.12, 0.084),
            ((1.006, side * 0.196, 2.025), 0.079, 0.058),
            ((1.01, side * 0.236, 2.166), 0.022, 0.022),
            ((1.02, side * 0.24, 2.196), 0.002, 0.002),
        ]:
            for k in range(20):
                a = k * math.tau / 20
                x = center[0] + rx * math.cos(a)
                if math.cos(a) > 0:
                    x -= 0.035 * math.sin(a) ** 2
                vertices.append(form.point((x, center[1] + ry * math.sin(a), center[2])))
        faces: list[tuple[int, ...]] = [
            (r * 20 + k, r * 20 + (k + 1) % 20, (r + 1) * 20 + (k + 1) % 20, (r + 1) * 20 + k)
            for r in range(3)
            for k in range(20)
        ]
        faces.extend([tuple(reversed(range(20))), tuple(range(60, 80))])
        mesh = bpy.data.meshes.new("Cupped ear")
        mesh.from_pydata(vertices, [], faces)
        mesh.materials.append(outer)
        mesh.materials.append(inner)
        mesh.update()
        obj = bpy.data.objects.new(f"Ear.{suffix}", mesh)
        present(bpy.context.scene).collection.objects.link(obj)
        for p in mesh.polygons:
            if p.normal.x > 0.3:
                p.material_index = 1
        bind(obj, rig, form, f"ear.{suffix}")
    for foot in FEET:
        x, y, _ = paw_origin(foot)
        for digit in (-1, 0, 1):
            dx, dy = x + 0.252 - abs(digit) * 0.012, y + digit * 0.065
            obj = tube(
                f"Claw.{foot}.{digit}",
                [(dx - 0.027, dy, 0.079), (dx + 0.013, dy, 0.063), (dx + 0.035, dy, 0.029)],
                [0.018, 0.012, 0.001],
                form,
            )
            mesh_data(obj).materials.append(claw)
            bind(obj, rig, form, f"paw.{foot}")
