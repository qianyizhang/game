"""Read-only native multiview clay/material review."""

from __future__ import annotations

from pathlib import Path

from boar_form import material
from native_types import active_object, cycles_settings, mesh_data, present, require


def review(root: Path, output: Path, clip: str, frame: int) -> None:
    import bpy
    from mathutils import Vector

    if output.exists():
        raise FileExistsError("Review output must be fresh")
    bpy.ops.wm.open_mainfile(filepath=str(root / "boar/source.blend"))
    scene = present(bpy.context.scene)
    bpy.data.objects["CharacterRig"].animation_data_create().action = bpy.data.actions[clip]
    scene.frame_set(frame)
    setattr(scene.render, "engine", "CYCLES")  # noqa: B010
    cycles_settings(scene.cycles).samples = 20
    scene.render.resolution_x, scene.render.resolution_y = 1000, 760
    scene.render.resolution_percentage = 100
    scene.world = bpy.data.worlds.new("Neutral studio")
    scene.world.color = (0.20, 0.20, 0.20)
    bpy.ops.object.camera_add(location=(4, -6, 2.7))
    camera = active_object()
    scene.camera = camera
    require(camera.data, bpy.types.Camera).type = "ORTHO"
    require(camera.data, bpy.types.Camera).ortho_scale = 3.9
    for position, energy, size in [
        ((2, -4, 6), 800, 5),
        ((-3, 2, 4), 1000, 4),
        ((2, 4, 2), 350, 3),
    ]:
        bpy.ops.object.light_add(type="AREA", location=position)
        obj = active_object()
        lamp = require(obj.data, bpy.types.AreaLight)
        lamp.energy, lamp.size = energy, size
        obj.rotation_euler = (
            (Vector((0, 0, 0.8)) - obj.location).to_track_quat("-Z", "Y").to_euler()
        )
    originals = {o.name: list(mesh_data(o).materials) for o in scene.objects if o.type == "MESH"}
    clay = material("Review clay", (0.38, 0.40, 0.38))
    output.mkdir(parents=True)
    for surface in ("clay", "material"):
        for name, mats in originals.items():
            data = mesh_data(bpy.data.objects[name])
            data.materials.clear()
            for mat in mats:
                data.materials.append(clay if surface == "clay" else mat)
        for view, camera_position in [
            ("side", (0.1, -7, 1.4)),
            ("front", (7, 0, 2.1)),
            ("rear", (-7, 0, 2.1)),
            ("portrait", (4, -6, 2.7)),
        ]:
            camera.location = camera_position
            camera.rotation_euler = (
                (Vector((0.08, 0, 0.9)) - camera.location).to_track_quat("-Z", "Y").to_euler()
            )
            scene.render.filepath = str(output / f"{surface}-{view}.png")
            bpy.ops.render.render(write_still=True)
