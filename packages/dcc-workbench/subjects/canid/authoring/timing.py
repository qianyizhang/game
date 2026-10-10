"""Timing profiles over saved controls; geometry and pose design remain authored."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
import shutil
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from motion_spec import Contact, read_spec, save_spec  # noqa: E402
from native_types import present  # noqa: E402
from parameters import FEET, FORMS, FPS, contact_offset  # noqa: E402
from rig import CONTROLS  # noqa: E402

if TYPE_CHECKING:
    import bpy

VERSION = "responsive-2026-10-10"
# Output phase -> saved source phase. Concentrate attack drive, while retaining
# anticipation and recovery; quiet motion receives only modest cadence changes.
PROFILES: dict[str, tuple[int, list[tuple[float, float]]]] = {
    "idle": (216, [(0, 0), (1, 1)]),
    "walk": (48, [(0, 0), (1, 1)]),
    "trot": (30, [(0, 0), (1, 1)]),
    "run": (30, [(0, 0), (1, 1)]),
    "look": (96, [(0, 0), (0.04, 0.09), (0.18, 0.20), (0.54, 0.57), (0.80, 0.78), (1, 1)]),
    "lunge": (
        57,
        [(0, 0), (0.18, 0.18), (0.32, 0.44), (0.44, 0.57), (0.66, 0.68), (0.92, 0.94), (1, 1)],
    ),
    "bite": (
        42,
        [(0, 0), (0.12, 0.08), (0.25, 0.32), (0.34, 0.43), (0.59, 0.65), (0.92, 0.94), (1, 1)],
    ),
    "swipe": (51, [(0, 0), (0.19, 0.20), (0.34, 0.47), (0.62, 0.70), (0.91, 0.94), (1, 1)]),
    "roll": (144, [(0, 0), (0.18, 0.18), (0.45, 0.46), (0.72, 0.74), (0.89, 0.86), (1, 1)]),
    "flee": (144, [(0, 0), (0.07, 0.10), (0.27, 0.40), (1, 1)]),
}


def warp(knots: list[tuple[float, float]], time: float) -> float:
    """Monotone cubic Hermite timing: continuous speed without phase reversal."""
    if time <= 0:
        return 0
    if time >= 1:
        return 1
    h = [b[0] - a[0] for a, b in zip(knots, knots[1:], strict=False)]
    d = [(b[1] - a[1]) / w for a, b, w in zip(knots, knots[1:], h, strict=False)]
    slopes = [d[0]]
    for i in range(1, len(knots) - 1):
        w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]
        slopes.append((w1 + w2) / (w1 / d[i - 1] + w2 / d[i]))
    slopes.append(d[-1])
    i = next(i for i in range(len(h)) if time <= knots[i + 1][0])
    t = (time - knots[i][0]) / h[i]
    return (
        (2 * t**3 - 3 * t**2 + 1) * knots[i][1]
        + (t**3 - 2 * t**2 + t) * h[i] * slopes[i]
        + (-2 * t**3 + 3 * t**2) * knots[i + 1][1]
        + (t**3 - t**2) * h[i] * slopes[i + 1]
    )


def inverse(knots: list[tuple[float, float]], phase: float) -> float:
    low, high = 0.0, 1.0
    for _ in range(40):
        mid = (low + high) / 2
        if warp(knots, mid) < phase:
            low = mid
        else:
            high = mid
    return (low + high) / 2


def refine_actions(rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Vector

    scene, pose = present(bpy.context.scene), present(rig.pose)
    for clip in json.loads(str(rig["motion_clips"])):
        original = bpy.data.actions[clip]
        if original.get("timing_profile"):
            raise ValueError(f"Timing already revised: {clip}; start from the previous master")
        old = read_spec(original)
        end, knots = PROFILES[clip]
        duration = end / FPS
        rig.animation_data_create().action = original
        poses = []
        trajectory = []
        for frame in range(end + 1):
            source_frame = warp(knots, frame / end) * old["seconds"] * FPS
            scene.frame_set(math.floor(source_frame), subframe=source_frame % 1)
            poses.append(
                [
                    (pose.bones[n].location.copy(), pose.bones[n].rotation_euler.copy())
                    for n in CONTROLS
                ]
            )
            if clip in ("walk", "trot", "run"):
                # Sample planted travel in toe space. Interpolating an ankle's
                # curved pivot offset independently from its rotation creates slip.
                pivot = Vector(contact_offset(FORMS[0]))
                toes = []
                for source_key in (math.floor(source_frame), math.ceil(source_frame)):
                    scene.frame_set(source_key)
                    toes.append(
                        {
                            f"CTRL_{foot}": pose.bones[f"CTRL_{foot}"].location
                            - pivot
                            + pose.bones[f"CTRL_{foot}"].rotation_euler.to_matrix() @ pivot
                            for foot in FEET
                        }
                    )
                for i, name in enumerate(CONTROLS):
                    if name in toes[0]:
                        rotation = poses[-1][i][1]
                        travel = toes[0][name].lerp(toes[1][name], source_frame % 1)
                        poses[-1][i] = (travel + pivot - rotation.to_matrix() @ pivot, rotation)
            first = min(math.floor(source_frame), len(old["trajectory"]) - 2)
            a, b = old["trajectory"][first : first + 2]
            fraction = source_frame - first
            trajectory.append(
                [frame / FPS, *[a[i] + (b[i] - a[i]) * fraction for i in range(1, 4)]]
            )
        original.name = f"PREVIOUS_{clip}"
        action = bpy.data.actions.new(clip)
        action.use_fake_user = True
        rig.animation_data_create().action = action
        for frame, values in enumerate(poses):
            for name, (location, rotation) in zip(CONTROLS, values, strict=True):
                bone = pose.bones[name]
                bone.location, bone.rotation_euler = location, rotation
                bone.keyframe_insert("location", frame=frame, group=name)
                bone.keyframe_insert("rotation_euler", frame=frame, group=name)
        for curve in action.fcurves:
            for key in curve.keyframe_points:
                key.interpolation = "LINEAR"
        spec = copy.deepcopy(old)
        spec["seconds"], spec["trajectory"] = duration, trajectory
        for marker in spec["markers"]:
            marker["time"] = inverse(knots, marker["time"] / old["seconds"]) * duration
        contacts: list[Contact] = []
        for contact in spec["contacts"]:
            # Never round a support interval outward into a neighbouring swing frame.
            first = math.ceil(inverse(knots, contact["start"] / old["seconds"]) * end - 1e-7)
            last = math.floor(inverse(knots, contact["end"] / old["seconds"]) * end + 1e-7)
            if first <= last:
                contacts.append({**contact, "start": first / FPS, "end": last / FPS})
        spec["contacts"] = contacts
        save_spec(action, spec)
        action["clip"], action["end_frame"] = clip, end
        action["travel_speed"] = float(original["travel_speed"]) * old["seconds"] / duration
        action["stance_fraction"] = original["stance_fraction"]
        action["foot_offsets"] = list(original["foot_offsets"])
        action["timing_profile"] = VERSION
        action["timing_knots"] = json.dumps(knots)
        bpy.data.actions.remove(original)
    rig.animation_data_create().action = bpy.data.actions["idle"]
    scene.frame_start, scene.frame_end = 0, PROFILES["idle"][0]
    scene.frame_set(0)


def revise(root: Path, output: Path) -> None:
    import bpy
    from authoring_plan import save_working_source

    if output.exists():
        raise FileExistsError("Timing review requires a fresh candidate directory")
    output.mkdir(parents=True)
    for relative in ["motion.blend", *[f"{form.name}/source.blend" for form in FORMS]]:
        path = output / relative
        path.parent.mkdir(exist_ok=True)
        shutil.copy2(root / relative, path)
    bpy.ops.wm.open_mainfile(filepath=str(output / "motion.blend"))
    refine_actions(bpy.data.objects["MotionRig"])
    present(bpy.context.scene)["timing_parent_sha256"] = hashlib.sha256(
        (root / "motion.blend").read_bytes()
    ).hexdigest()
    save_working_source(output / "motion.blend")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    revise(args.root.resolve(), args.output.resolve())
