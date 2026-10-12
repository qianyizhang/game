"""Saved armory export, native views and disposable geometry-edit verification."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from authoring_plan import save_working_source  # noqa: E402
from hero_delivery import sha  # noqa: E402
from native_types import active_object, cycles_settings, mesh_data, present, require  # noqa: E402
from review_plan import capture_path, close_captures  # noqa: E402
from weapon_form import ROOTS, build  # noqa: E402


def bootstrap(source: Path) -> None:
    import bpy

    if source.exists():
        raise FileExistsError("Construction requires a fresh native candidate")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    source.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)


def export(source: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Export requires a fresh directory")
    source_pin = sha(source)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    for name in ROOTS:
        if name not in bpy.data.objects:
            raise ValueError(f"Missing grip root {name}")
    string = mesh_data(bpy.data.objects["bow_string"])
    present(string.shape_keys).key_blocks["Draw"].value = 0
    bpy.ops.object.select_all(action="SELECT")
    output.mkdir(parents=True)
    model = output / "weapons.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(model),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_skins=False,
        export_morph=True,
        export_morph_normal=False,
        export_try_sparse_sk=False,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )
    meshes = [o for o in scene.objects if o.type == "MESH"]
    receipt = {
        "schemaVersion": 1,
        "sourceSha256": source_pin,
        "modelSha256": sha(model),
        "blender": bpy.app.version_string,
        "roots": ROOTS,
        "meshCount": len(meshes),
        "space": "grip-local game units, glTF X forward / Y up",
        "bowDraw": "bow_string morph Draw, 0 resting / 1 drawn",
        "exportScripts": {
            p.name: sha(p) for p in sorted(Path(__file__).parent.glob("weapon_*.py"))
        },
        "sharedGeometrySha256": sha(Path(__file__).with_name("hero_form.py")),
    }
    if sha(source) != source_pin:
        raise ValueError("Export modified saved authority")
    (output / "weapons.json").write_text(json.dumps(receipt, indent=2) + "\n")


def sample(source: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Sampling requires a fresh path")
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    key = present(mesh_data(bpy.data.objects["bow_string"]).shape_keys).key_blocks["Draw"]
    poses = []
    for draw in (0, 0.5, 1):
        key.value = draw
        present(bpy.context.view_layer).update()
        graph = bpy.context.evaluated_depsgraph_get()
        objects = []
        for obj in scene.objects:
            if obj.type != "MESH":
                continue
            evaluated = obj.evaluated_get(graph)
            points = []
            for vertex in mesh_data(evaluated).vertices:
                p = evaluated.matrix_world @ vertex.co
                points.append([p.x, p.z, -p.y])
            objects.append({"name": obj.name, "points": points})
        poses.append({"draw": draw, "objects": objects})
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"poses": poses}, separators=(",", ":")) + "\n")


def verify(source: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Verification requires a fresh directory")
    model = Path(__file__).resolve().parents[3] / "assets/night-passage/weapons.glb"
    protected = {p: sha(p) for p in (source, model)}
    sample(source, output / "reference.json")
    working = output / "edited.blend"
    shutil.copy2(source, working)
    bpy.ops.wm.open_mainfile(filepath=str(working))
    blade = mesh_data(bpy.data.objects["Dawnless blade"])
    for vertex in blade.vertices:
        vertex.co.x += 8 * max(0, min(1, (vertex.co.x - 35) / 22))
    save_working_source(working)
    bpy.ops.wm.open_mainfile(filepath=str(working))
    if max(v.co.x for v in mesh_data(bpy.data.objects["Dawnless blade"]).vertices) < 64:
        raise ValueError("Saved blade edit did not survive reload")
    export(working, output / "models")
    sample(working, output / "edited.json")
    if any(sha(p) != digest for p, digest in protected.items()):
        raise ValueError("Verification changed authoritative files")
    (output / "verification.json").write_text(
        json.dumps(
            {
                "authoritativeSourceAndDeliveryUnchanged": True,
                "edit": "Extend saved sword tip by eight game units, save/reload/export",
                "sourceSha256": protected[source],
                "modelSha256": protected[model],
            },
            indent=2,
        )
        + "\n"
    )


def review(source: Path, output: Path) -> None:
    import bpy
    from mathutils import Vector

    if output.exists():
        raise FileExistsError("Review requires a fresh directory")
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    setattr(scene.render, "engine", "CYCLES")  # noqa: B010
    cycles_settings(scene.cycles).samples = 16
    scene.render.resolution_x, scene.render.resolution_y = 900, 640
    scene.render.resolution_percentage = 100
    scene.world = bpy.data.worlds.new("Armory studio")
    scene.world.color = (0.18, 0.18, 0.18)
    bpy.ops.object.camera_add(location=(80, -160, 100))
    camera = active_object()
    scene.camera = camera
    require(camera.data, bpy.types.Camera).type = "ORTHO"
    require(camera.data, bpy.types.Camera).ortho_scale = 115
    for location, energy, size in [((40, -100, 130), 550000, 100), ((-40, 80, 60), 400000, 90)]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = active_object()
        data = require(light.data, bpy.types.AreaLight)
        data.energy, data.size = energy, size
        light.rotation_euler = (
            (Vector((15, 0, 0)) - light.location).to_track_quat("-Z", "Y").to_euler()
        )
    output.mkdir(parents=True)
    names: set[str] = set()
    for name in ROOTS:
        for obj in scene.objects:
            if obj.type == "MESH":
                obj.hide_render = not obj.parent or obj.parent.name != name
        target = Vector((25 if name in ("weapon_sword", "weapon_spear") else 0, 0, 0))
        camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
        filename = name + ".png"
        scene.render.filepath = str(capture_path(output, filename))
        bpy.ops.render.render(write_still=True)
        names.add(filename)
    close_captures(output, names)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["bootstrap", "export", "review", "verify"])
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    if args.command == "bootstrap":
        bootstrap(args.source.resolve())
    elif args.output:
        {"export": export, "review": review, "verify": verify}[args.command](
            args.source.resolve(), args.output.resolve()
        )
    else:
        parser.error("This operation requires --output")


if __name__ == "__main__":
    main()
