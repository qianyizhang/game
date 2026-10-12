"""Read-only native views and disposable saved-action edit/export proof."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from authoring_plan import save_working_source
from hero_delivery import export, mesh_digest, sha
from hero_form import material
from hero_rig import CLIPS, FPS
from native_types import active_object, cycles_settings, mesh_data, present, require
from review_plan import capture_path, close_captures


def sample(source: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Native samples require a fresh path")
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    rig = bpy.data.objects["CharacterRig"]
    meshes = [o for o in scene.objects if o.type == "MESH"]
    clips = {}
    for name in CLIPS:
        action = bpy.data.actions[name]
        rig.animation_data_create().action = action
        end = round(float(action["seconds"]) * FPS)
        samples = []
        # Every saved frame, 16 surface probes per named mesh; no frozen pose fixture.
        for frame in range(end + 1):
            scene.frame_set(frame)
            present(bpy.context.view_layer).update()
            graph = bpy.context.evaluated_depsgraph_get()
            objects = []
            for obj in meshes:
                evaluated = obj.evaluated_get(graph)
                vertices = mesh_data(evaluated).vertices
                points = []
                for index in [round(i * (len(vertices) - 1) / 15) for i in range(16)]:
                    p = evaluated.matrix_world @ vertices[index].co
                    points.append([p.x, p.z, -p.y])
                objects.append({"name": obj.name, "points": points})
            samples.append({"seconds": frame / FPS, "objects": objects})
        clips[name] = {"samples": samples}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"clips": clips}, separators=(",", ":")) + "\n")


def verify(source: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Verification requires a fresh directory")
    model = Path(__file__).resolve().parents[3] / "assets/night-passage/hero.glb"
    protected = {p: sha(p) for p in (source, model)}
    sample(source, output / "reference.json")
    working = output / "edited.blend"
    shutil.copy2(source, working)
    bpy.ops.wm.open_mainfile(filepath=str(working))
    before = mesh_digest()
    rig = bpy.data.objects["CharacterRig"]
    rig.animation_data_create().action = bpy.data.actions["cast"]
    present(bpy.context.scene).frame_set(10)
    head = present(rig.pose).bones["head"]
    previous = head.rotation_euler.z
    head.rotation_euler.z += 0.3
    head.keyframe_insert("rotation_euler", frame=10, group="head")
    save_working_source(working)
    bpy.ops.wm.open_mainfile(filepath=str(working))
    rig = bpy.data.objects["CharacterRig"]
    rig.animation_data_create().action = bpy.data.actions["cast"]
    present(bpy.context.scene).frame_set(10)
    change = present(rig.pose).bones["head"].rotation_euler.z - previous
    if abs(change - 0.3) > 0.00001 or before != mesh_digest():
        raise ValueError("Saved key edit failed or changed mesh/weights")
    export(working, output / "models")
    sample(working, output / "edited.json")
    if any(sha(p) != digest for p, digest in protected.items()):
        raise ValueError("Verification changed authoritative source/delivery")
    (output / "verification.json").write_text(
        json.dumps(
            {
                "meshAndWeightsUnchanged": True,
                "authoritativeSourceAndDeliveryUnchanged": True,
                "headChangeRadians": change,
                "editedClip": "cast",
                "editedFrame": 10,
                "sourceSha256": protected[source],
                "modelSha256": protected[model],
            },
            indent=2,
        )
        + "\n"
    )


def review(source: Path, output: Path) -> None:
    import bpy
    from mathutils import Vector

    if output.exists():
        raise FileExistsError("Review requires a fresh directory")
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    rig = bpy.data.objects["CharacterRig"]
    setattr(scene.render, "engine", "CYCLES")  # noqa: B010
    cycles_settings(scene.cycles).samples = 16
    scene.render.resolution_x, scene.render.resolution_y = 640, 640
    scene.render.resolution_percentage = 100
    scene.world = bpy.data.worlds.new("Review studio")
    scene.world.color = (0.2, 0.2, 0.2)
    bpy.ops.object.camera_add(location=(4, -6, 3.3))
    camera = active_object()
    scene.camera = camera
    require(camera.data, bpy.types.Camera).type = "ORTHO"
    require(camera.data, bpy.types.Camera).ortho_scale = 2.8
    for location, energy, size in [((3, -4, 6), 650, 4), ((-3, 2, 4), 700, 3), ((2, 4, 2), 280, 3)]:
        bpy.ops.object.light_add(type="AREA", location=location)
        lamp = active_object()
        data = require(lamp.data, bpy.types.AreaLight)
        data.energy, data.size = energy, size
        lamp.rotation_euler = (
            (Vector((0, 0, 1)) - lamp.location).to_track_quat("-Z", "Y").to_euler()
        )
    originals = {o.name: list(mesh_data(o).materials) for o in scene.objects if o.type == "MESH"}
    clay = material("Review clay", (0.38, 0.40, 0.38))
    output.mkdir(parents=True)
    captures: set[str] = set()
    for surface in ("clay", "material"):
        for name, mats in originals.items():
            data_mesh = mesh_data(bpy.data.objects[name])
            data_mesh.materials.clear()
            for mat in mats:
                data_mesh.materials.append(clay if surface == "clay" else mat)
        rig.animation_data_create().action = bpy.data.actions["idle"]
        scene.frame_set(0)
        for view, camera_location in [
            ("front", (7, 0, 1.8)),
            ("side", (0, -7, 1.8)),
            ("rear", (-7, 0, 1.8)),
            ("portrait", (4, -6, 3.3)),
        ]:
            camera.location = camera_location
            camera.rotation_euler = (
                (Vector((0, 0, 1.1)) - camera.location).to_track_quat("-Z", "Y").to_euler()
            )
            filename = f"{surface}-{view}.png"
            scene.render.filepath = str(capture_path(output, filename))
            bpy.ops.render.render(write_still=True)
            captures.add(filename)
    for name, seconds in CLIPS.items():
        rig.animation_data_create().action = bpy.data.actions[name]
        scene.frame_set(round(seconds * FPS * 0.45))
        filename = f"{name}-contact.png"
        scene.render.filepath = str(capture_path(output, filename))
        bpy.ops.render.render(write_still=True)
        captures.add(filename)
    close_captures(output, captures)
