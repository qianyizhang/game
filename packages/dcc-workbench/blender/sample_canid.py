"""Generate temporary Blender reference poses from saved canid sources, without exporting."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from native_types import mesh_data, present  # noqa: E402


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sample(root: Path, models: Path, output: Path) -> None:
    import bpy

    if output.exists():
        raise FileExistsError("Native sampling requires a fresh output directory")
    output.mkdir(parents=True)
    motion_hash = sha(root / "motion.blend")
    for character in ("ash", "russet", "moss"):
        source = root / character / "source.blend"
        source_hash = sha(source)
        model = models / f"{character}.glb"
        receipt = json.loads((models / f"{character}.json").read_text())
        if (
            receipt["sourceSha256"] != source_hash
            or receipt["motionSha256"] != motion_hash
            or receipt["modelSha256"] != sha(model)
        ):
            raise ValueError(f"Source and delivery identities differ: {character}")
        bpy.ops.wm.open_mainfile(filepath=str(source))
        scene = present(bpy.context.scene)
        rig = bpy.data.objects["CharacterRig"]
        meshes = [o for o in scene.objects if o.type == "MESH"]
        fps = scene.render.fps / scene.render.fps_base
        clips = {}
        for name in receipt["clips"]:
            action = bpy.data.actions[name]
            rig.animation_data_create().action = action
            end = round(receipt["clips"][name]["seconds"] * fps)
            samples = []
            for frame in sorted({0, end // 4, end // 2, 3 * end // 4, end}):
                scene.frame_set(frame)
                present(bpy.context.view_layer).update()
                graph = bpy.context.evaluated_depsgraph_get()
                objects = []
                for obj in meshes:
                    evaluated = obj.evaluated_get(graph)
                    vertices = mesh_data(evaluated).vertices
                    points = []
                    for index in [round(i * (len(vertices) - 1) / 15) for i in range(16)]:
                        point = evaluated.matrix_world @ vertices[index].co
                        points.append([point.x, point.z, -point.y])
                    objects.append({"name": obj.name, "points": points})
                samples.append({"seconds": frame / fps, "objects": objects})
            clips[name] = {"samples": samples}
        if sha(source) != source_hash or sha(root / "motion.blend") != motion_hash:
            raise ValueError("Native sampling modified a saved source")
        document = {
            "schemaVersion": 1,
            "character": character,
            "sourceSha256": source_hash,
            "motionSha256": motion_hash,
            "modelSha256": sha(model),
            "space": "glTF world, Y up",
            "clips": clips,
        }
        (output / f"{character}.poses.json").write_text(
            json.dumps(document, separators=(",", ":")) + "\n"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("models", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    sample(args.root.resolve(), args.models.resolve(), args.output.resolve())
