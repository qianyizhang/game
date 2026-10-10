"""Canid action recipes. These author editable keys once, never during fitting/export."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from native_types import present
from parameters import FEET, FORMS, FPS, contact_offset, paw_origin, pole_origin

if TYPE_CHECKING:
    import bpy


def trajectory(clip: str, t: float) -> tuple[float, float, float]:
    """Native X/Y travel and yaw; body performance stays local to this trajectory."""
    from motion import ease

    if clip == "flee":
        # Integrate the authored acceleration along a smooth 80-degree escape arc.
        dt = 1 / FPS
        x = y = 0.0
        for i in range(round(t * FPS)):
            s = (i + 0.5) * dt
            yaw = 1.4 * ease(s / 1.1)
            speed = 0.35 + 3.1 * ease(s / 1.3)
            x += math.cos(yaw) * speed * dt
            y += math.sin(yaw) * speed * dt
        return x, y, 1.4 * ease(t / 1.1)
    if clip == "roll":
        return 0, 1.45 * ease((t / 4 - 0.18) / 0.56), 0
    return 0, 0, 0


def step(
    p: float, a: float, b: float, start: float, end: float, lift: float
) -> tuple[float, float]:
    from motion import ease

    t = max(0.0, min(1.0, (p - a) / (b - a)))
    return start + (end - start) * ease(t), lift * math.sin(math.pi * t) ** 2


def pose_action(rig: bpy.types.Object, clip: str, p: float) -> None:
    from mathutils import Euler, Vector
    from motion import ease, envelope, rotate

    pose = present(rig.pose)
    body = pose.bones["CTRL_body"]
    if clip in ("lunge", "bite", "swipe"):
        anticipation = envelope(p, 0.02, 0.18, 0.21, 0.35)
        strike = envelope(p, 0.19, 0.43, 0.50, 0.88)
        body.location = (
            0.34 * strike - 0.055 * anticipation,
            0,
            -0.16 * anticipation - 0.045 * strike,
        )
        body.rotation_euler.y = 0.075 * anticipation - 0.07 * strike
        rotate(rig, "CTRL_neck", y=0.10 * anticipation + 0.09 * strike)
        rotate(rig, "CTRL_head", y=0.10 * strike)
        for foot in FEET:
            front = foot.startswith("front")
            if clip == "swipe":
                active = foot == "front.R"
                x = 0.26 * strike if active else 0
                z = 0.40 * envelope(p, 0.13, 0.32, 0.48, 0.76) if active else 0
                lateral = -0.27 * envelope(p, 0.29, 0.47, 0.51, 0.66) if active else 0
            elif front:
                if p < 0.57:
                    x, z = step(p, 0.16, 0.44, 0, 0.36, 0.21 if clip == "lunge" else 0.10)
                else:
                    x, z = step(p, 0.68, 0.94, 0.36, 0, 0.11)
                lateral = 0
            else:
                x, z, lateral = 0.0, 0.0, 0.0
            pose.bones[f"CTRL_{foot}"].location = (x, lateral, z)
        if clip == "bite":
            opening = envelope(p, 0.08, 0.27, 0.32, 0.43) + 0.22 * envelope(
                p, 0.56, 0.65, 0.71, 0.88
            )
            rotate(rig, "CTRL_jaw", y=0.48 * opening)
            rotate(
                rig, "CTRL_head", y=0.12 * strike, z=-0.055 * envelope(p, 0.44, 0.50, 0.56, 0.67)
            )
        if clip == "swipe":
            rotate(rig, "CTRL_spine", z=-0.08 * strike)
            rotate(rig, "CTRL_scapula.R", y=-0.13 * strike)
        for i in range(4):
            rotate(rig, f"CTRL_tail.{i}", y=0.065 * strike, z=0.06 * anticipation)
    elif clip == "roll":
        tuck = envelope(p, 0.02, 0.18, 0.77, 0.99)
        angle = math.tau * ease((p - 0.18) / 0.56)
        rotation = Euler((angle, 0, 0)).to_matrix()
        center = Vector((0, 0, 1.25))
        body.location.z = -0.43 * tuck
        body.rotation_euler.x = angle
        for foot in FEET:
            rest = Vector(paw_origin(foot))
            local = rest.lerp(Vector((rest.x * 0.78, rest.y * 0.68, 0.68)), tuck)
            point = center + rotation @ (local - center) + body.location
            control = pose.bones[f"CTRL_{foot}"]
            control.location = point - rest
            control.rotation_euler = (angle, -0.28 * tuck, 0)
            pole = Vector(pole_origin(foot))
            pose.bones[f"CTRL_pole.{foot}"].location = (
                center + rotation @ (pole - center) + body.location - pole
            )
        rotate(rig, "CTRL_neck", y=0.70 * tuck)
        rotate(rig, "CTRL_head", y=0.40 * tuck)
        for i in range(4):
            rotate(rig, f"CTRL_tail.{i}", y=-0.11 * tuck)
    elif clip == "flee":
        t = p * 3.6
        cycle = t / 0.60
        root_x, root_y, yaw = trajectory(clip, t)
        inv = Euler((0, 0, -yaw)).to_matrix()
        body.location.z = -0.10 + 0.035 * math.cos(math.tau * cycle * 2)
        body.rotation_euler.y = 0.035 * math.sin(math.tau * cycle)
        # Each stance is a fixed world-space toe, including through the turn.
        for foot, offset in zip(FEET, (0.0, 0.10, 0.52, 0.62), strict=True):
            phase = (cycle + offset) % 1
            cycle_start = (math.floor(cycle + offset) - offset) * 0.60
            stance = 0.40
            rest = Vector(paw_origin(foot)) + Vector(contact_offset(FORMS[0]))

            def landing(time: float, rest: Vector = rest) -> Vector:
                if time < 0:
                    return rest.copy()
                rx, ry, a = trajectory(clip, time)
                return Vector((rx, ry, 0)) + Euler((0, 0, a)).to_matrix() @ (
                    rest + Vector((0.34, 0, 0))
                )

            first = landing(cycle_start)
            if phase < stance:
                world = first
            else:
                swing = (phase - stance) / (1 - stance)
                world = first.lerp(landing(cycle_start + 0.60), ease(swing))
                world.z += 0.28 * math.sin(math.pi * swing) ** 2
            toe = inv @ (world - Vector((root_x, root_y, 0)))
            pose.bones[f"CTRL_{foot}"].location = toe - rest
        rotate(rig, "CTRL_head", z=-0.15 * envelope(p, 0, 0.07, 0.17, 0.32))
