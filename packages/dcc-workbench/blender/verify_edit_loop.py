"""Exercise native controls and save/reload/export only in a fresh source copy."""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from authoring_plan import AuthoringRequest, parse_request  # noqa: E402
from export_asset import export_asset  # noqa: E402
from head_components import validate_heads  # noqa: E402
from head_shape import CHANNELS, HEADS  # noqa: E402
from native_types import mesh_data, present, require  # noqa: E402

if TYPE_CHECKING:
    import bpy
    from mathutils import Vector


def vertices(obj: bpy.types.Object) -> list[Vector]:
    import bpy

    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    try:
        return [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
    finally:
        evaluated.to_mesh_clear()


def difference(before: list[Vector], after: list[Vector]) -> float:
    return max((a - b).length for a, b in zip(before, after, strict=True))


def verify(request: AuthoringRequest) -> None:
    import bpy

    original = request.root / "sources/briar-hydra.blend"
    digest = hashlib.sha256(original.read_bytes()).hexdigest()
    request.output.mkdir(parents=True, exist_ok=False)
    source = request.output / "sources/briar-hydra.blend"
    source.parent.mkdir()
    (request.output / "briefs").mkdir()
    shutil.copy2(original, source)
    shutil.copy2(
        request.root / "briefs/briar-hydra.json", request.output / "briefs/briar-hydra.json"
    )
    bpy.ops.wm.open_mainfile(filepath=str(source))

    def update() -> None:
        require(bpy.context.scene, bpy.types.Scene).frame_set(1)
        present(bpy.context.view_layer).update()
        validate_heads(bpy.data.collections["DELIVERY | Briar Hydra"])

    probes = []
    for design in HEADS:
        control = bpy.data.objects[f"EDIT | Head.{design.role}"]
        assembly = bpy.data.collections[f"HEAD | {design.role}"]
        for channel in CHANNELS:
            # Choose a mesh this channel actually deforms, without fixing mesh counts.
            obj = next(
                obj
                for obj in assembly.objects
                if any(
                    (
                        require(a, bpy.types.ShapeKeyPoint).co
                        - require(b, bpy.types.ShapeKeyPoint).co
                    ).length
                    > 1e-6
                    for a, b in zip(
                        present(mesh_data(obj).shape_keys).key_blocks[channel].data,
                        present(mesh_data(obj).shape_keys).key_blocks["Basis"].data,
                        strict=True,
                    )
                )
            )
            setting: object = control[channel]
            if not isinstance(setting, (float, int)):
                raise ValueError("Expected numeric native control")
            update()
            before = vertices(obj)
            samples = []
            for value in (0.0, 1.3, 1.5):
                control[channel] = value
                control.update_tag()
                update()
                samples.append(vertices(obj))
            reach = difference(samples[0], samples[1])
            upper = difference(samples[1], samples[2])
            if min(reach, upper) < 1e-5:
                raise ValueError(f"Control did not deform geometry: {design.role}, {channel}")
            control[channel] = setting
            control.update_tag()
            update()
            if difference(before, vertices(obj)) > 1e-6:
                raise ValueError("Restoring a control did not restore evaluated geometry")
            probes.append(
                {"role": design.role, "channel": channel, "travel": reach, "upper": upper}
            )

    control = bpy.data.objects["EDIT | Head.Search"]
    probe = next(
        obj
        for obj in bpy.data.collections["HEAD | Search"].objects
        if obj.name.startswith("Skull.")
    )
    key = present(mesh_data(probe).shape_keys).key_blocks["Muzzle reach"]
    key.slider_max = 1.0
    control["Muzzle reach"] = 1.3
    control.update_tag()
    try:
        update()
    except ValueError as error:
        if "Head control differs" not in str(error):
            raise
    else:
        raise ValueError("Clamped-control negative check was not rejected")
    key.slider_max = 1.5
    control["Muzzle reach"] = 0.5
    control.update_tag()
    update()
    edited = vertices(probe)
    probe_name = probe.name
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    update()
    if bpy.data.objects["EDIT | Head.Search"]["Muzzle reach"] != 0.5:
        raise ValueError("Saved native control did not survive reload")
    if difference(edited, vertices(bpy.data.objects[probe_name])) > 1e-6:
        raise ValueError("Evaluated edit did not survive save/reload")
    export_asset(AuthoringRequest(request.output, request.output / "candidate"))
    if hashlib.sha256(original.read_bytes()).hexdigest() != digest:
        raise ValueError("Original artist source changed")
    (request.output / "edit-loop.json").write_text(
        json.dumps(
            {
                "sourceSha256": digest,
                "controls": probes,
                "clampRejected": True,
                "savedEdit": {"role": "Search", "channel": "Muzzle reach", "value": 0.5},
            },
            indent=2,
        )
        + "\n"
    )


if __name__ == "__main__":
    verify(parse_request(sys.argv, build=False))
