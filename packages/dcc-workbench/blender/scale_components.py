"""Surface-fitted dorsal/flank scale patches that inherit the source skin's weights."""

from __future__ import annotations

from typing import TYPE_CHECKING, cast

from native_types import float_socket, mesh_data, present, require

if TYPE_CHECKING:
    import bpy


def install_scales(collection: bpy.types.Collection, rig: bpy.types.Object) -> None:
    from math import cos, pi, sin

    import bpy
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree

    armature = require(rig.data, bpy.types.Armature)
    body = next(obj for obj in collection.objects if obj.name.startswith("Skin |"))
    data = mesh_data(body)
    positions = [body.matrix_world @ vertex.co for vertex in data.vertices]
    polygons = [tuple(poly.vertices) for poly in data.polygons]
    material = bpy.data.materials["Dorsal shields | deep olive"]
    shader = require(
        present(material.node_tree).nodes.get("Principled BSDF"), bpy.types.ShaderNodeBsdfPrincipled
    )
    float_socket(present(shader.inputs)["Roughness"]).default_value = 0.78

    # Inherit the three nearest face-vertex weights at each fitted point. This
    # follows the existing skin, including its root blend, rather than a new rig.
    def weights(point: Vector, face: int) -> dict[str, float]:
        nearest = sorted(polygons[face], key=lambda idx: (positions[idx] - point).length_squared)[
            :3
        ]
        factors = [1 / max(1e-8, (positions[idx] - point).length_squared) for idx in nearest]
        total = sum(factors)
        result: dict[str, float] = {}
        for idx, factor in zip(nearest, factors, strict=True):
            for group in data.vertices[idx].groups:
                name = body.vertex_groups[group.group].name
                result[name] = result.get(name, 0) + group.weight * factor / total
        return result

    for index, role in enumerate(("Scent", "Search", "Guard")):
        # A ray must never land on a sibling neck. The native skin's ownership
        # weights define a separate projection surface for each patch.
        owned = {
            vertex.index
            for vertex in data.vertices
            if sum(
                g.weight
                for g in vertex.groups
                if body.vertex_groups[g.group].name.startswith(f"Neck.{index}.")
            )
            > 0.9
        }
        face_ids = [i for i, poly in enumerate(polygons) if all(v in owned for v in poly)]
        # The generated stub omits the native BVHTree return type. Native
        # installation exercises ray casts and validates every fitted patch.
        tree = cast(
            BVHTree,
            BVHTree.FromPolygons(
                [(p.x, p.y, p.z) for p in positions], [polygons[i] for i in face_ids]
            ),
        )
        path = [armature.bones[f"Neck.{index}.{j}"].head_local.copy() for j in range(5)]
        path.append(armature.bones[f"Neck.{index}.4"].tail_local.copy())

        def surface(
            fraction: float,
            angle: float,
            path: list[Vector] = path,
            role: str = role,
            tree: BVHTree = tree,
            face_ids: list[int] = face_ids,
        ) -> tuple[Vector, Vector, int]:
            j = min(4, int(fraction))
            t = fraction - j
            center = path[j].lerp(path[j + 1], t)
            tangent = require(path[j + 1] - path[j], Vector).normalized()
            lateral = require(Vector((1, 0, 0)) - tangent * tangent.x, Vector).normalized()
            front = require(lateral.cross(tangent), Vector).normalized()
            direction = lateral * sin(angle) + front * cos(angle)
            point, normal, face, _ = tree.ray_cast(center + direction * 0.6, -direction, 1.2)
            if point is None:
                point, normal, face, _ = tree.find_nearest(center + direction * 0.18, 0.25)
            if point is None or normal is None or face is None:
                raise ValueError(
                    f"Scale patch missed source skin: {role} f={fraction} angle={angle}"
                )
            return point, normal, face_ids[face]

        verts: list[Vector] = []
        faces: list[tuple[int, ...]] = []
        bindings: list[dict[str, float]] = []
        # Quiet neck roots; staggered small patches on upper flanks and dorsum.
        for row in range(20):
            f = 1.20 + row * 0.16
            for col in range(8):
                angle = 1.15 + col * (2 * pi - 2.3) / 8 + (row % 2) * 0.16
                start = len(verts)
                outline = [
                    (-0.095, 0),
                    (-0.04, -0.22),
                    (0.065, -0.19),
                    (0.10, 0),
                    (0.065, 0.19),
                    (-0.04, 0.22),
                ]
                for depth in (-0.008, 0.0005):
                    for df, da in outline:
                        p, n, face = surface(f + df, angle + da)
                        verts.append(p + n * depth)
                        bindings.append(weights(p, face))
                p, n, face = surface(f, angle)
                verts.append(p + n * (0.005 + 0.002 * sin(row * 0.8)))
                bindings.append(weights(p, face))
                for j in range(6):
                    nxt = (j + 1) % 6
                    faces.append((start + 6 + j, start + 6 + nxt, start + 12))
                    faces.append((start + j, start + nxt, start + 6 + nxt, start + 6 + j))
                faces.append(tuple(start + j for j in reversed(range(6))))
                # Surface coordinates (length, angle) can wind inward. Orient
                # every closed scale against the actual source-skin normal.
                a, b, c = verts[start + 6], verts[start + 7], verts[start + 12]
                if require((b - a).cross(c - a), Vector).dot(n) < 0:
                    faces[-13:] = [tuple(reversed(face)) for face in faces[-13:]]
        mesh = bpy.data.meshes.new(f"Scale patch | {role}")
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(f"SCALES | {role} flanks", mesh)
        collection.objects.link(obj)
        mesh.materials.append(material)
        obj.parent = rig
        obj["component"] = "fitted-scale-patch.v1"
        for vertex, binding in enumerate(bindings):
            for name, weight in binding.items():
                if (
                    name.startswith("Neck.")
                    and not name.startswith(f"Neck.{index}.")
                    and weight > 0.00001
                ):
                    raise ValueError(f"Scale patch would bind to a sibling neck: {role}, {name}")
                group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                group.add([vertex], weight, "REPLACE")
        modifier = require(
            obj.modifiers.new("Follow source skin", "ARMATURE"), bpy.types.ArmatureModifier
        )
        modifier.object = rig
        for polygon in mesh.polygons:
            polygon.use_smooth = True
