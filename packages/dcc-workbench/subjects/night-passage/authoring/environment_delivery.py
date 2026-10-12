"""Export saved static environment parts and prove native geometry edits reach delivery."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from authoring_plan import save_working_source  # noqa: E402
from environment_archive import build as build_archive  # noqa: E402
from environment_cinder import build as build_cinder  # noqa: E402
from environment_form import ROOTS, build  # noqa: E402
from environment_starless import build as build_starless  # noqa: E402
from hero_form import material  # noqa: E402
from native_types import active_object, cycles_settings, mesh_data, present, require  # noqa: E402
from review_plan import capture_path, close_captures  # noqa: E402

if TYPE_CHECKING:
    import bpy


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def bootstrap(source: Path, kind: str) -> None:
    import bpy

    if source.exists():
        raise FileExistsError("Construction requires a fresh native candidate")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    {
        "sepulcher": build,
        "archive": build_archive,
        "cinder": build_cinder,
        "starless": build_starless,
    }[kind]()
    source.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)


def vertices(obj: bpy.types.Object) -> list[list[float]]:
    import bpy

    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    points = []
    for vertex in mesh_data(evaluated).vertices:
        p = evaluated.matrix_world @ vertex.co
        points.append([float(p.x), float(p.z), float(-p.y)])
    return points


def export(source: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Export requires a fresh directory")
    source_pin = sha(source)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = present(bpy.context.scene)
    kind = scene["environment_kind"]
    if kind not in ("sepulcher", "archive", "cinder", "starless"):
        raise ValueError("Unknown saved environment")
    bounds = {}
    for name in ROOTS:
        root = bpy.data.objects[name]
        if root.type != "EMPTY" or not root.children:
            raise ValueError(f"Missing populated part root {name}")
        points = [p for obj in root.children if obj.type == "MESH" for p in vertices(obj)]
        if not points:
            raise ValueError(f"Part has no surface: {name}")
        bounds[name] = {
            "min": [min(p[i] for p in points) for i in range(3)],
            "max": [max(p[i] for p in points) for i in range(3)],
        }
    bpy.ops.object.select_all(action="SELECT")
    output.mkdir(parents=True)
    model = output / f"environment-{kind}.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(model),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_skins=False,
        export_morph=False,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )
    receipt = {
        "schemaVersion": 1,
        "kind": kind,
        "sourceSha256": source_pin,
        "modelSha256": sha(model),
        "blender": bpy.app.version_string,
        "roots": ROOTS,
        "meshCount": sum(o.type == "MESH" for o in scene.objects),
        "space": "game units, glTF Y-up; part roots at origin; Floor/Boundary centered on arena",
        "bounds": bounds,
        "exportScripts": {
            p.name: sha(p) for p in sorted(Path(__file__).parent.glob("environment_*.py"))
        },
        "helperScripts": {
            name: sha(Path(__file__).with_name(name)) for name in ("hero_form.py", "enemy_form.py")
        },
    }
    if sha(source) != source_pin:
        raise ValueError("Export changed saved authority")
    (output / f"environment-{kind}.json").write_text(json.dumps(receipt, indent=2) + "\n")


def sample(source: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Sampling requires a fresh path")
    bpy.ops.wm.open_mainfile(filepath=str(source))
    objects = [
        {"name": obj.name, "points": vertices(obj)}
        for obj in present(bpy.context.scene).objects
        if obj.type == "MESH"
    ]
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"objects": objects}, separators=(",", ":")) + "\n")


def verify(source: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Verification requires a fresh directory")
    bpy.ops.wm.open_mainfile(filepath=str(source))
    kind = present(bpy.context.scene)["environment_kind"]
    model = Path(__file__).resolve().parents[3] / f"assets/night-passage/environment-{kind}.glb"
    protected = {p: sha(p) for p in (source, model)}
    sample(source, output / "reference.json")
    working = output / "edited.blend"
    shutil.copy2(source, working)
    bpy.ops.wm.open_mainfile(filepath=str(working))
    cap = mesh_data(bpy.data.objects["Pillar_cap"])
    top = max(v.co.z for v in cap.vertices)
    for vertex in cap.vertices:
        if vertex.co.z > top - 0.01:
            vertex.co.z += 4
    save_working_source(working)
    bpy.ops.wm.open_mainfile(filepath=str(working))
    if (
        abs(max(v.co.z for v in mesh_data(bpy.data.objects["Pillar_cap"]).vertices) - top - 4)
        > 0.001
    ):
        raise ValueError("Saved cap edit did not survive reload")
    export(working, output / "models")
    sample(working, output / "edited.json")
    if any(sha(p) != digest for p, digest in protected.items()):
        raise ValueError("Verification changed authoritative files")
    (output / "verification.json").write_text(
        json.dumps(
            {
                "authoritativeSourceAndDeliveryUnchanged": True,
                "editedObject": "Pillar_cap",
                "vertexChangeUnits": 4,
                "edit": "Raise saved Pillar_cap top by four game units, save/reload/export",
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
    cycles_settings(scene.cycles).samples = 24
    scene.render.resolution_x, scene.render.resolution_y = 900, 640
    scene.render.resolution_percentage = 100
    scene.world = bpy.data.worlds.new("Environment studio")
    scene.world.color = (0.22, 0.22, 0.22)
    bpy.ops.object.camera_add(location=(800, -1100, 950))
    camera = active_object()
    scene.camera = camera
    require(camera.data, bpy.types.Camera).type = "ORTHO"
    require(camera.data, bpy.types.Camera).clip_end = 5000
    bpy.ops.object.light_add(type="SUN", location=(200, -300, 600))
    sun = active_object()
    require(sun.data, bpy.types.SunLight).energy = 3
    sun.rotation_euler = (0.3, -0.5, -0.6)
    originals = {o.name: list(mesh_data(o).materials) for o in scene.objects if o.type == "MESH"}
    clay = material("Review clay", (0.42, 0.43, 0.40))
    output.mkdir(parents=True)
    captures: set[str] = set()
    for surface in ("clay", "material"):
        for name, mats in originals.items():
            data = mesh_data(bpy.data.objects[name])
            data.materials.clear()
            for mat in mats:
                data.materials.append(clay if surface == "clay" else mat)
        for view, location, target, scale in [
            ("assembly", (800, -1100, 950), (0, 0, 0), 1450),
            ("assembly-rear", (-800, 1100, 950), (0, 0, 0), 1450),
            ("Pillar", (110, -150, 105), (0, 0, 40), 160),
            ("Pillar-side", (180, 0, 65), (0, 0, 40), 130),
            ("Pillar-rear", (0, 180, 65), (0, 0, 40), 130),
            ("Lantern", (55, -70, 55), (0, 0, 22), 85),
        ]:
            part = view.split("-")[0]
            for obj in scene.objects:
                if obj.type == "MESH":
                    obj.hide_render = part != "assembly" and (
                        not obj.parent or obj.parent.name != part
                    )
            bpy.data.objects["Pillar"].location = (-170, 0, 0) if part == "assembly" else (0, 0, 0)
            bpy.data.objects["Lantern"].location = (
                (230, -180, 0) if part == "assembly" else (0, 0, 0)
            )
            camera.location = location
            camera.rotation_euler = (
                (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
            )
            require(camera.data, bpy.types.Camera).ortho_scale = scale
            filename = f"{surface}-{view.lower()}.png"
            scene.render.filepath = str(capture_path(output, filename))
            bpy.ops.render.render(write_still=True)
            captures.add(filename)
    close_captures(output, captures)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["bootstrap", "export", "review", "verify"])
    parser.add_argument(
        "--kind", choices=["sepulcher", "archive", "cinder", "starless"], default="sepulcher"
    )
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    if args.command == "bootstrap":
        bootstrap(args.source.resolve(), args.kind)
    elif args.output:
        {"export": export, "review": review, "verify": verify}[args.command](
            args.source.resolve(), args.output.resolve()
        )
    else:
        parser.error("This operation requires --output")


if __name__ == "__main__":
    main()
