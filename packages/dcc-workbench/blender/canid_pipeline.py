"""Explicit bootstrap, saved-clip fitting, and baked multi-clip export for the canid pilot."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from authoring_plan import save_working_source  # noqa: E402
from canid_model import build_character  # noqa: E402
from canid_rig import (  # noqa: E402
    CLIPS,
    CONTROLS,
    FEET,
    FORMS,
    FPS,
    Form,
    activate,
    author_motion,
    make_rig,
)
from native_types import mesh_data, present, require  # noqa: E402

if TYPE_CHECKING:
    pass


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def mesh_digest() -> str:
    import bpy

    values = []
    for obj in sorted(
        (o for o in present(bpy.context.scene).objects if o.type == "MESH"), key=lambda o: o.name
    ):
        mesh = mesh_data(obj)
        values.append(
            [
                obj.name,
                [[v.co.x, v.co.y, v.co.z] for v in mesh.vertices],
                [list(p.vertices) for p in mesh.polygons],
                [[(g.group, g.weight) for g in v.groups] for v in mesh.vertices],
            ]
        )
    return hashlib.sha256(json.dumps(values).encode()).hexdigest()


def save_new(path: Path) -> None:
    import bpy

    if path.exists():
        raise FileExistsError(f"Refusing to overwrite source: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(path), compress=True)


def bootstrap(root: Path, only: str) -> None:
    import bpy

    if only in ("all", "motion"):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        rig = make_rig(FORMS[0], "MotionRig")
        author_motion(rig)
        save_new(root / "motion.blend")
    for form in FORMS:
        if only not in ("all", form.name):
            continue
        bpy.ops.wm.read_factory_settings(use_empty=True)
        rig = make_rig(form)
        build_character(form, rig)
        save_new(root / form.name / "source.blend")


def fit(root: Path, form: Form) -> dict[str, object]:
    import bpy

    path = root / form.name / "source.blend"
    bpy.ops.wm.open_mainfile(filepath=str(path))
    before = mesh_digest()
    target = bpy.data.objects["CharacterRig"]
    target.animation_data_clear()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    bpy.ops.wm.append(
        directory=str(root / "motion.blend" / "Object") + "/", filename="MotionRig", link=False
    )
    source = bpy.data.objects["MotionRig"]
    for clip in CLIPS:
        if clip not in bpy.data.actions:
            bpy.ops.wm.append(
                directory=str(root / "motion.blend" / "Action") + "/", filename=clip, link=False
            )
    scene = present(bpy.context.scene)
    source.hide_render = True
    source.hide_set(True)
    source.animation_data_clear()
    for clip, end in CLIPS.items():
        original = bpy.data.actions[clip]
        original.name = f"SOURCE_{clip}"
        source.animation_data_create().action = original
        fitted = bpy.data.actions.new(clip)
        fitted.use_fake_user = True
        target.animation_data_create().action = fitted
        for frame in range(end + 1):
            scene.frame_set(frame)
            for name in CONTROLS:
                src = present(source.pose).bones[name]
                dst = present(target.pose).bones[name]
                dst.location = src.location.copy()
                dst.rotation_euler = src.rotation_euler.copy()
                # These are source local displacements, not regenerated gait functions.
                if name.startswith("CTRL_front") or name.startswith("CTRL_hind"):
                    dst.location.x *= form.stride
                    dst.location.y *= form.width
                    dst.location.z *= form.height
                elif name == "CTRL_body":
                    dst.location.x *= form.length
                    dst.location.y *= form.width
                    dst.location.z *= form.height
                dst.keyframe_insert("location", frame=frame, group=name)
                dst.keyframe_insert("rotation_euler", frame=frame, group=name)
        fitted["source_clip"] = clip
        fitted["source_sha256"] = sha(root / "motion.blend")
        fitted["end_frame"] = end
        fitted["travel_speed"] = float(original["travel_speed"]) * form.stride
    bpy.data.objects.remove(source, do_unlink=True)
    for action in list(bpy.data.actions):
        if action.name.startswith("SOURCE_"):
            bpy.data.actions.remove(action)
    target.animation_data_create().action = bpy.data.actions["idle"]
    scene.render.fps = FPS
    scene.frame_start, scene.frame_end = 0, CLIPS["idle"]
    scene.frame_set(0)
    if mesh_digest() != before:
        raise ValueError("Retargeting changed character mesh or weights")
    profile: dict[str, object] = {
        "family": "canid-v1",
        "character": form.name,
        "sourceSha256": sha(root / "motion.blend"),
        "meshSha256": before,
        "mode": "direct" if form == FORMS[0] or form == FORMS[1] else "retarget",
        "chainMap": {foot: foot for foot in FEET},
        "referencePose": "saved fitted rest skeleton; identical control axes",
        "corrections": {
            "strideScale": form.stride,
            "heightScale": form.height,
            "widthScale": form.width,
            "bodyLengthScale": form.length,
            "contact": "two-bone IK; world-rest paw orientation",
        },
    }
    target["motion_source_sha256"] = sha(root / "motion.blend")
    save_working_source(path)
    (path.parent / "retarget.json").write_text(json.dumps(profile, indent=2) + "\n")
    return profile


def export(root: Path, output: Path, form: Form) -> dict[str, object]:
    import bpy
    from mathutils import Vector

    source_path = root / form.name / "source.blend"
    bpy.ops.wm.open_mainfile(filepath=str(source_path))
    source_hash = sha(source_path)
    scene = present(bpy.context.scene)
    rig = bpy.data.objects["CharacterRig"]
    if rig.get("motion_source_sha256") != sha(root / "motion.blend"):
        raise ValueError("Shared motion changed; run fit before export")
    # Bake only deformation bones onto a temporary constraint-free armature.
    data = bpy.data.armatures.new("Deformation skeleton")
    baked = bpy.data.objects.new("Canid", data)
    scene.collection.objects.link(baked)
    activate(baked)
    bpy.ops.object.mode_set(mode="EDIT")
    source_bones = require(rig.data, bpy.types.Armature).bones
    for source_bone in source_bones:
        if not source_bone.use_deform:
            continue
        edit_bone = data.edit_bones.new(source_bone.name)
        edit_bone.head = source_bone.head_local
        edit_bone.tail = source_bone.tail_local
        edit_bone.matrix = source_bone.matrix_local.copy()
        edit_bone.length = source_bone.length
        if source_bone.parent and source_bone.parent.use_deform:
            edit_bone.parent = data.edit_bones[source_bone.parent.name]
    bpy.ops.object.mode_set(mode="OBJECT")
    for bone in present(baked.pose).bones:
        bone.rotation_mode = "QUATERNION"
    source_meshes = [obj for obj in scene.objects if obj.type == "MESH"]
    samples: dict[str, object] = {}
    contacts: dict[str, object] = {}
    exported_actions = []
    for clip, end in CLIPS.items():
        original = bpy.data.actions[clip]
        original.name = f"CONTROL_{clip}"
        rig.animation_data_create().action = original
        action = bpy.data.actions.new(clip)
        action.use_fake_user = True
        exported_actions.append(action)
        baked.animation_data_create().action = action
        clip_samples = []
        ankle_samples: list[list[list[float]]] = []
        sole_samples: list[list[list[float]]] = []
        sole_probes: dict[str, int] = json.loads(str(bpy.data.objects["Coat"]["sole_probes"]))
        max_ik_error = 0.0
        for frame in range(end + 1):
            scene.frame_set(frame)
            present(bpy.context.view_layer).update()
            evaluated = rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
            for bone in present(baked.pose).bones:
                source_pose = present(evaluated.pose).bones[bone.name].matrix.copy()
                if bone.parent:
                    parent_pose = present(evaluated.pose).bones[bone.parent.name].matrix
                    bone.matrix_basis = (
                        bone.bone.matrix_local.inverted()
                        @ bone.parent.bone.matrix_local
                        @ parent_pose.inverted()
                        @ source_pose
                    )
                else:
                    bone.matrix_basis = bone.bone.matrix_local.inverted() @ source_pose
                bone.keyframe_insert("location", frame=frame, group=bone.name)
                bone.keyframe_insert("rotation_quaternion", frame=frame, group=bone.name)
                bone.keyframe_insert("scale", frame=frame, group=bone.name)
            pose = present(evaluated.pose)
            ankle_samples.append(
                [
                    [
                        pose.bones[f"paw.{foot}"].head.x,
                        pose.bones[f"paw.{foot}"].head.y,
                        pose.bones[f"paw.{foot}"].head.z,
                    ]
                    for foot in FEET
                ]
            )
            coat = bpy.data.objects["Coat"].evaluated_get(bpy.context.evaluated_depsgraph_get())
            sole_samples.append(
                [
                    [
                        mesh_data(coat).vertices[sole_probes[foot]].co.x,
                        mesh_data(coat).vertices[sole_probes[foot]].co.y,
                        mesh_data(coat).vertices[sole_probes[foot]].co.z,
                    ]
                    for foot in FEET
                ]
            )
            for foot in FEET:
                max_ik_error = max(
                    max_ik_error,
                    (pose.bones[f"paw.{foot}"].head - pose.bones[f"CTRL_{foot}"].head).length,
                )
            if frame in {0, end // 4, end // 2, 3 * end // 4, end}:
                objects = []
                for obj in source_meshes:
                    evaluated_mesh = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
                    mesh = mesh_data(evaluated_mesh)
                    points = []
                    for index in [round(i * (len(mesh.vertices) - 1) / 15) for i in range(16)]:
                        point = evaluated_mesh.matrix_world @ mesh.vertices[index].co
                        points.append([point.x, point.z, -point.y])
                    objects.append({"name": obj.name, "points": points})
                clip_samples.append({"seconds": frame / FPS, "objects": objects})
        speed = float(original["travel_speed"])
        max_slip = 0.0
        max_height = 0.0
        max_sole_height = 0.0
        max_sole_slip = 0.0
        # Inspect all consecutive planted frames, not just exported pose samples.
        for frame in range(end):
            for i, foot in enumerate(FEET):
                phase = (frame / end + (0, 0.5, 0.75, 0.25)[i]) % 1
                next_phase = ((frame + 1) / end + (0, 0.5, 0.75, 0.25)[i]) % 1
                if clip == "walk" and not (
                    phase < 0.62 and next_phase < 0.62 and next_phase > phase
                ):
                    continue
                first = Vector(ankle_samples[frame][i])
                last = Vector(ankle_samples[frame + 1][i])
                rest = source_bones[f"paw.{foot}"].head_local
                max_height = max(max_height, abs(first.z - rest[2]))
                last.x += speed / FPS
                max_slip = max(max_slip, (last - first).length)
                sole_first = Vector(sole_samples[frame][i])
                sole_last = Vector(sole_samples[frame + 1][i])
                sole_last.x += speed / FPS
                max_sole_height = max(max_sole_height, abs(sole_first.z))
                max_sole_slip = max(max_sole_slip, (sole_last - sole_first).length)
        loop_error = max(
            (Vector(a) - Vector(b)).length
            for a, b in zip(ankle_samples[0], ankle_samples[-1], strict=True)
        )
        contacts[clip] = {
            "maxIkError": max_ik_error,
            "maxSoleHeight": max_sole_height,
            "maxSoleFrameSlip": max_sole_slip,
            "maxPlantedFrameSlip": max_slip,
            "maxPlantedHeightError": max_height,
            "ankleLoopError": loop_error,
            "travelSpeed": speed,
            "frames": end + 1,
        }
        samples[clip] = {"samples": clip_samples, "seconds": end / FPS}
        if max_ik_error > 0.025 or max_slip > 0.006 or max_height > 0.012 or loop_error > 0.001:
            raise ValueError(f"Contact check failed: {form.name}/{clip}: {contacts[clip]}")
    # Remove control actions and the authoring rig only in this export process.
    for obj in source_meshes:
        obj.parent = baked
        for modifier in obj.modifiers:
            if isinstance(modifier, bpy.types.ArmatureModifier):
                modifier.object = baked
    bpy.data.objects.remove(rig, do_unlink=True)
    for action in list(bpy.data.actions):
        if action.name.startswith("CONTROL_"):
            bpy.data.actions.remove(action)
    bpy.ops.object.select_all(action="DESELECT")
    baked.select_set(True)
    for obj in source_meshes:
        obj.select_set(True)
    present(bpy.context.view_layer).objects.active = baked
    baked.animation_data_create().action = exported_actions[0]
    scene.frame_start, scene.frame_end = 0, 96
    scene.frame_set(0)
    output.mkdir(parents=True, exist_ok=True)
    glb = output / f"{form.name}.glb"
    if glb.exists():
        raise FileExistsError(f"Export output must be fresh: {glb}")
    bpy.ops.export_scene.gltf(
        filepath=str(glb),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_anim_single_armature=True,
        export_force_sampling=True,
        export_frame_range=False,
        export_anim_slide_to_zero=True,
        export_skins=True,
        export_yup=True,
        export_morph=False,
        export_cameras=False,
        export_lights=False,
    )
    if sha(source_path) != source_hash:
        raise ValueError("Export mutated saved source")
    receipt: dict[str, object] = {
        "schemaVersion": 1,
        "character": form.name,
        "sourceSha256": source_hash,
        "motionSha256": sha(root / "motion.blend"),
        "modelSha256": sha(glb),
        "meshSha256": mesh_digest(),
        "exportScripts": {
            name: sha(Path(__file__).parent / name)
            for name in ["canid_pipeline.py", "canid_rig.py", "native_types.py"]
        },
        "blender": bpy.app.version_string,
        "space": "glTF world, Y up",
        "contacts": contacts,
        "clips": samples,
        "profile": json.loads((source_path.parent / "retarget.json").read_text()),
    }
    (output / f"{form.name}.json").write_text(json.dumps(receipt, indent=2) + "\n")
    return receipt


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["bootstrap", "fit", "export"])
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--character", choices=["all", "motion", *(f.name for f in FORMS)], default="all"
    )
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    root = args.root.resolve()
    if args.command == "bootstrap":
        bootstrap(root, args.character)
    else:
        for form in FORMS:
            if args.character not in ("all", form.name):
                continue
            if args.command == "fit":
                fit(root, form)
            elif args.output:
                export(root, args.output.resolve(), form)
            else:
                parser.error("export requires --output")


if __name__ == "__main__":
    main()
