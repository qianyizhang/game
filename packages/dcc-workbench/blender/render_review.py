"""Render the loaded Blender source for review, without saving or overwriting evidence."""

from __future__ import annotations

import sys
from pathlib import Path

# Blender --python does not consistently add the script's directory to sys.path.
if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from review_plan import (  # noqa: E402
    VIEWS,
    ReviewRequest,
    capture_path,
    close_review,
    parse_request,
)


def render_review(request: ReviewRequest) -> None:
    import bpy
    from mathutils import Vector

    if Path(bpy.data.filepath).resolve() != request.package_root / "sources/briar-hydra.blend":
        raise ValueError("Loaded Blender source does not match the requested package")
    scene = bpy.context.scene
    if scene is None or scene.world is None:
        raise ValueError("Review requires a scene with a world")
    request.output.mkdir(parents=True, exist_ok=False)
    scene.frame_set(1)
    # The generated 4.5 stubs list only EEVEE; Workbench is verified by the native smoke run.
    scene.render.engine = "BLENDER_WORKBENCH"  # type: ignore[assignment]
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    if scene.display is None or scene.display.shading is None:
        raise ValueError("Review requires viewport shading settings")
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.studiolight_rotate_z = 0.45
    shading.color_type = "SINGLE"
    shading.single_color = (0.52, 0.57, 0.54)
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.curvature_ridge_factor = 1.1
    shading.curvature_valley_factor = 1.1
    shading.background_type = "WORLD"
    scene.world.color = (0.04, 0.055, 0.06)
    bpy.ops.object.camera_add()
    camera = bpy.context.object
    if camera is None or not isinstance(camera.data, bpy.types.Camera):
        raise RuntimeError("Blender did not create a camera")
    scene.camera = camera
    camera.data.lens = 52
    for name, position in VIEWS:
        camera.location = position
        camera.rotation_euler = (
            (Vector((0, 0, 1.5)) - camera.location).to_track_quat("-Z", "Y").to_euler()
        )
        scene.render.filepath = str(capture_path(request.output, f"hydra-{name}.png"))
        bpy.ops.render.render(write_still=True)
    close_review(request.output)
    print("DCC_REVIEW", request.output)


def main(argv: list[str]) -> None:
    render_review(parse_request(argv))


if __name__ == "__main__":
    main(sys.argv)
