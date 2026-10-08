"""Verify a declared native edit only inside an explicitly marked disposable package copy."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from export_saved import Point, maximum_difference, set_frame, world_vertices  # noqa: E402
from native_types import present, require  # noqa: E402
from saved_export_plan import mapping, package_path, text  # noqa: E402

if TYPE_CHECKING:
    import bpy

TOLERANCE = 1e-6
Snapshot = list[dict[str, list[Point]]]


@dataclass(frozen=True)
class EditDeclaration:
    object_name: str
    property_name: str
    values: tuple[float, float, float]
    moved: list[str]
    fixed: list[str]


def finite(value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
        raise ValueError("Native edit values must be finite numbers")
    return float(value)


def names(value: object) -> list[str]:
    if not isinstance(value, list) or not value:
        raise ValueError("Native edit must name moved and fixed meshes")
    result = [text(item) for item in value]
    if len(set(result)) != len(result):
        raise ValueError("Duplicate native edit mesh")
    return result


def declaration(value: object) -> EditDeclaration:
    spec = mapping(value)
    control = mapping(spec.get("control"))
    values = spec.get("values")
    if not isinstance(values, list) or len(values) != 3:
        raise ValueError("Native edit needs [minimum, interior, maximum] values")
    low, middle, high = (finite(value) for value in values)
    if not low < middle < high:
        raise ValueError("Native edit values must increase strictly")
    moved, fixed = names(spec.get("moved")), names(spec.get("fixed"))
    if set(moved) & set(fixed):
        raise ValueError("A native edit mesh cannot be both moved and fixed")
    return EditDeclaration(
        text(control.get("object")),
        text(control.get("property")),
        (low, middle, high),
        moved,
        fixed,
    )


def compare(before: Snapshot, after: Snapshot, names: list[str]) -> dict[str, float]:
    if len(before) != len(after):
        raise ValueError("Native edit frame coverage changed")
    return {
        name: max(maximum_difference(a[name], b[name]) for a, b in zip(before, after, strict=True))
        for name in names
    }


def verify(root: Path, asset_id: str, proof_path: Path) -> None:
    import bpy

    marker = mapping(json.loads((root / ".native-edit-copy.json").read_text()))
    if marker.get("schemaVersion") != 1 or marker.get("id") != asset_id:
        raise ValueError("Native verification requires a marked disposable package copy")
    if proof_path.exists():
        raise ValueError("Native edit proof must be new")
    registry = mapping(json.loads((root / "registry.json").read_text()))
    asset = mapping(mapping(registry.get("assets")).get(asset_id))
    if mapping(asset.get("native")).get("adapter") != "blender/export_saved.py":
        raise ValueError("Native edit gate requires the saved-subject exporter")
    source = package_path(root, asset.get("source"))
    if Path(bpy.data.filepath).resolve() != source:
        raise ValueError("Loaded source is not the disposable registered source")
    before_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    if marker.get("sourceSha256") != before_hash or marker.get("originSource") == str(source):
        raise ValueError("Disposable source does not match its original source pin")
    brief = mapping(json.loads(package_path(root, asset.get("brief")).read_text()))
    edit = declaration(brief.get("nativeEdit"))
    animation = mapping(mapping(asset.get("delivery")).get("animation"))
    fps, seconds = finite(animation.get("fps")), finite(animation.get("seconds"))
    scene = require(bpy.context.scene, bpy.types.Scene)
    if (
        scene.render.fps != fps
        or scene.render.fps_base != 1
        or scene.frame_end - scene.frame_start != fps * seconds
    ):
        raise ValueError("Native source timing differs from the registered animation")
    frames = [scene.frame_start + index * seconds * fps / 4 for index in range(5)]
    all_names = edit.moved + edit.fixed
    for name in all_names:
        if present(bpy.data.objects.get(name)).type != "MESH":
            raise ValueError(f"Native edit probe is not a mesh: {name}")

    def control() -> bpy.types.Object:
        return present(bpy.data.objects.get(edit.object_name))

    def assign(value: float) -> None:
        control()[edit.property_name] = value
        control().update_tag()
        present(bpy.context.view_layer).update()

    def capture() -> Snapshot:
        result: Snapshot = []
        for frame in frames:
            set_frame(require(bpy.context.scene, bpy.types.Scene), frame)
            present(bpy.context.view_layer).update()
            result.append({name: world_vertices(bpy.data.objects[name]) for name in all_names})
        return result

    original = finite(control().get(edit.property_name))
    baseline = capture()
    probes: list[Snapshot] = []
    for value in edit.values:
        assign(value)
        probe = capture()
        fixed = compare(baseline, probe, edit.fixed)
        if any(distance > TOLERANCE for distance in fixed.values()):
            raise ValueError(f"Native edit moved a declared fixed mesh: {fixed}")
        probes.append(probe)
    moved_results = [compare(probes[index], probes[index + 1], edit.moved) for index in range(2)]
    if any(distance <= TOLERANCE for result in moved_results for distance in result.values()):
        raise ValueError(f"Native control did not move every declared fitted mesh: {moved_results}")
    assign(original)
    restored = compare(baseline, capture(), all_names)
    if any(distance > TOLERANCE for distance in restored.values()):
        raise ValueError(f"Native edit did not restore evaluated source geometry: {restored}")
    selected_index = 1 if abs(original - edit.values[1]) > TOLERANCE else 2
    selected = edit.values[selected_index]
    assign(selected)
    edited = capture()
    set_frame(require(bpy.context.scene, bpy.types.Scene), frames[0])
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    if abs(finite(control().get(edit.property_name)) - selected) > TOLERANCE:
        raise ValueError("Native edit control did not survive save/reload")
    reloaded = compare(edited, capture(), all_names)
    if any(distance > TOLERANCE for distance in reloaded.values()):
        raise ValueError(f"Native edited geometry did not survive save/reload: {reloaded}")
    after_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    if after_hash == before_hash:
        raise ValueError("Native edit did not produce a distinct saved source")
    proof_path.parent.mkdir(parents=True, exist_ok=True)
    proof_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "id": asset_id,
                "sourceBeforeSha256": before_hash,
                "sourceEditedSha256": after_hash,
                "control": {"object": edit.object_name, "property": edit.property_name},
                "original": original,
                "values": edit.values,
                "savedValue": selected,
                "sampleFrames": frames,
                "sampleSeconds": [index * seconds / 4 for index in range(5)],
                "moved": edit.moved,
                "fixed": edit.fixed,
                "tolerance": TOLERANCE,
                "adjacentValueMotion": moved_results,
                "maxFixedDifference": max(
                    max(compare(baseline, probe, edit.fixed).values()) for probe in probes
                ),
                "maxRestorationDifference": max(restored.values()),
                "maxReloadDifference": max(reloaded.values()),
            },
            indent=2,
            allow_nan=False,
        )
        + "\n"
    )


def main(argv: list[str]) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package_root", type=Path)
    parser.add_argument("asset_id")
    parser.add_argument("proof_path", type=Path)
    args = parser.parse_args(argv[argv.index("--") + 1 :] if "--" in argv else [])
    verify(Path(args.package_root).resolve(), str(args.asset_id), Path(args.proof_path).resolve())


if __name__ == "__main__":
    main(sys.argv)
