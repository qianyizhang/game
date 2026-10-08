"""Export a saved editable subject without rebuilding, joining, decimating or resaving it."""

from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path
from typing import TYPE_CHECKING, TypedDict

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from native_types import mesh_data, present, require  # noqa: E402
from saved_export_plan import SavedExportRequest, parse_request  # noqa: E402

if TYPE_CHECKING:
    import bpy

Point = tuple[float, float, float]
MOTION_TOLERANCE = 1e-6
LOOP_TOLERANCE = 1e-5


class ObjectInfo(TypedDict):
    name: str
    role: str
    vertexCount: int
    sampleCount: int


class ObjectAudit(TypedDict):
    name: str
    role: str
    maxMotion: float
    maxLoopDifference: float


class ObjectPose(TypedDict):
    name: str
    points: list[Point]


class Pose(TypedDict):
    seconds: float
    objects: list[ObjectPose]


def world_vertices(obj: bpy.types.Object) -> list[Point]:
    import bpy

    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    try:
        points = []
        for vertex in mesh.vertices:
            point = evaluated.matrix_world @ vertex.co
            if not all(math.isfinite(component) for component in (point.x, point.y, point.z)):
                raise ValueError(f"Non-finite evaluated world vertex: {obj.name}")
            points.append((float(point.x), float(point.z), float(-point.y)))
        if not points:
            raise ValueError(f"Empty delivery mesh: {obj.name}")
        return points
    finally:
        evaluated.to_mesh_clear()


def maximum_difference(before: list[Point], after: list[Point]) -> float:
    if len(before) != len(after):
        raise ValueError("Animated topology changes are unsupported")
    return max(math.dist(a, b) for a, b in zip(before, after, strict=True))


def set_frame(scene: bpy.types.Scene, frame: float) -> None:
    scene.frame_set(math.floor(frame), subframe=frame - math.floor(frame))


def delivery_collection(scene: bpy.types.Scene) -> bpy.types.Collection:
    import bpy

    name: object = scene.get("dcc_delivery_collection")
    if isinstance(name, str) and name:
        return present(bpy.data.collections.get(name))
    matches = [
        collection for collection in bpy.data.collections if collection.get("dcc_delivery") is True
    ]
    if len(matches) != 1:
        raise ValueError(
            "Name scene dcc_delivery_collection or tag one collection dcc_delivery=True"
        )
    return matches[0]


