"""Disposable transform fault injections, including applied-transform support/clearance faults."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import TYPE_CHECKING

from authoring_plan import save_working_source
from native_types import mesh_data, present
from otter_delivery import export, mesh_digest, sha
from otter_rig import activate

if TYPE_CHECKING:
    import bpy


def heights(obj: bpy.types.Object) -> dict[str, float]:
    import bpy

    present(bpy.context.view_layer).update()
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    return {
        "localMinZ": min(v.co.z for v in mesh_data(evaluated).vertices),
        "worldMinZ": min((evaluated.matrix_world @ v.co).z for v in mesh_data(evaluated).vertices),
    }


def verify_transforms(root: Path, output: Path) -> dict[str, object]:
    import bpy

    if output.exists():
        raise FileExistsError("Transform proof requires fresh disposable copies")
    output.mkdir(parents=True)
    protected = {p: sha(p) for p in [root / "motion.blend", root / "otter/source.blend"]}
    cases: list[dict[str, object]] = []
    for name, object_name, translation, apply in [
        ("translated-paw", "Paw web fore.L", 0.05, False),
        ("translated-below-floor-surface", "Otter continuous hide", -1.0, False),
        ("applied-translated-paw", "Paw web fore.L", 0.05, True),
        ("applied-below-floor-surface", "Otter continuous hide", -1.0, True),
    ]:
        working = output / name / "sources"
        working.mkdir(parents=True)
        shutil.copy2(root / "motion.blend", working / "motion.blend")
        shutil.copytree(root / "otter", working / "otter")
        bpy.ops.wm.open_mainfile(filepath=str(working / "otter/source.blend"))
        rig = bpy.data.objects["CharacterRig"]
        rig.animation_data_create().action = bpy.data.actions["idle"]
        present(bpy.context.scene).frame_set(0)
        obj = bpy.data.objects[object_name]

        before = mesh_digest()
        original_heights = heights(obj)
        obj.location.z += translation
        if apply:
            activate(obj)
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        after = mesh_digest()
        if before == after:
            raise ValueError(f"Geometry digest missed the transform injection: {name}")
        case: dict[str, object] = {
            "case": name,
            "object": object_name,
            "translationZ": translation,
            "appliedToMesh": apply,
            "before": original_heights,
            "after": heights(obj),
            "geometryDigestBefore": before,
            "geometryDigestAfter": after,
            "geometryDigestChanged": True,
        }
        save_working_source(working / "otter/source.blend")
        try:
            export(working, output / name / "models")
        except ValueError as error:
            rejection = str(error)
            expected = "support audit failed" if apply else "Unsupported otter source transform"
            if expected not in rejection:
                raise ValueError(f"Unexpected {name} rejection: {rejection}") from error
            case.update({"exportAccepted": False, "rejection": rejection})
        else:
            raise ValueError(f"Exporter falsely accepted {name}")
        cases.append(case)
    # A valid saved source must still export through the same guard and world-space audit.
    export(root, output / "valid-models")
    if any(sha(p) != digest for p, digest in protected.items()):
        raise ValueError("Transform proof mutated authoritative masters")
    report: dict[str, object] = {
        "schemaVersion": 1,
        "geometryDigestVersion": 2,
        "validSavedSourceAccepted": True,
        "authoritativeMastersUnchanged": True,
        "sourcePins": {str(p): digest for p, digest in protected.items()},
        "methodOrigin": "parent disposable probe; inherited local-coordinate exporter weakness",
        "cases": cases,
        "faultCasesRejected": len(cases),
    }
    (output / "transform-proof.json").write_text(json.dumps(report, indent=2) + "\n")
    return report
