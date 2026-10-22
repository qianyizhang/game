"""Compare saved masters across runtimes and verify new-format saves on fresh copies."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from native_types import mesh_data, present, require  # noqa: E402
from saved_export_plan import mapping  # noqa: E402

if TYPE_CHECKING:
    import bpy

Samples = dict[str, list[float]]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compare(before: Samples, after: Samples, tolerance: float) -> float:
    if before.keys() != after.keys():
        raise ValueError("Runtime changed sampled mesh, rig, action or topology identities")
    maximum = 0.0
    for key, values in before.items():
        other = after[key]
        if len(values) != len(other):
            raise ValueError(f"Runtime changed sample dimensions: {key}")
        for a, b in zip(values, other, strict=True):
            if not math.isfinite(a) or not math.isfinite(b):
                raise ValueError(f"Nonfinite native sample: {key}")
            maximum = max(maximum, abs(a - b))
            if abs(a - b) > tolerance:
                raise ValueError(f"Native runtime disagreement at {key}: {abs(a - b)}")
    return maximum


def read_samples(value: object) -> Samples:
    result: Samples = {}
    for key, raw in mapping(value).items():
        if not isinstance(raw, list) or any(
            isinstance(v, bool) or not isinstance(v, (int, float)) for v in raw
        ):
            raise ValueError(f"Invalid native samples: {key}")
        result[key] = [float(v) for v in raw]
        if any(not math.isfinite(v) for v in result[key]):
            raise ValueError(f"Nonfinite native samples: {key}")
    return result


def sample() -> Samples:
    import bpy

    scene = present(bpy.context.scene)
    frame, subframe = scene.frame_current, scene.frame_subframe
    result: Samples = {}
    rigs = [o for o in scene.objects if o.type == "ARMATURE"]
    bindings = [(o, present(o.animation_data).action) for o in rigs if o.animation_data]
    try:
        # Read every curve through the layered API shared by 4.5 and 5.2.
        for saved_action in bpy.data.actions:
            for layer in saved_action.layers:
                for strip in layer.strips:
                    for bag in require(strip, bpy.types.ActionKeyframeStrip).channelbags:
                        for curve in bag.fcurves:
                            key = (
                                f"action/{saved_action.name}/{bag.slot_handle}/"
                                f"{curve.data_path}/{curve.array_index}"
                            )
                            result[key] = [
                                float(p.co[i]) for p in curve.keyframe_points for i in (0, 1)
                            ]
        clips: list[tuple[str, bpy.types.Object | None]] = [("scene", None)]
        for motion_rig in rigs:
            names = json.loads(str(motion_rig.get("motion_clips", "[]")))
            clips.extend((str(name), motion_rig) for name in names)
        for clip, rig in clips:
            if rig is not None:
                action = bpy.data.actions[clip]
                rig.animation_data_create().action = action
                start, end = float(action.frame_range[0]), float(action.frame_range[1])
            else:
                start, end = float(scene.frame_start), float(scene.frame_end)
            for i in range(5):
                time = start + (end - start) * i / 4
                scene.frame_set(math.floor(time), subframe=time % 1)
                present(bpy.context.view_layer).update()
                graph = bpy.context.evaluated_depsgraph_get()
                prefix = f"{rig.name if rig else 'active'}/{clip}/{i}"
                for obj in scene.objects:
                    evaluated = obj.evaluated_get(graph)
                    if obj.type == "MESH":
                        mesh = mesh_data(evaluated)
                        points = [float(len(mesh.vertices)), float(len(mesh.polygons))]
                        if mesh.vertices:
                            for index in sorted(
                                {round(j * (len(mesh.vertices) - 1) / 15) for j in range(16)}
                            ):
                                point = evaluated.matrix_world @ mesh.vertices[index].co
                                points.extend((point.x, point.y, point.z))
                        result[f"{prefix}/mesh/{obj.name}"] = points
                    elif obj.type == "ARMATURE":
                        for bone in present(evaluated.pose).bones:
                            matrix = evaluated.matrix_world @ bone.matrix
                            result[f"{prefix}/bone/{obj.name}/{bone.name}"] = [
                                float(matrix[r][c]) for r in range(4) for c in range(4)
                            ]
    finally:
        for obj, bound_action in bindings:
            present(obj.animation_data).action = bound_action
        scene.frame_set(frame, subframe=subframe)
        present(bpy.context.view_layer).update()
    return result


def verify(root: Path, output: Path, baseline: Path | None = None) -> None:
    import bpy

    workspace = root.parent.parent
    if not any(
        output.is_relative_to(workspace / parent) for parent in ("test-results", ".work/runtime")
    ):
        raise ValueError("Runtime proof must stay under test-results or .work/runtime")
    if output.exists():
        raise FileExistsError("Runtime verification requires a fresh output directory")
    sources = sorted(
        path for home in ("subjects", "sources") for path in (root / home).rglob("*.blend")
    )
    if not sources or any(path.is_symlink() for path in sources):
        raise ValueError("Expected nonsymlink saved native masters")
    pins = {str(path.relative_to(root)): sha(path) for path in sources}
    reference = mapping(json.loads(baseline.read_text())) if baseline else None
    if reference is not None and reference.keys() != pins.keys():
        raise ValueError("Baseline native source inventory differs")
    output.mkdir(parents=True)
    samples: dict[str, object] = {}
    files: list[dict[str, object]] = []
    try:
        for source in sources:
            name = str(source.relative_to(root))
            bpy.ops.wm.open_mainfile(filepath=str(source), use_scripts=False)
            before = sample()
            compare(before, before, 0)
            baseline_error = None
            if reference is not None:
                entry = mapping(reference[name])
                if entry.get("sourceSha256") != pins[name]:
                    raise ValueError(f"Baseline source pin differs: {name}")
                baseline_error = compare(read_samples(entry.get("samples")), before, 1e-4)
            target = output / "sources" / name
            target.parent.mkdir(parents=True, exist_ok=True)
            bpy.ops.wm.save_as_mainfile(filepath=str(target), compress=True, copy=True)
            bpy.ops.wm.open_mainfile(filepath=str(target), use_scripts=False)
            reload_error = compare(before, sample(), 1e-6)
            samples[name] = {"sourceSha256": pins[name], "samples": before}
            files.append(
                {
                    "source": name,
                    "sourceSha256": pins[name],
                    "savedCopySha256": sha(target),
                    "sampleCount": sum(len(v) for v in before.values()),
                    "maximumBaselineError": baseline_error,
                    "maximumReloadError": reload_error,
                }
            )
            print("RUNTIME_VERIFIED", name, flush=True)
    finally:
        unchanged = all(sha(root / name) == digest for name, digest in pins.items())
        report = {
            "schemaVersion": 1,
            "blender": bpy.app.version_string,
            "buildHash": bpy.app.build_hash.decode(),
            "releaseCycle": bpy.app.version_cycle,
            "python": sys.version.split()[0],
            "binary": bpy.app.binary_path,
            "baseline": str(baseline) if baseline else None,
            "scriptSha256": sha(Path(__file__)),
            "completed": len(files) == len(sources),
            "authoritativeSourcesUnchanged": unchanged,
            "files": files,
        }
        (output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
        (output / "samples.json").write_text(json.dumps(samples, separators=(",", ":")) + "\n")
        if not unchanged:
            raise ValueError("Native runtime verification changed an authoritative source")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--baseline", type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    verify(args.root.resolve(), args.output.resolve(), args.baseline)
