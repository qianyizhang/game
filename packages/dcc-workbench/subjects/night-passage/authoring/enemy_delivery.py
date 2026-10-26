"""Read a saved enemy master, bake constraints, and export a browser delivery."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import cast

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from enemy_form import build  # noqa: E402
from enemy_rig import CLIPS, FPS, KINDS, Kind, activate, author, make_rig  # noqa: E402
from native_types import mesh_data, present, require  # noqa: E402


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
                [
                    [data.loops[p.loop_start + i].vertex_index for i in range(p.loop_total)]
                    for p in data.polygons
                ],
                [[(g.group, g.weight) for g in v.groups] for v in data.vertices],
            ]
        )
    return hashlib.sha256(json.dumps(values).encode()).hexdigest()


def bootstrap(source: Path, kind: Kind) -> None:
    import bpy

    if source.exists():
        raise FileExistsError("Construction requires a fresh native candidate")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rig = make_rig(kind)
    build(rig, kind)
    author(rig, kind)
    present(bpy.context.scene)["enemy_kind"] = kind
    source.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)


def export(source: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Export requires a fresh output directory")
    source_pin = sha(source)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    rig = bpy.data.objects["EnemyRig"]
    kind = str(scene["enemy_kind"])
    if kind not in KINDS:
        raise ValueError("Unknown saved enemy kind")
    before = mesh_digest()
    data = bpy.data.armatures.new(f"{kind} deformation skeleton")
    baked = bpy.data.objects.new(f"Enemy_{kind}", data)
    scene.collection.objects.link(baked)
    activate(baked)
    bpy.ops.object.mode_set(mode="EDIT")
    for rest in require(rig.data, bpy.types.Armature).bones:
        if not rest.use_deform:
            continue
        target = data.edit_bones.new(rest.name)
        target.head, target.tail = rest.head_local, rest.tail_local
        target.matrix, target.length = rest.matrix_local.copy(), rest.length
        if rest.parent and rest.parent.use_deform:
            target.parent = data.edit_bones[rest.parent.name]
    bpy.ops.object.mode_set(mode="OBJECT")
    for bone in present(baked.pose).bones:
        bone.rotation_mode = "QUATERNION"
    meshes = [o for o in scene.objects if o.type == "MESH"]
    library = {}
    audits = {}
    actions = []
    for name in CLIPS:
        original = bpy.data.actions[name]
        seconds = float(original["seconds"])
        library[name] = {
            "seconds": seconds,
            "loop": bool(original["loop"]),
            "contactPhase": float(original["contact_phase"]),
        }
        original.name = f"CONTROL_{name}"
        rig.animation_data_create().action = original
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        baked.animation_data_create().action = action
        actions.append(action)
        end = round(seconds * FPS)
        lowest, ik_error, loop_error = 100.0, 0.0, 0.0
        endpoints: list[list[float]] = []
        for frame in range(end + 1):
            scene.frame_set(frame)
            present(bpy.context.view_layer).update()
            graph = bpy.context.evaluated_depsgraph_get()
            pose = present(rig.evaluated_get(graph).pose)
            matrices: list[float] = []
            for bone in present(baked.pose).bones:
                matrix = pose.bones[bone.name].matrix.copy()
                bone.matrix_basis = (
                    (
                        bone.bone.matrix_local.inverted()
                        @ bone.parent.bone.matrix_local
                        @ pose.bones[bone.parent.name].matrix.inverted()
                        @ matrix
                    )
                    if bone.parent
                    else bone.bone.matrix_local.inverted() @ matrix
                )
                for channel in ("location", "rotation_quaternion", "scale"):
                    bone.keyframe_insert(channel, frame=frame, group=bone.name)
                matrices.extend(matrix[i][j] for i in range(4) for j in range(4))
            if frame in (0, end):
                endpoints.append(matrices)
            for side in () if kind == "witch" else ("L", "R"):
                ik_error = max(
                    ik_error,
                    (pose.bones[f"foot.{side}"].head - pose.bones[f"MCH_{side}"].head).length,
                )
            lowest = min(
                lowest,
                *(v.co.z for obj in meshes for v in mesh_data(obj.evaluated_get(graph)).vertices),
            )
        loop_error = max(abs(a - b) for a, b in zip(*endpoints, strict=True))
        audits[name] = {
            "frames": end + 1,
            "minimumSurfaceHeight": lowest,
            "maximumFootTargetError": ik_error,
            "loopMatrixError": loop_error,
        }
        if lowest < -0.03 or ik_error > 0.02 or (library[name]["loop"] and loop_error > 0.001):
            raise ValueError(f"Enemy support failed: {name}: {audits[name]}")
    if mesh_digest() != before:
        raise ValueError("Baking changed geometry or weights")
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
    model = output / f"enemy-{kind}.glb"
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
    if sha(source) != source_pin:
        raise ValueError("Export changed the authoritative master")
    receipt = {
        "schemaVersion": 1,
        "kind": kind,
        "sourceSha256": source_pin,
        "modelSha256": sha(model),
        "meshSha256": before,
        "blender": bpy.app.version_string,
        "clips": library,
        "support": audits,
        "supportScope": (
            "All authored 30fps frames: complete evaluated surface floor, loop closure "
            "and planted-foot IK reach (floating witch excludes foot targets); in-place run, "
            "no claim of world-space foot locking at every rules speed"
        ),
        "exportScripts": {
            p.name: sha(p)
            for p in sorted(
                [
                    *Path(__file__).parent.glob("enemy_*.py"),
                    Path(__file__).parent / "hero_form.py",
                    Path(__file__).parent / "hero_rig.py",
                ]
            )
        },
    }
    (output / f"enemy-{kind}.json").write_text(json.dumps(receipt, indent=2) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["bootstrap", "export", "review", "verify"])
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--kind", choices=KINDS)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    source = args.source.resolve()
    if args.command == "bootstrap":
        if not args.kind:
            parser.error("Bootstrap requires --kind")
        bootstrap(source, cast(Kind, args.kind))
    elif not args.output:
        parser.error("This operation requires --output")
    elif args.command == "export":
        export(source, args.output.resolve())
    else:
        from enemy_review import review, verify

        (review if args.command == "review" else verify)(source, args.output.resolve())


if __name__ == "__main__":
    main()
