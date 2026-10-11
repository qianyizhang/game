"""Disposable saved-action edit, reload, fitting, export and fresh pose evidence."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from authoring_plan import save_working_source
from boar_delivery import export, fit, mesh_digest, sha
from native_types import present
from sample_canid import sample


def verify(root: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Verification output must be fresh")
    models = Path(__file__).resolve().parents[3] / "assets/boar"
    protected = {
        p: sha(p) for p in [root / "motion.blend", root / "boar/source.blend", models / "boar.glb"]
    }
    sample(root, models, output / "reference", ("boar",))
    working = output / "sources"
    working.mkdir(parents=True)
    shutil.copy2(root / "motion.blend", working / "motion.blend")
    shutil.copytree(root / "boar", working / "boar")
    bpy.ops.wm.open_mainfile(filepath=str(working / "boar/source.blend"))
    before = mesh_digest()
    bpy.ops.wm.open_mainfile(filepath=str(working / "motion.blend"))
    rig = bpy.data.objects["MotionRig"]
    rig.animation_data_create().action = bpy.data.actions["root"]
    present(bpy.context.scene).frame_set(144)
    head = present(rig.pose).bones["CTRL_head"]
    previous = head.rotation_euler.z
    head.rotation_euler.z += 0.12
    head.keyframe_insert("rotation_euler", frame=144, group="CTRL_head")
    save_working_source(working / "motion.blend")
    fit(working)
    bpy.ops.wm.open_mainfile(filepath=str(working / "boar/source.blend"))
    rig = bpy.data.objects["CharacterRig"]
    rig.animation_data_create().action = bpy.data.actions["root"]
    present(bpy.context.scene).frame_set(144)
    change = present(rig.pose).bones["CTRL_head"].rotation_euler.z - previous
    if mesh_digest() != before or abs(change - 0.12) > 1e-6:
        raise ValueError("Saved edit failed or sculpt/weights changed")
    export(working, output / "models")
    sample(working, output / "models", output / "poses", ("boar",))
    if any(sha(p) != digest for p, digest in protected.items()):
        raise ValueError("Native proof mutated authoritative files")
    report = {
        "meshAndWeightsUnchanged": True,
        "authoritativeSourcesAndDeliveryUnchanged": True,
        "headChangeRadians": change,
        "editedClip": "root",
        "editedFrame": 144,
        "sourcePins": {str(p): digest for p, digest in protected.items()},
    }
    (output / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
