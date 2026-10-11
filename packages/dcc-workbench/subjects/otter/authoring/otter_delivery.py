"""Saved otter masters → direct control fitting → deformation-only delivery."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from authoring_plan import save_working_source  # noqa: E402
from native_types import mesh_data, present, require  # noqa: E402
from otter_form import build  # noqa: E402
from otter_motion import CLIPS, author, read_spec  # noqa: E402
from otter_rig import CONTROLS, FEET, FPS, activate, make_rig  # noqa: E402


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def mesh_digest() -> str:
    import bpy

    values = []
    for obj in sorted(
        (o for o in present(bpy.context.scene).objects if o.type == "MESH"), key=lambda o: o.name
    ):
        data = mesh_data(obj)
        values.append(
            [
                obj.name,
                [[v.co.x, v.co.y, v.co.z] for v in data.vertices],
                [list(p.vertices) for p in data.polygons],
                [[(g.group, g.weight) for g in v.groups] for v in data.vertices],
            ]
        )
    return hashlib.sha256(json.dumps(values).encode()).hexdigest()


def save_new(path: Path) -> None:
    import bpy

    if path.exists():
        raise FileExistsError(f"New candidate required: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(path), compress=True)


def bootstrap(root: Path) -> None:
    import bpy

    if (root / "motion.blend").exists() or (root / "otter/source.blend").exists():
        raise FileExistsError("Construction requires fresh native paths")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rig = make_rig("MotionRig")
    author(rig)
    save_new(root / "motion.blend")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rig = make_rig("CharacterRig")
    build(rig)
    present(bpy.context.scene).render.fps = FPS
    save_new(root / "otter/source.blend")


def fit(root: Path) -> None:
    import bpy

    path = root / "otter/source.blend"
    bpy.ops.wm.open_mainfile(filepath=str(path))
    before = mesh_digest()
    rig = bpy.data.objects["CharacterRig"]
    rig.animation_data_clear()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    bpy.ops.wm.append(
        directory=str(root / "motion.blend" / "Object") + "/", filename="MotionRig", link=False
    )
    source = bpy.data.objects["MotionRig"]
    names = json.loads(str(source["motion_clips"]))
    for name in names:
        if name not in bpy.data.actions:
            bpy.ops.wm.append(
                directory=str(root / "motion.blend" / "Action") + "/", filename=name, link=False
            )
    # Evaluate the saved source on its original object slot. Key a character-bound
    # action so later action selection remains valid in Blender 4.5's slot system.
    source.animation_data_clear()
    for name in names:
        original = bpy.data.actions[name]
        original.name = f"SOURCE_{name}"
        source.animation_data_create().action = original
        fitted = bpy.data.actions.new(name)
        fitted.use_fake_user = True
        fitted["motion_spec"] = original["motion_spec"]
        rig.animation_data_create().action = fitted
        for frame in range(round(read_spec(original)["seconds"] * FPS) + 1):
            present(bpy.context.scene).frame_set(frame)
            for control in CONTROLS:
                src = present(source.pose).bones[control]
                dst = present(rig.pose).bones[control]
                dst.location, dst.rotation_euler = src.location.copy(), src.rotation_euler.copy()
                dst.keyframe_insert("location", frame=frame, group=control)
                dst.keyframe_insert("rotation_euler", frame=frame, group=control)
    bpy.data.objects.remove(source, do_unlink=True)
    for action in list(bpy.data.actions):
        if action.name.startswith("SOURCE_"):
            bpy.data.actions.remove(action)
    rig["motion_source_sha256"] = sha(root / "motion.blend")
    rig.animation_data_create().action = bpy.data.actions["idle"]
    present(bpy.context.scene).frame_set(0)
    if mesh_digest() != before:
        raise ValueError("Fitting changed sculpt or weights")
    save_working_source(path)
    profile = {
        "mode": "direct saved otter controls; not retargeting",
        "rig": "otter-v1",
        "sourceSha256": sha(root / "motion.blend"),
        "meshSha256": before,
    }
    (root / "otter/fitting.json").write_text(json.dumps(profile, indent=2) + "\n")


def export(root: Path, output: Path) -> None:
    import bpy
    from mathutils import Vector

    if output.exists():
        raise FileExistsError("Export requires fresh output directory")
    source = root / "otter/source.blend"
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    rig = bpy.data.objects["CharacterRig"]
    if rig.get("motion_source_sha256") != sha(root / "motion.blend"):
        raise ValueError("Saved motion changed; fit first")
    before = mesh_digest()
    data = bpy.data.armatures.new("Otter deformation skeleton")
    baked = bpy.data.objects.new("Otter", data)
    scene.collection.objects.link(baked)
    activate(baked)
    bpy.ops.object.mode_set(mode="EDIT")
    for rest_bone in require(rig.data, bpy.types.Armature).bones:
        if not rest_bone.use_deform:
            continue
        target = data.edit_bones.new(rest_bone.name)
        target.head, target.tail = rest_bone.head_local, rest_bone.tail_local
        target.matrix, target.length = rest_bone.matrix_local.copy(), rest_bone.length
        if rest_bone.parent and rest_bone.parent.use_deform:
            target.parent = data.edit_bones[rest_bone.parent.name]
    bpy.ops.object.mode_set(mode="OBJECT")
    for bone in present(baked.pose).bones:
        bone.rotation_mode = "QUATERNION"
    meshes = [o for o in scene.objects if o.type == "MESH"]
    soles = {
        f: [o for o in meshes if o.name.startswith(f"Paw {f} toe ") or o.name == f"Paw web {f}"]
        for f in FEET
    }
    probes = {
        o.name: min(mesh_data(o).vertices, key=lambda v: v.co.z).index
        for objects in soles.values()
        for o in objects
    }
    library = {}
    audits = {}
    actions = []
    for name in CLIPS:
        original = bpy.data.actions[name]
        spec = read_spec(original)
        library[name] = spec
        original.name = f"CONTROL_{name}"
        rig.animation_data_create().action = original
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        actions.append(action)
        baked.animation_data_create().action = action
        end = round(spec["seconds"] * FPS)
        positions: dict[str, list[list[Vector]]] = {f: [] for f in FEET}
        lowest, ik_error = 100.0, 0.0
        first_pose: dict[str, list[float]] = {}
        last_pose: dict[str, list[float]] = {}
        for frame in range(end + 1):
            scene.frame_set(frame)
            present(bpy.context.view_layer).update()
            graph = bpy.context.evaluated_depsgraph_get()
            evaluated = rig.evaluated_get(graph)
            pose = present(evaluated.pose)
            for bone in present(baked.pose).bones:
                matrix = pose.bones[bone.name].matrix.copy()
                if bone.parent:
                    bone.matrix_basis = (
                        bone.bone.matrix_local.inverted()
                        @ bone.parent.bone.matrix_local
                        @ pose.bones[bone.parent.name].matrix.inverted()
                        @ matrix
                    )
                else:
                    bone.matrix_basis = bone.bone.matrix_local.inverted() @ matrix
                for channel in ("location", "rotation_quaternion", "scale"):
                    bone.keyframe_insert(channel, frame=frame, group=bone.name)
                if frame in (0, end):
                    (first_pose if frame == 0 else last_pose)[bone.name] = [
                        matrix[i][j] for i in range(4) for j in range(4)
                    ]
            for foot in FEET:
                ik_error = max(
                    ik_error,
                    (pose.bones[f"paw.{foot}"].head - pose.bones[f"CTRL_{foot}"].head).length,
                )
                points = []
                for obj in soles[foot]:
                    point = mesh_data(obj.evaluated_get(graph)).vertices[probes[obj.name]].co.copy()
                    point.x += spec["trajectory"][frame][1]
                    points.append(point)
                positions[foot].append(points)
            lowest = min(
                lowest,
                *(v.co.z for obj in meshes for v in mesh_data(obj.evaluated_get(graph)).vertices),
            )
        slip, height = 0.0, 0.0
        for contact in spec["contacts"]:
            first, last = round(contact["start"] * FPS), round(contact["end"] * FPS)
            for foot in contact["sites"]:
                for frame in range(first, last + 1):
                    for digit in range(6):
                        point = positions[foot][frame][digit]
                        height = max(height, abs(point.z - 0.018))
                        slip = max(slip, (point - positions[foot][first][digit]).length)
        loop_error = max(
            abs(a - b)
            for name in first_pose
            for a, b in zip(first_pose[name], last_pose[name], strict=True)
        )
        audit = {
            "minimumSurfaceHeight": lowest,
            "maximumPawTargetError": ik_error,
            "maximumPlantedDigitDisplacement": slip,
            "maximumPlantedHeightDrift": height,
            "loopMatrixError": loop_error,
            "frames": end + 1,
            "supportSites": "five toes plus connected web of each paw; saved stance intervals",
            "supportPlaneHeight": 0.018,
        }
        audits[name] = audit
        if (
            lowest < -0.008
            or ik_error > 0.01
            or slip > 0.001
            or height > 0.002
            or (spec["playback"] == "loop" and loop_error > 0.0001)
        ):
            raise ValueError(f"Otter support audit failed: {name}: {audit}")
        path = spec["trajectory"]
        if all(
            abs(point[axis] - path[-1][axis] * point[0] / path[-1][0]) < 1e-10
            for point in path
            for axis in range(1, 4)
        ):
            spec["trajectory"] = [path[0], path[-1]]
    for obj in meshes:
        obj.parent = baked
        for modifier in obj.modifiers:
            if modifier.type == "ARMATURE":
                require(modifier, bpy.types.ArmatureModifier).object = baked
    bpy.data.objects.remove(rig, do_unlink=True)
    for action in list(bpy.data.actions):
        if action.name.startswith("CONTROL_"):
            bpy.data.actions.remove(action)
    activate(baked)
    for obj in meshes:
        obj.select_set(True)
    baked.animation_data_create().action = actions[0]
    scene.frame_set(0)
    output.mkdir(parents=True)
    model = output / "otter.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(model),
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
    scripts = [
        Path(__file__),
        Path(__file__).with_name("otter_rig.py"),
        Path(__file__).with_name("otter_motion.py"),
        Path(__file__).resolve().parents[3] / "blender/native_types.py",
    ]
    receipt = {
        "schemaVersion": 1,
        "character": "otter",
        "sourceSha256": sha(source),
        "motionSha256": sha(root / "motion.blend"),
        "modelSha256": sha(model),
        "meshSha256": before,
        "blender": bpy.app.version_string,
        "exportScripts": {
            str(p.relative_to(Path(__file__).resolve().parents[3])): sha(p) for p in scripts
        },
        "clips": library,
        "support": audits,
        "profile": json.loads((root / "otter/fitting.json").read_text()),
    }
    (output / "otter.json").write_text(json.dumps(receipt, indent=2) + "\n")
    (output / "otter.motions.json").write_text(json.dumps(library, indent=2) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command", choices=["bootstrap", "fit", "export", "review", "verify", "refine"]
    )
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--clip", default="idle")
    parser.add_argument("--frame", type=int, default=0)
    parser.add_argument("--detail", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    root = args.root.resolve()
    if args.command == "bootstrap":
        bootstrap(root)
    elif args.command == "fit":
        fit(root)
    elif args.command == "refine":
        from otter_finish import refine

        refine(root)
    elif args.output:
        if args.command == "export":
            export(root, args.output.resolve())
        elif args.command == "review":
            from otter_review import review

            review(root, args.output.resolve(), args.clip, args.frame, args.detail)
        else:
            from otter_verify import verify

            verify(root, args.output.resolve())
    else:
        parser.error("This operation requires --output")


if __name__ == "__main__":
    main()
