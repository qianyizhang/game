"""Disposable saved-action edit, reload, fitting, export and fresh pose evidence."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from authoring_plan import save_working_source
from native_types import present
from otter_delivery import export, fit, mesh_digest, sha
from otter_sample import sample
from otter_transform_proof import verify_transforms


def verify(root: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Verification output must be fresh")
    models = Path(__file__).resolve().parents[3] / "assets/otter"
    protected = {
        p: sha(p)
        for p in [root / "motion.blend", root / "otter/source.blend", models / "otter.glb"]
    }
    sample(root, models, output / "reference", ("otter",))
    working = output / "sources"
    working.mkdir(parents=True)
    shutil.copy2(root / "motion.blend", working / "motion.blend")
    shutil.copytree(root / "otter", working / "otter")
    bpy.ops.wm.open_mainfile(filepath=str(working / "otter/source.blend"))
    before = mesh_digest()
    bpy.ops.wm.open_mainfile(filepath=str(working / "motion.blend"))
    rig = bpy.data.objects["MotionRig"]
    rig.animation_data_create().action = bpy.data.actions["scent"]
    present(bpy.context.scene).frame_set(150)
    head = present(rig.pose).bones["CTRL_head"]
    previous = head.rotation_euler.z
    head.rotation_euler.z += 0.12
    head.keyframe_insert("rotation_euler", frame=150, group="CTRL_head")
    save_working_source(working / "motion.blend")
    fit(working)
    bpy.ops.wm.open_mainfile(filepath=str(working / "otter/source.blend"))
    rig = bpy.data.objects["CharacterRig"]
    rig.animation_data_create().action = bpy.data.actions["scent"]
    present(bpy.context.scene).frame_set(150)
    change = present(rig.pose).bones["CTRL_head"].rotation_euler.z - previous
    if mesh_digest() != before or abs(change - 0.12) > 1e-6:
        raise ValueError("Saved edit failed or sculpt/weights changed")
    export(working, output / "models")
    sample(working, output / "models", output / "poses", ("otter",))
    transform_proof = verify_transforms(root, output / "transforms")
    if any(sha(p) != digest for p, digest in protected.items()):
        raise ValueError("Native proof mutated authoritative files")
    report = {
        "meshAndWeightsUnchanged": True,
        "authoritativeSourcesAndDeliveryUnchanged": True,
        "headChangeRadians": change,
        "editedClip": "scent",
        "editedFrame": 150,
        "samplerSha256": sha(Path(__file__).with_name("otter_sample.py")),
        "coverage": "each clip at 12 Hz plus both endpoints; 16 vertices per mesh",
        "sourcePins": {str(p): digest for p, digest in protected.items()},
        "geometryDigestVersion": 2,
        "transformFaultCasesRejected": transform_proof["faultCasesRejected"],
        "validSavedSourceAccepted": transform_proof["validSavedSourceAccepted"],
    }
    (output / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
