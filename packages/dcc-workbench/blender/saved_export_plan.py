"""Pure input contract for exporting a saved subject into a fresh candidate directory."""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path


def mapping(value: object) -> dict[str, object]:
    if not isinstance(value, dict) or any(not isinstance(key, str) for key in value):
        raise ValueError("Expected registry object")
    return {str(key): item for key, item in value.items()}


def text(value: object) -> str:
    if not isinstance(value, str) or not value or value != value.strip():
        raise ValueError("Expected nonempty registry string")
    return value


def positive(value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Expected positive registry number")
    if not math.isfinite(value) or value <= 0:
        raise ValueError("Expected positive registry number")
    return float(value)


def package_path(root: Path, value: object) -> Path:
    name = text(value)
    if "\\" in name or ":" in name or any(p in ("", ".", "..") for p in name.split("/")):
        raise ValueError("Expected canonical relative registry path")
    result = (root / name).resolve()
    if not result.is_relative_to(root):
        raise ValueError("Registry path leaves package root")
    return result


@dataclass(frozen=True)
class SavedExportRequest:
    root: Path
    output: Path
    asset_id: str
    source: Path
    source_name: str
    profile: str
    animation_name: str
    seconds: float
    fps: int


def parse_request(argv: list[str]) -> SavedExportRequest:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package_root", type=Path)
    parser.add_argument("candidate_dir", type=Path)
    args = parser.parse_args(argv[argv.index("--") + 1 :] if "--" in argv else [])
    root, output = Path(args.package_root).resolve(), Path(args.candidate_dir).resolve()
    if output.exists():
        raise ValueError("Candidate directory must be new; previous deliveries are protected")
    registry = mapping(json.loads((root / "registry.json").read_text()))
    if registry.get("schemaVersion") != 1:
        raise ValueError("Unsupported registry schema")
    assets = mapping(registry.get("assets"))
    if output.name not in assets:
        raise ValueError("Candidate directory name must identify a registered asset")
    asset = mapping(assets[output.name])
    source_name = text(asset.get("source"))
    source = package_path(root, source_name)
    if source.suffix != ".blend" or not source.is_file():
        raise ValueError("Export requires the saved Blender artist source")
    delivery = mapping(asset.get("delivery"))
    profile = text(delivery.get("profile"))
    if profile not in ("skinned", "rigid"):
        raise ValueError("Saved exporter supports skinned and rigid loops; static is unsupported")
    for definition in assets.values():
        directory = package_path(
            root, mapping(mapping(definition).get("delivery")).get("directory")
        )
        if output.is_relative_to(directory):
            raise ValueError("Candidate must be outside every published delivery directory")
    animation = mapping(delivery.get("animation"))
    fps, seconds = positive(animation.get("fps")), positive(animation.get("seconds"))
    if not fps.is_integer() or not (fps * seconds).is_integer():
        raise ValueError("Saved animation needs integer fps and an integer frame span")
    return SavedExportRequest(
        root,
        output,
        output.name,
        source,
        source_name,
        profile,
        text(animation.get("name")),
        seconds,
        int(fps),
    )
