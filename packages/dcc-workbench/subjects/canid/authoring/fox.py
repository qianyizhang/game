"""Fox candidate adapter. Construction is explicit; fit/export read saved masters."""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import bpy

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from delivery import export, fit, save_new  # noqa: E402
from fox_anatomy import build_character  # noqa: E402
from motion import envelope, rotate  # noqa: E402
from motion_spec import read_spec, save_spec  # noqa: E402
from native_types import present  # noqa: E402
from parameters import FPS, Form  # noqa: E402
from rig import CONTROLS, make_rig  # noqa: E402
from studio import review  # noqa: E402

FORM = Form("fox", 0.88, 0.86, 0.82, 0.80)


def bootstrap(root: Path) -> None:
    import bpy

    if root.exists():
        raise FileExistsError("Fox construction requires a fresh candidate root")
    parent = Path(__file__).resolve().parents[1] / "refined/motion.blend"
    bpy.ops.wm.open_mainfile(filepath=str(parent))
    rig = bpy.data.objects["MotionRig"]
    keep = ["idle", "walk", "trot", "look"]
    rig.animation_data_clear()
    for action in list(bpy.data.actions):
        if action.name not in keep:
            bpy.data.actions.remove(action)
    # The saved refined gaits remain intact. Build a new scenting performance with
    # fixed paw controls, a forward/down neck reach, and delayed tail response.
    action = bpy.data.actions.new("sniff")
    action.use_fake_user = True
    rig.animation_data_create().action = action
    pose = present(rig.pose)
    end = 240
    for frame in range(end + 1):
        p = frame / end
        reach = envelope(p, 0.05, 0.30, 0.68, 0.96)
        scent = math.sin(p * math.tau * 5) * envelope(p, 0.30, 0.38, 0.66, 0.76)
        for name in CONTROLS:
            pose.bones[name].location = (0, 0, 0)
            pose.bones[name].rotation_euler = (0, 0, 0)
        pose.bones["CTRL_body"].location = (0.015 * reach, 0, -0.15 * reach)
        rotate(rig, "CTRL_neck", y=1.40 * reach)
        rotate(rig, "CTRL_head", y=0.05 * reach + 0.015 * scent, z=0.06 * scent)
        for i in range(4):
            rotate(
                rig,
                f"CTRL_tail.{i}",
                y=-0.065 * reach,
                z=0.035 * math.sin(math.tau * p - i * 0.5) * math.sin(math.pi * p) ** 2,
            )
        for side, sign in [("L", 1), ("R", -1)]:
            rotate(rig, f"CTRL_ear.{side}", x=sign * 0.12 * reach, y=-0.08 * reach)
        for name in CONTROLS:
            bone = pose.bones[name]
            bone.keyframe_insert("location", frame=frame, group=name)
            bone.keyframe_insert("rotation_euler", frame=frame, group=name)
    spec = read_spec(bpy.data.actions["idle"])
    spec["name"] = "Ground scent"
    spec["seconds"] = 4.0
    spec["playback"] = "once"
    spec["trajectory"] = [[frame / FPS, 0, 0, 0] for frame in range(end + 1)]
    spec["markers"] = [
        {"name": "lower", "time": 1.2},
        {"name": "scent", "time": 2.0},
        {"name": "recover", "time": 3.5},
    ]
    spec["contacts"] = [
        {
            "start": 0.0,
            "end": 4.0,
            "sites": ["front.L", "front.R", "hind.L", "hind.R"],
            "mode": "planted",
        }
    ]
    save_spec(action, spec)
    (
        action["end_frame"],
        action["travel_speed"],
        action["stance_fraction"],
        action["foot_offsets"],
    ) = end, 0.0, 1.0, [0.0] * 4
    labels = {"idle": "Alert breath", "walk": "Quiet walk", "trot": "Light trot", "look": "Listen"}
    for name, label in labels.items():
        spec = read_spec(bpy.data.actions[name])
        spec["name"] = label
        save_spec(bpy.data.actions[name], spec)
    retime_listen(rig)
    rig["motion_clips"] = json.dumps([*keep, "sniff"])
    rig["parent_motion_source"] = str(parent)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    present(bpy.context.scene).frame_set(0)
    save_new(root / "motion.blend")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rig = make_rig(FORM)
    build_character(FORM, rig)
    present(bpy.context.scene).render.fps = FPS
    save_new(root / "fox/source.blend")


def retime_listen(rig: bpy.types.Object) -> None:
    """Lengthen the saved listening gesture once, including its phase contract."""
    import bpy

    scene = present(bpy.context.scene)
    original = bpy.data.actions["look"]
    spec = read_spec(original)
    if abs(spec["seconds"] - 1.6) > 0.001:
        raise ValueError("Listen revision requires the 1.6 second refined parent")
    rig.animation_data_create().action = original
    samples = []
    for frame in range(193):
        scene.frame_set(frame // 2, subframe=(frame % 2) / 2)
        samples.append(
            [
                (
                    present(rig.pose).bones[n].location.copy(),
                    present(rig.pose).bones[n].rotation_euler.copy(),
                )
                for n in CONTROLS
            ]
        )
    original.name = "parent_listen"
    action = bpy.data.actions.new("look")
    action.use_fake_user = True
    rig.animation_data_create().action = action
    for frame, poses in enumerate(samples):
        for name, (location, rotation) in zip(CONTROLS, poses, strict=True):
            bone = present(rig.pose).bones[name]
            bone.location, bone.rotation_euler = location, rotation
            bone.keyframe_insert("location", frame=frame, group=name)
            bone.keyframe_insert("rotation_euler", frame=frame, group=name)
    for key in ("travel_speed", "stance_fraction", "foot_offsets"):
        action[key] = original[key]
    action["end_frame"] = 192
    spec["seconds"] = 3.2
    spec["trajectory"] = [[frame / FPS, 0, 0, 0] for frame in range(193)]
    for phase in spec["contacts"]:
        phase["start"] *= 2
        phase["end"] *= 2
    for marker in spec["markers"]:
        marker["time"] *= 2
    save_spec(action, spec)
    bpy.data.actions.remove(original)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["bootstrap", "fit", "export", "review"])
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--clip", default="idle")
    parser.add_argument("--frame", type=int, default=0)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    root = args.root.resolve()
    if args.command == "bootstrap":
        bootstrap(root)
    elif args.command == "fit":
        fit(root, FORM)
    elif args.output and args.command == "export":
        export(root, args.output.resolve(), FORM)
    elif args.output:
        review(root / "fox/source.blend", args.output.resolve(), args.frame, args.clip)
    else:
        parser.error("export/review require --output")


if __name__ == "__main__":
    main()
