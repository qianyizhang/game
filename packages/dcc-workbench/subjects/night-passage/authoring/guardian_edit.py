"""Repair the reviewed Bellwarden coupling and directional attack keys in its saved master."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "blender"))

from authoring_plan import save_working_source  # noqa: E402
from guardian_form import add_neck  # noqa: E402
from guardian_rig import author_attacks  # noqa: E402
from native_types import present  # noqa: E402


def refine(source: Path) -> None:
    import bpy

    bpy.ops.wm.open_mainfile(filepath=str(source))
    if present(bpy.context.scene)["guardian_kind"] != "bellwarden":
        raise ValueError("This repair applies only to Bellwarden")
    rig = bpy.data.objects["GuardianRig"]
    if not bpy.data.objects.get("Mask_neck_coupling"):
        add_neck(rig)
    author_attacks(rig)
    save_working_source(source)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    refine(args.source.resolve())
