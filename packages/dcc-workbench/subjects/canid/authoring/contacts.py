"""Offline fitting corrections and full-body support evidence for saved motions."""

from __future__ import annotations

from typing import TYPE_CHECKING, TypedDict

from motion_spec import MotionSpec
from native_types import mesh_data, present, require
from parameters import FEET, FPS, Form, contact_offset, paw_origin

if TYPE_CHECKING:
    import bpy


def fit_supports(
    rig: bpy.types.Object, spec: MotionSpec, form: Form, clip: str, source: bpy.types.Object
) -> None:
    import math

    import bpy
    from mathutils import Euler, Quaternion, Vector

    scene = present(bpy.context.scene)
    end = round(spec["seconds"] * FPS)
    pose = present(rig.pose)
    if clip == "flee":
        for foot in FEET:
            control = pose.bones[f"CTRL_{foot}"]
            correction: dict[int, Vector] = {}
            for contact in spec["contacts"]:
                if foot not in contact["sites"] or contact["mode"] != "planted":
                    continue
                first, last = round(contact["start"] * FPS), round(contact["end"] * FPS)
                anchor = None
                for frame in range(first, last + 1):
                    scene.frame_set(frame)
                    _, x, z, yaw = spec["trajectory"][frame]
                    rotation = Euler((0, 0, yaw)).to_matrix()
                    toe = (
                        Vector(form.point(paw_origin(foot)))
                        + control.location
                        + control.rotation_euler.to_matrix() @ Vector(contact_offset(form))
                    )
                    world = Vector((x, -z, 0)) + rotation @ toe
                    if anchor is None:
                        anchor = world.copy()
                    correction[frame] = rotation.inverted() @ (anchor - world)
            known = sorted(correction)
            if not known:
                continue
            for frame in range(end + 1):
                scene.frame_set(frame)
                left = max((f for f in known if f <= frame), default=known[0])
                right = min((f for f in known if f >= frame), default=known[-1])
                weight = (frame - left) / (right - left) if right != left else 0
                control.location += correction[left].lerp(correction[right], weight)
                control.keyframe_insert("location", frame=frame, group=control.name)
    if clip == "roll":
        meshes = [o for o in scene.objects if o.type == "MESH"]
        for frame in range(end + 1):
            scene.frame_set(frame)
            present(bpy.context.view_layer).update()
            # Nonuniform proportions change reach when the body is inverted.
            # Fold free paws inward rather than stretch a leg to meet a source target.
            for foot in FEET:
                upper = pose.bones[f"upper.{foot}"]
                target = pose.bones[f"MCH_pastern.{foot}"].head
                delta = target - upper.head
                reach = (upper.bone.length + pose.bones[f"lower.{foot}"].bone.length) * 0.995
                minimum = abs(upper.bone.length - pose.bones[f"lower.{foot}"].bone.length) + 0.005
                lower_length = pose.bones[f"lower.{foot}"].bone.length
                # During inversion the knee must stay on the belly side. Merely
                # staying above the IK minimum can fold a long shin behind its thigh.
                belly_reach = (
                    math.sqrt(max(0, lower_length**2 - upper.bone.length**2)) + 0.06 * form.height
                )
                inversion = math.sin(pose.bones["CTRL_body"].rotation_euler.x / 2) ** 2
                minimum += inversion * max(0, belly_reach - minimum)
                distance = max(minimum, min(reach, delta.length))
                if abs(delta.length - distance) > 1e-6:
                    control = pose.bones[f"CTRL_{foot}"]
                    control.location += delta.normalized() * (distance - delta.length)
                    control.keyframe_insert("location", frame=frame, group=control.name)
            present(bpy.context.view_layer).update()
            # Match the saved source knee plane after adapting the target's reach.
            # A short, broad thigh otherwise becomes the lowest point of an inverted body.
            source_pose = present(source.pose)
            rotation = pose.bones["CTRL_body"].rotation_euler.to_matrix()
            for foot in FEET:
                src_local = rotation.inverted() @ (
                    source_pose.bones[f"upper.{foot}"].tail - source_pose.bones["CTRL_body"].head
                )
                desired = pose.bones["CTRL_body"].head + rotation @ Vector(
                    form.point((src_local.x, src_local.y, src_local.z))
                )
                pole = pose.bones[f"CTRL_pole.{foot}"]
                for _ in range(3):
                    upper = pose.bones[f"upper.{foot}"]
                    origin = upper.head.copy()
                    axis = (pose.bones[f"MCH_pastern.{foot}"].head - origin).normalized()
                    current = upper.tail - origin
                    aim = desired - origin
                    current -= axis * current.dot(axis)
                    aim -= axis * aim.dot(axis)
                    angle = math.atan2(
                        axis.dot(require(current.cross(aim), Vector)), current.dot(aim)
                    )
                    offset = pole.head - origin
                    pole.location += Quaternion(axis, angle) @ offset - offset
                    present(bpy.context.view_layer).update()
                pole.keyframe_insert("location", frame=frame, group=pole.name)
            graph = bpy.context.evaluated_depsgraph_get()
            lowest = min(v.co.z for o in meshes for v in mesh_data(o.evaluated_get(graph)).vertices)
            for name in (
                "CTRL_body",
                *(f"CTRL_{f}" for f in FEET),
                *(f"CTRL_pole.{f}" for f in FEET),
            ):
                control = pose.bones[name]
                control.location.z -= lowest
                control.keyframe_insert("location", frame=frame, group=name)


class SupportEvidence(TypedDict):
    maxRollingHeight: float
    maxSoleHeight: float
    maxSoleFrameSlip: float
    supportPhases: list[dict[str, object]]


def support_evidence(
    spec: MotionSpec, soles: list[list[list[float]]], region_heights: list[dict[str, float]]
) -> SupportEvidence:
    from mathutils import Euler, Vector

    worst_height = worst_slip = rolling_height = 0.0
    phases: list[dict[str, object]] = []
    for contact in spec["contacts"]:
        first, last = round(contact["start"] * FPS), round(contact["end"] * FPS)
        height = slip = 0.0
        for site in contact["sites"]:
            if site in FEET:
                points = []
                for frame in range(first, last + 1):
                    _, x, z, yaw = spec["trajectory"][frame]
                    local = Vector(soles[frame][FEET.index(site)])
                    points.append(Vector((x, -z, 0)) + Euler((0, 0, yaw)).to_matrix() @ local)
                height = max(height, *(abs(v.z) for v in points))
                slip = max(
                    slip, *((b - a).length for a, b in zip(points, points[1:], strict=False)), 0
                )
            else:
                height = max(
                    height, *(abs(region_heights[f][site]) for f in range(first, last + 1))
                )
        if contact["mode"] == "planted":
            worst_height, worst_slip = max(worst_height, height), max(worst_slip, slip)
        else:
            rolling_height = max(rolling_height, height)
        phases.append({**contact, "maxHeight": height, "maxFrameSlip": slip})
    return {
        "maxRollingHeight": rolling_height,
        "maxSoleHeight": worst_height,
        "maxSoleFrameSlip": worst_slip,
        "supportPhases": phases,
    }
