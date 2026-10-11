"""Bounded post-parent action repair on fresh copied masters; no sculpt reconstruction."""

from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

from authoring_plan import save_working_source
from native_types import present
from otter_motion import CLIPS, groom_pose, read_spec, rotate
from otter_rig import FPS


def repair_groom(root: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Action repair requires a fresh copied-master directory")
    output.mkdir(parents=True)
    shutil.copy2(root / "motion.blend", output / "motion.blend")
    shutil.copytree(root / "otter", output / "otter")
    bpy.ops.wm.open_mainfile(filepath=str(output / "motion.blend"))
    rig = bpy.data.objects["MotionRig"]
    action = bpy.data.actions["groom"]
    rig.animation_data_create().action = action
    spec = read_spec(action)
    controls = ["body", "pelvis", "spine", "chest", "head", "fore.L", "fore.R"]
    end = round(spec["seconds"] * FPS)
    for frame in range(end + 1):
        present(bpy.context.scene).frame_set(frame)
        groom_pose(rig, frame / FPS)
        for i in range(3):
            p = frame / end
            name = f"tail.{i + 1:02d}"
            rotate(
                rig,
                name,
                z=0.024 * (i + 1) * math.sin(p * math.tau - 0.45 * i) * math.sin(math.pi * p) ** 2,
            )
        for name in [*controls, "tail.01", "tail.02", "tail.03"]:
            bone = present(rig.pose).bones[f"CTRL_{name}"]
            bone.keyframe_insert("location", frame=frame, group=f"CTRL_{name}")
            bone.keyframe_insert("rotation_euler", frame=frame, group=f"CTRL_{name}")
    spec["name"] = CLIPS["groom"][0]
    spec["contacts"] = [c for c in spec["contacts"] if c["sites"] != ["fore.R"]]
    spec["contacts"].append(
        {"start": 0, "end": spec["seconds"], "sites": ["fore.R"], "mode": "planted"}
    )
    spec["markers"] = [
        {"name": name, "time": t}
        for name, t in [("support", 1.45), ("cheek", 2.6), ("wash", 3.8), ("lower", 4.8)]
    ]
    action["motion_spec"] = json.dumps(spec)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    present(bpy.context.scene).frame_set(0)
    save_working_source(output / "motion.blend")
