"""Fresh fox pose sampling and disposable native save/edit/export propagation proof."""

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
from delivery import export, fit, mesh_digest, sha  # noqa: E402
from fox import FORM  # noqa: E402
from native_types import present  # noqa: E402
from sample_canid import sample  # noqa: E402


def verify(root: Path, models: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Verification output must be fresh")
    protected = {
        p: sha(p) for p in [root / "motion.blend", root / "fox/source.blend", models / "fox.glb"]
    }
    sample(root, models, output / "reference", ("fox",))
    working = output / "sources"
    shutil.copytree(root, working)
    bpy.ops.wm.open_mainfile(filepath=str(working / "fox/source.blend"))
    before = mesh_digest()
    rig = bpy.data.objects["CharacterRig"]
    rig.animation_data_create().action = bpy.data.actions["sniff"]
    present(bpy.context.scene).frame_set(120)
    previous = present(rig.pose).bones["CTRL_head"].rotation_euler.z
    bpy.ops.wm.open_mainfile(filepath=str(working / "motion.blend"))
    rig = bpy.data.objects["MotionRig"]
    rig.animation_data_create().action = bpy.data.actions["sniff"]
    present(bpy.context.scene).frame_set(120)
    head = present(rig.pose).bones["CTRL_head"]
    head.rotation_euler.z += 0.18
    head.keyframe_insert("rotation_euler", frame=120, group="CTRL_head")
    save_working_source(working / "motion.blend")
    fit(working, FORM)
    bpy.ops.wm.open_mainfile(filepath=str(working / "fox/source.blend"))
    rig = bpy.data.objects["CharacterRig"]
    rig.animation_data_create().action = bpy.data.actions["sniff"]
    present(bpy.context.scene).frame_set(120)
    change = present(rig.pose).bones["CTRL_head"].rotation_euler.z - previous
    if mesh_digest() != before or abs(change - 0.18) > 1e-6:
        raise ValueError("Native edit did not propagate while preserving mesh/weights")
    export(working, output / "models", FORM)
    sample(working, output / "models", output / "poses", ("fox",))
    if any(sha(p) != digest for p, digest in protected.items()):
        raise ValueError("Verification mutated authoritative source/delivery")
    report = {
        "meshAndWeightsUnchanged": True,
        "headChangeRadians": change,
        "authoritativeSourcesAndDeliveryUnchanged": True,
        "editedClip": "sniff",
        "editedFrame": 120,
    }
    (output / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["sample", "verify"])
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument(
        "--models", type=Path, default=Path(__file__).resolve().parents[3] / "assets/fox"
    )
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    if args.command == "sample":
        sample(args.root.resolve(), args.models.resolve(), args.output.resolve(), ("fox",))
    else:
        verify(args.root.resolve(), args.models.resolve(), args.output.resolve())