def export_saved(request: SavedExportRequest) -> None:
    import bpy

    if Path(bpy.data.filepath).resolve() != request.source:
        raise ValueError("Loaded source differs from the registered saved artist source")
    source_hash = hashlib.sha256(request.source.read_bytes()).hexdigest()
    scene = require(bpy.context.scene, bpy.types.Scene)
    layer = present(bpy.context.view_layer)
    if (
        scene.render.fps != request.fps
        or scene.render.fps_base != 1
        or scene.frame_end - scene.frame_start != request.seconds * request.fps
        or scene.frame_start < 0
    ):
        raise ValueError("Saved source timing differs from registry animation")
    collection = delivery_collection(scene)
    objects = list(collection.all_objects)
    meshes = sorted((obj for obj in objects if obj.type == "MESH"), key=lambda obj: obj.name)
    if not meshes:
        raise ValueError("Delivery collection has no meshes")
    if any(obj.type not in ("MESH", "ARMATURE", "EMPTY") for obj in objects):
        raise ValueError("Delivery collection supports only meshes, armatures and assembly empties")
    roles = {
        obj.name: "skinned" if any(mod.type == "ARMATURE" for mod in obj.modifiers) else "rigid"
        for obj in meshes
    }
    skinned = sum(role == "skinned" for role in roles.values())
    if (request.profile == "skinned" and not skinned) or (request.profile == "rigid" and skinned):
        raise ValueError("Saved source skinning differs from registry profile")
    rigid_requirement: object = scene.get("dcc_require_rigid_motion", False)
    if not isinstance(rigid_requirement, bool):
        raise ValueError("dcc_require_rigid_motion must be a Boolean")
    require_rigid_motion = request.profile == "rigid" or rigid_requirement
    frames = [scene.frame_start + i * request.seconds * request.fps / 4 for i in range(5)]
    # Authoring shape keys may be driven by saved controls, but animated morph export is
    # outside this adapter's contract. Refuse it instead of silently freezing motion.
    key_values: dict[str, list[float]] = {}
    source_samples: list[dict[str, list[Point]]] = []
    for frame in frames:
        set_frame(scene, frame)
        layer.update()
        source_samples.append({obj.name: world_vertices(obj) for obj in meshes})
        for obj in meshes:
            keys = mesh_data(obj).shape_keys
            if keys:
                values = [float(key.value) for key in keys.key_blocks]
                if obj.name in key_values and any(
                    abs(a - b) > 1e-7 for a, b in zip(values, key_values[obj.name], strict=True)
                ):
                    raise ValueError(f"Animated shape keys are unsupported: {obj.name}")
                key_values[obj.name] = values
    set_frame(scene, frames[0])
    layer.update()
    # All mutation below is in Blender's disposable loaded process. No save operation is used.
    for obj in meshes:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        layer.objects.active = obj
        # Imported instances may share mesh data. Freezing this object's controls must
        # not remove another assembly's keys or alter its separately evaluated geometry.
        obj.data = mesh_data(obj).copy()
        if mesh_data(obj).shape_keys:
            bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
        for modifier in list(obj.modifiers):
            if modifier.type != "ARMATURE":
                bpy.ops.object.modifier_apply(modifier=modifier.name)
    infos: list[ObjectInfo] = []
    audits: list[ObjectAudit] = []
    baseline: dict[str, list[Point]] = {}
    samples: list[Pose] = []
    max_source_delivery_difference = 0.0
    for sample_index, frame in enumerate(frames):
        set_frame(scene, frame)
        layer.update()
        poses: list[ObjectPose] = []
        for object_index, obj in enumerate(meshes):
            points = world_vertices(obj)
            # A modifier can be animated or depend on the rig. Freezing it must not
            # silently change the artist's evaluated motion at any reviewed pose.
            source_difference = maximum_difference(source_samples[sample_index][obj.name], points)
            max_source_delivery_difference = max(max_source_delivery_difference, source_difference)
            if source_difference > LOOP_TOLERANCE:
                raise ValueError(
                    f"Freezing authoring modifiers changes source geometry: {obj.name}"
                )
            if sample_index == 0:
                baseline[obj.name] = points
                infos.append(
                    {
                        "name": obj.name,
                        "role": roles[obj.name],
                        "vertexCount": len(points),
                        "sampleCount": min(16, len(points)),
                    }
                )
                audits.append(
                    {
                        "name": obj.name,
                        "role": roles[obj.name],
                        "maxMotion": 0.0,
                        "maxLoopDifference": 0.0,
                    }
                )
            difference = maximum_difference(baseline[obj.name], points)
            audits[object_index]["maxMotion"] = max(audits[object_index]["maxMotion"], difference)
            if sample_index == 4:
                audits[object_index]["maxLoopDifference"] = difference
            count = min(16, len(points))
            indices = [round(i * (len(points) - 1) / max(1, count - 1)) for i in range(count)]
            poses.append({"name": obj.name, "points": [points[index] for index in indices]})
        samples.append({"seconds": sample_index * request.seconds / 4, "objects": poses})
    skinned_motion = max(
        (audit["maxMotion"] for audit in audits if audit["role"] == "skinned"), default=0
    )
    rigid_motion = max(
        (audit["maxMotion"] for audit in audits if audit["role"] == "rigid"), default=0
    )
    loop = max(audit["maxLoopDifference"] for audit in audits)
    if loop > LOOP_TOLERANCE:
        raise ValueError(f"Saved source loop is not closed: {loop}")
    if (skinned and skinned_motion <= MOTION_TOLERANCE) or (
        require_rigid_motion and rigid_motion <= MOTION_TOLERANCE
    ):
        raise ValueError("Saved source has no required evaluated skinned/rigid motion")
    set_frame(scene, frames[0])
    layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    # Include assembly ancestors, retaining their authored transforms and parenting.
    selected = set(objects)
    for obj in objects:
        parent = obj.parent
        while parent:
            if parent.type not in ("EMPTY", "ARMATURE") and parent not in selected:
                raise ValueError("Unregistered mesh ancestor outside delivery collection")
            selected.add(parent)
            parent = parent.parent
    for obj in selected:
        obj.select_set(True)
    layer.objects.active = meshes[0]
    request.output.mkdir(parents=True, exist_ok=False)
    scene.name = request.animation_name
    bpy.ops.export_scene.gltf(
        filepath=str(request.output / f"{request.asset_id}.pending.glb"),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_animation_mode="SCENE",
        export_anim_scene_split_object=False,
        export_force_sampling=True,
        export_frame_range=True,
        export_anim_slide_to_zero=True,
        export_skins=True,
        export_yup=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        export_morph=False,
    )
    if hashlib.sha256(request.source.read_bytes()).hexdigest() != source_hash:
        raise ValueError("Export changed saved artist source bytes")
    native = {
        "schemaVersion": 1,
        "kind": "saved-export",
        "id": request.asset_id,
        "source": request.source_name,
        "sourceSha256": source_hash,
        "sourceUnchangedByExport": True,
        "blender": bpy.app.version_string,
        "profile": request.profile,
        "collection": collection.name,
        "animation": {
            "name": request.animation_name,
            "seconds": request.seconds,
            "fps": request.fps,
        },
        "audit": {
            "sampleFrames": frames,
            "meshCount": len(meshes),
            "skinnedMeshCount": skinned,
            "rigidMeshCount": len(meshes) - skinned,
            "maxSkinnedMotion": skinned_motion,
            "maxRigidMotion": rigid_motion,
            "maxLoopDifference": loop,
            "maxSourceDeliveryDifference": max_source_delivery_difference,
            "requireRigidMotion": require_rigid_motion,
            "motionTolerance": MOTION_TOLERANCE,
            "loopTolerance": LOOP_TOLERANCE,
            "objects": audits,
        },
    }
    poses_document = {
        "schemaVersion": 1,
        "id": request.asset_id,
        "space": "glTF world, Y up",
        "objects": infos,
        "samples": samples,
    }
    for name, data in (("authoring.json", native), ("pose-samples.json", poses_document)):
        (request.output / name).write_text(json.dumps(data, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    export_saved(parse_request(sys.argv))
