"""Install semantic native controls on a fresh copy of the saved artist source."""

from __future__ import annotations

import sys
from pathlib import Path

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
from authoring_plan import AuthoringRequest, parse_request  # noqa: E402
from head_components import install_heads  # noqa: E402
from scale_components import install_scales  # noqa: E402


def author(request: AuthoringRequest) -> None:
    import bpy

    if Path(bpy.data.filepath).resolve() != request.root / "sources/briar-hydra.blend":
        raise ValueError("Component installation requires the saved artist source")
    if request.output.exists():
        raise ValueError("Component candidate must be fresh")
    collection = bpy.data.collections["DELIVERY | Briar Hydra"]
    rig = bpy.data.objects["RIG | Briar Hydra"]
    install_heads(collection, rig)
    install_scales(collection, rig)
    if bpy.context.scene is None:
        raise ValueError("No scene")
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update() if bpy.context.view_layer else None
    request.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(request.output))


if __name__ == "__main__":
    author(parse_request(sys.argv, build=True))
