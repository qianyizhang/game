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
from native_types import present  # noqa: E402
from parameters import FORMS  # noqa: E402


def verify(root: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Native verification requires a fresh output directory")
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
    before: dict[str, tuple[str, float]] = {}
    for form in FORMS:
        destination = working / form.name
        destination.mkdir()
        shutil.copy2(root / form.name / "source.blend", destination / "source.blend")
        bpy.ops.wm.open_mainfile(filepath=str(destination / "source.blend"))
        rig = bpy.data.objects["CharacterRig"]
        rig.animation_data_create().action = bpy.data.actions["look"]
        present(bpy.context.scene).frame_set(45)
        before[form.name] = (mesh_digest(), present(rig.pose).bones["CTRL_head"].rotation_euler.z)
    bpy.ops.wm.open_mainfile(filepath=str(working / "motion.blend"))
    rig = bpy.data.objects["MotionRig"]
    rig.animation_data_create().action = bpy.data.actions["look"]
    present(bpy.context.scene).frame_set(45)
    head = present(rig.pose).bones["CTRL_head"]
    head.rotation_euler.z += 0.18
    head.keyframe_insert("rotation_euler", frame=45, group="CTRL_head")
    save_working_source(working / "motion.blend")
    results = []
    for form in FORMS:
        fit(working, form)
        bpy.ops.wm.open_mainfile(filepath=str(working / form.name / "source.blend"))
        rig = bpy.data.objects["CharacterRig"]
        rig.animation_data_create().action = bpy.data.actions["look"]
        present(bpy.context.scene).frame_set(45)
        changed = present(rig.pose).bones["CTRL_head"].rotation_euler.z - before[form.name][1]
        geometry_equal = mesh_digest() == before[form.name][0]
        if not geometry_equal or abs(changed - 0.18) > 1e-6:
            raise ValueError(f"Source edit did not propagate without remeshing: {form.name}")
        export(working, output / "models", form)
        results.append(
            {
                "character": form.name,
                "meshAndWeightsUnchanged": geometry_equal,
                "headChangeRadians": changed,
            }
        )
    if any(sha(Path(p)) != digest for p, digest in protected.items()):
        raise ValueError("Native verification modified an authoritative source")
    report = {
        "schemaVersion": 1,
        "sourceEdit": "look / CTRL_head / frame 45 / +0.18 radians",
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
