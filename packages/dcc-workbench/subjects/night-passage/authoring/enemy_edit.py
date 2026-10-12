"""Apply the reviewed straight-maul correction to the saved brute master, without rebuilding it."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from authoring_plan import save_working_source  # noqa: E402
from enemy_form import tube  # noqa: E402
from enemy_rig import arm_points  # noqa: E402
from native_types import mesh_data, present  # noqa: E402


def straighten(source: Path) -> None:
    import bpy

    bpy.ops.wm.open_mainfile(filepath=str(source))
    if present(bpy.context.scene)["enemy_kind"] != "brute":
        raise ValueError("This source correction only applies to the reviewed brute")
    original = bpy.data.objects["Maul_handle"]
    data = mesh_data(original)
    materials = list(data.materials)
    groups = [group.name for group in original.vertex_groups]
    weights = [[(group.group, group.weight) for group in vertex.groups] for vertex in data.vertices]
    _, _, wrist, palm = arm_points("brute", "R")
    replacement = tube(
        "Maul_correction",
        [
            (palm, 0.046, 0.046),
            (((palm[0] + 0.85) / 2, wrist[1], (palm[2] + 0.41) / 2), 0.038, 0.038),
            ((0.85, wrist[1], 0.41), 0.045, 0.045),
        ],
        8,
    )
    if len(data.vertices) != len(mesh_data(replacement).vertices):
        raise ValueError("Reviewed correction must preserve the fitted weight indexing")
    original.data = replacement.data
    original.vertex_groups.clear()
    for name in groups:
        original.vertex_groups.new(name=name)
    for material in materials:
        mesh_data(original).materials.append(material)
    for index, entries in enumerate(weights):
        for group, weight in entries:
            original.vertex_groups[group].add([index], weight, "REPLACE")
    bpy.data.objects.remove(replacement, do_unlink=True)
    if data.users == 0:
        bpy.data.meshes.remove(data)
    save_working_source(source)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    straighten(args.source.resolve())


if __name__ == "__main__":
    main()
