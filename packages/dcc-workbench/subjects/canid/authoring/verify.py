"""Native mutation proof: one saved action edit reaches all characters without remeshing."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from authoring_plan import save_working_source  # noqa: E402
from delivery import bootstrap, export, fit, mesh_digest, sha  # noqa: E402
from motion_spec import read_spec, save_spec  # noqa: E402
from native_types import present  # noqa: E402
from parameters import FORMS, FPS  # noqa: E402


def verify(root: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Native verification requires a fresh output directory")

    def midpoint(clip: str) -> int:
        return round(read_spec(bpy.data.actions[clip])["seconds"] * FPS) // 2

    paths = [root / "motion.blend", *(root / f.name / "source.blend" for f in FORMS)]
    protected = {str(p): sha(p) for p in paths}
    try:
        bootstrap(root, "all")
    except FileExistsError:
        pass
    else:
        raise AssertionError("Recipe construction did not protect existing native masters")
    working = output / "sources"
    working.mkdir(parents=True)
    shutil.copy2(root / "motion.blend", working / "motion.blend")
    before: dict[str, tuple[str, float, float]] = {}
    for form in FORMS:
        destination = working / form.name
        destination.mkdir()
        shutil.copy2(root / form.name / "source.blend", destination / "source.blend")
        bpy.ops.wm.open_mainfile(filepath=str(destination / "source.blend"))
        rig = bpy.data.objects["CharacterRig"]
        rig.animation_data_create().action = bpy.data.actions["look"]
        present(bpy.context.scene).frame_set(midpoint("look"))
        head_angle = present(rig.pose).bones["CTRL_head"].rotation_euler.z
        rig.animation_data_create().action = bpy.data.actions["bite"]
        present(bpy.context.scene).frame_set(midpoint("bite"))
        before[form.name] = (
            mesh_digest(),
            head_angle,
            present(rig.pose).bones["CTRL_jaw"].rotation_euler.x,
        )
    bpy.ops.wm.open_mainfile(filepath=str(working / "motion.blend"))
    rig = bpy.data.objects["MotionRig"]
    rig.animation_data_create().action = bpy.data.actions["look"]
    # Midpoints are included in the exported pose samples, so the browser proof
    # must observe both edits rather than only comparing unchanged sample times.
    present(bpy.context.scene).frame_set(midpoint("look"))
    head = present(rig.pose).bones["CTRL_head"]
    head.rotation_euler.z += 0.18
    head.keyframe_insert("rotation_euler", frame=midpoint("look"), group="CTRL_head")
    bite = bpy.data.actions["bite"]
    rig.animation_data_create().action = bite
    present(bpy.context.scene).frame_set(midpoint("bite"))
    jaw = present(rig.pose).bones["CTRL_jaw"]
    jaw.rotation_euler.x += 0.10
    jaw.keyframe_insert("rotation_euler", frame=midpoint("bite"), group="CTRL_jaw")
    spec = read_spec(bite)
    for marker in spec["markers"]:
        if marker["name"] == "contact":
            marker["time"] += 0.01
    save_spec(bite, spec)
    save_working_source(working / "motion.blend")
    results = []
    for form in FORMS:
        fit(working, form)
        bpy.ops.wm.open_mainfile(filepath=str(working / form.name / "source.blend"))
        rig = bpy.data.objects["CharacterRig"]
        rig.animation_data_create().action = bpy.data.actions["look"]
        present(bpy.context.scene).frame_set(midpoint("look"))
        changed = present(rig.pose).bones["CTRL_head"].rotation_euler.z - before[form.name][1]
        geometry_equal = mesh_digest() == before[form.name][0]
        rig.animation_data_create().action = bpy.data.actions["bite"]
        present(bpy.context.scene).frame_set(midpoint("bite"))
        jaw_changed = present(rig.pose).bones["CTRL_jaw"].rotation_euler.x - before[form.name][2]
        metadata_equal = read_spec(bpy.data.actions["bite"])["markers"] == spec["markers"]
        if (
            not geometry_equal
            or not metadata_equal
            or abs(changed - 0.18) > 1e-6
            or abs(jaw_changed - 0.10) > 1e-6
        ):
            raise ValueError(f"Source edit did not propagate without remeshing: {form.name}")
        export(working, output / "models", form)
        results.append(
            {
                "character": form.name,
                "meshAndWeightsUnchanged": geometry_equal,
                "headChangeRadians": changed,
                "jawChangeRadians": jaw_changed,
                "savedMarkerChangePropagated": metadata_equal,
            }
        )
    if any(sha(Path(p)) != digest for p, digest in protected.items()):
        raise ValueError("Native verification modified an authoritative source")
    report = {
        "schemaVersion": 1,
        "sourceEdit": (
            "look head +0.18 and bite jaw +0.10 at their clip midpoints; bite contact +0.01 seconds"
        ),
        "authoritativeSourcesUnchanged": True,
        "reconstructionOfExistingMastersRefused": True,
        "characters": results,
    }
    (output / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    verify(args.root.resolve(), args.output.resolve())
