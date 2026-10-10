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
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from anatomy import build_character  # noqa: E402
from authoring_plan import save_working_source  # noqa: E402
from contacts import fit_supports, support_evidence  # noqa: E402
from motion import author_motion  # noqa: E402
from motion_spec import read_spec, save_spec  # noqa: E402
from native_types import mesh_data, present, require  # noqa: E402
from parameters import CLIPS, FEET, FORMS, FPS, Form, contact_offset  # noqa: E402
from rig import CONTROLS, activate, make_rig  # noqa: E402
from studio import review

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
    recipes = {p.name: sha(p) for p in sorted(Path(__file__).parent.glob("*.py"))}
    present(bpy.context.scene)["recipe_sha256"] = json.dumps(recipes, sort_keys=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(path), compress=True)


def bootstrap(root: Path, only: str) -> None:
    import bpy

    requested = ([root / "motion.blend"] if only in ("all", "motion") else []) + [
        root / f.name / "source.blend" for f in FORMS if only in ("all", f.name)
    ]
    if any(path.exists() for path in requested):
        raise FileExistsError(
            "Construct into a fresh candidate directory; existing native sources are protected"
        )
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
    from mathutils import Vector

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
    for name in json.loads(str(source["motion_clips"])):
        if name not in bpy.data.actions:
            bpy.ops.wm.append(
                directory=str(root / "motion.blend" / "Action") + "/", filename=name, link=False
            )
    scene = present(bpy.context.scene)
    source.hide_render = True
    source.hide_set(True)
    source.animation_data_clear()
    originals = [a for a in bpy.data.actions if a.get("motion_spec") is not None]
    for original in originals:
        clip = original.name
        spec = read_spec(original)
        end = round(spec["seconds"] * FPS)
        original.name = f"SOURCE_{clip}"
        source.animation_data_create().action = original
        fitted = bpy.data.actions.new(clip)
        fitted.use_fake_user = True
        target.animation_data_create().action = fitted
        for point in spec["trajectory"]:
            point[1] *= form.stride
            point[2] *= form.stride
        for frame in range(end + 1):
            scene.frame_set(frame)
            for name in CONTROLS:
                src = present(source.pose).bones[name]
                dst = present(target.pose).bones[name]
                dst.location = src.location.copy()
                dst.rotation_euler = src.rotation_euler.copy()
                # These are source local displacements, not regenerated gait functions.
                if name.startswith("CTRL_front") or name.startswith("CTRL_hind"):
                    # Remove source toe-roll offset, scale travel/lift, then reapply
                    # the same saved rotation around the target's actual contact point.
                    rotation = src.rotation_euler.to_matrix()
                    source_pivot = Vector(contact_offset(FORMS[0]))
                    target_pivot = Vector(contact_offset(form))
                    travel = src.location - source_pivot + rotation @ source_pivot
                    travel.x *= form.stride
                    travel.y *= form.width
                    travel.z *= form.height
                    dst.location = travel + target_pivot - rotation @ target_pivot
                elif name == "CTRL_body":
                    dst.location.x *= form.length
                    dst.location.y *= form.width
                    dst.location.z *= form.height
                if clip == "roll" and (
                    name in [f"CTRL_{f}" for f in FEET] or name.startswith("CTRL_pole.")
                ):
                    src_body = present(source.pose).bones["CTRL_body"]
                    rotation = src_body.rotation_euler.to_matrix()
                    center = Vector((0, 0, 1.25)) + src_body.location
                    local = rotation.inverted() @ (src.head - center)
                    body_location = Vector(
                        form.point((src_body.location.x, src_body.location.y, src_body.location.z))
                    )
                    dst.location = (
                        Vector(form.point((0, 0, 1.25)))
                        + body_location
                        + rotation @ Vector(form.point((local.x, local.y, local.z)))
                        - dst.bone.head_local
                    )
                dst.keyframe_insert("location", frame=frame, group=name)
                dst.keyframe_insert("rotation_euler", frame=frame, group=name)
        fitted["source_clip"] = clip
        fitted["source_sha256"] = sha(root / "motion.blend")
        fitted["end_frame"] = end
        fitted["travel_speed"] = float(original["travel_speed"]) * form.stride
        fitted["stance_fraction"] = original["stance_fraction"]
        fitted["foot_offsets"] = list(original["foot_offsets"])
        save_spec(fitted, spec)
        fit_supports(target, spec, form, clip, source)
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
        "family": "canid-actions-v3",
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
            "contact": "articulated hocks; toe roll fitted to target paw proportions",
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
    foot_vertices = {
        obj.name: [v.index for v in mesh_data(obj).vertices if v.co.z < 0.23 * form.height]
        for obj in source_meshes
    }
    coat_rest = mesh_data(bpy.data.objects["Coat"])
    body_regions = {
        site: [
            v.index
            for v in coat_rest.vertices
            if -0.9 * form.length < v.co.x < 0.7 * form.length
            and v.co.z > 1.05 * form.height
            and (
                (site == "back" and v.co.z > 1.48 * form.height)
                or (site == "left-flank" and v.co.y > 0.15 * form.width)
                or (site == "right-flank" and v.co.y < -0.15 * form.width)
            )
        ]
        for site in ("back", "left-flank", "right-flank")
    }
    samples: dict[str, object] = {}
    library = {}
    contacts: dict[str, object] = {}
    exported_actions = []
    failures = []
    originals = [a for a in bpy.data.actions if a.get("motion_spec") is not None]
    for original in originals:
        clip = original.name
        spec = read_spec(original)
        end = round(spec["seconds"] * FPS)
        original.name = f"CONTROL_{clip}"
        rig.animation_data_create().action = original
        action = bpy.data.actions.new(clip)
        action.use_fake_user = True
        action["end_frame"] = end
        exported_actions.append(action)
        baked.animation_data_create().action = action
        clip_samples = []
        ankle_samples: list[list[list[float]]] = []
        sole_samples: list[list[list[float]]] = []
        foot_heights: list[float] = []
        body_heights: list[float] = []
        region_heights: list[dict[str, float]] = []
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
            lowest = 1.0
            for obj in source_meshes:
                if not foot_vertices[obj.name]:
                    continue
                evaluated_foot = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
                foot_mesh = mesh_data(evaluated_foot)
                lowest = min(lowest, *(foot_mesh.vertices[i].co.z for i in foot_vertices[obj.name]))
            foot_heights.append(lowest)
            graph = bpy.context.evaluated_depsgraph_get()
            body_heights.append(
                min(
                    v.co.z
                    for obj in source_meshes
                    for v in mesh_data(obj.evaluated_get(graph)).vertices
                )
            )
            coat_mesh = mesh_data(coat)
            region_heights.append(
                {
                    site: min((coat_mesh.vertices[i].co.z for i in indices), default=0.0)
                    for site, indices in body_regions.items()
                }
            )
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
        stance = float(original["stance_fraction"])
        offsets = list(original["foot_offsets"])
        evidence = support_evidence(spec, sole_samples, region_heights)
        max_sole_height = evidence["maxSoleHeight"]
        max_sole_slip = evidence["maxSoleFrameSlip"]
        loop_error = max(
            (Vector(a) - Vector(b)).length
            for a, b in zip(ankle_samples[0], ankle_samples[-1], strict=True)
        )
        contacts[clip] = {
            "maxIkError": max_ik_error,
            "maxSoleHeight": max_sole_height,
            "maxSoleFrameSlip": max_sole_slip,
            **evidence,
            "minBodyHeight": min(body_heights),
            "ankleLoopError": loop_error,
            "travelSpeed": speed,
            "frames": end + 1,
            "minSoleHeight": min(p[2] for row in sole_samples for p in row),
            "maxSwingHeight": max(p[2] for row in sole_samples for p in row),
            "stanceFraction": stance,
            "footOffsets": offsets,
            "minFootHeight": min(foot_heights),
            "minSwingClearance": min(max(row[i][2] for row in sole_samples) for i in range(4)),
            "observedSupportCounts": sorted(
                {sum(point[2] < 0.002 for point in row) for row in sole_samples}
            ),
        }
        samples[clip] = {**spec, "samples": clip_samples}
        library[clip] = spec
        rolling_gap = evidence["maxRollingHeight"]
        if (
            rolling_gap > 0.04
            or max_ik_error > 0.002
            or max_sole_slip > 0.002
            or max_sole_height > 0.002
            or (spec["playback"] == "loop" and loop_error > 0.001)
            or min(body_heights) < -0.002
        ):
            failures.append(clip)
    if failures:
        output.mkdir(parents=True, exist_ok=True)
        (output / f"{form.name}-rejected.json").write_text(json.dumps(contacts, indent=2) + "\n")
        raise ValueError(f"Contact checks failed: {form.name}: {failures}; see rejection evidence")
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
    scene.frame_start, scene.frame_end = (
        0,
        max(int(a.get("end_frame", 0)) for a in exported_actions),
    )
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
        "schemaVersion": 3,
        "character": form.name,
        "sourceSha256": source_hash,
        "motionSha256": sha(root / "motion.blend"),
        "modelSha256": sha(glb),
        "meshSha256": mesh_digest(),
        "exportScripts": {
            str(path.relative_to(Path(__file__).resolve().parents[3])): sha(path)
            for path in [
                Path(__file__).resolve(),
                Path(__file__).with_name("rig.py"),
                Path(__file__).with_name("parameters.py"),
                Path(__file__).with_name("contacts.py"),
                Path(__file__).with_name("motion_spec.py"),
                Path(__file__).resolve().parents[3] / "blender/native_types.py",
            ]
        },
        "blender": bpy.app.version_string,
        "space": "glTF world, Y up",
        "contacts": contacts,
        "clips": samples,
        "profile": json.loads((source_path.parent / "retarget.json").read_text()),
    }
    (output / f"{form.name}.json").write_text(json.dumps(receipt, indent=2) + "\n")
    (output / f"{form.name}.motions.json").write_text(json.dumps(library, indent=2) + "\n")
    return receipt


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["bootstrap", "fit", "export", "review"])
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--clip", choices=list(CLIPS), default="idle")
    parser.add_argument("--frame", type=int, default=0)
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
                if args.command == "review":
                    review(
                        root / form.name / "source.blend",
                        args.output.resolve() / form.name,
                        args.frame,
                        args.clip,
                    )
                else:
                    export(root, args.output.resolve(), form)
            else:
                parser.error("export requires --output")


if __name__ == "__main__":
    main()
