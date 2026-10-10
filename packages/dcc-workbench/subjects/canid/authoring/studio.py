"""Native review camera and studio, excluded from delivery."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from native_types import active_object, mesh_data, present, require
from rig import activate

if TYPE_CHECKING:
    import bpy


def studio(rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Vector

    # Native camera and lighting are review aids, excluded from delivery.
    scene = present(bpy.context.scene)
    scene.world = bpy.data.worlds.new("Studio")
    scene.world.color = (0.18, 0.18, 0.18)
    bpy.ops.object.camera_add(location=(4.3, -6.8, 3.0))
    camera = active_object()
    camera.rotation_euler = (
        (Vector((0, 0, 1)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    )
    require(camera.data, bpy.types.Camera).type = "ORTHO"
    require(camera.data, bpy.types.Camera).ortho_scale = 4.8
    scene.camera = camera
    for location, energy, size in [
        ((2, -4, 6), 850, 5),
        ((-3, 2, 4), 1000, 4),
        ((1, 4, 3), 450, 3),
    ]:
        bpy.ops.object.light_add(type="AREA", location=location)
        lamp_object = active_object()
        lamp = require(lamp_object.data, bpy.types.AreaLight)
        lamp.energy, lamp.shape, lamp.size = energy, "DISK", size
        lamp_object.rotation_euler = (
            (Vector((0, 0, 1)) - lamp_object.location).to_track_quat("-Z", "Y").to_euler()
        )
    activate(rig)


def review(source: Path, output: Path, frame: int = 0, clip: str = "idle") -> None:
    """Read a saved master and render selected matched views without saving over it."""
    import bpy
    from geometry import material
    from mathutils import Vector
    from native_types import cycles_settings

    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    if clip in bpy.data.actions:
        bpy.data.objects["CharacterRig"].animation_data_create().action = bpy.data.actions[clip]
    scene.frame_set(frame)
    engine = "CYCLES"  # Bundled add-on, omitted by bpy stubs.
    setattr(scene.render, "engine", engine)  # noqa: B010
    cycles_settings(scene.cycles).samples = 20
    scene.render.resolution_x, scene.render.resolution_y = 1100, 850
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world = bpy.data.worlds.new("Review background")
    scene.world.color = (0.22, 0.22, 0.22)
    clay = material("Review clay", (0.42, 0.44, 0.43), 0.85)
    originals = {o.name: list(mesh_data(o).materials) for o in scene.objects if o.type == "MESH"}
    camera = present(scene.camera)
    require(camera.data, bpy.types.Camera).ortho_scale = 4.4
    output.mkdir(parents=True, exist_ok=True)
    for surface in ("clay", "material"):
        for name, materials in originals.items():
            mesh = mesh_data(bpy.data.objects[name])
            mesh.materials.clear()
            for mat in materials:
                mesh.materials.append(clay if surface == "clay" else mat)
        for view, position in (("side", (0, -7, 2.0)), ("portrait", (4.3, -6.8, 3.0))):
            camera.location = position
            camera.rotation_euler = (
                (Vector((0, 0, 1.05)) - camera.location).to_track_quat("-Z", "Y").to_euler()
            )
            scene.render.filepath = str(output / f"{clip}-{frame}-{surface}-{view}.png")
            bpy.ops.render.render(write_still=True)
