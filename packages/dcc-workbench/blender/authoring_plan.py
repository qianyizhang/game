"""Pure command contracts: native authoring only writes explicitly fresh candidates."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class AuthoringRequest:
    root: Path
    output: Path


def parse_request(argv: list[str], *, build: bool) -> AuthoringRequest:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package_root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args(argv[argv.index("--") + 1 :] if "--" in argv else [])
    root, output = Path(args.package_root).resolve(), Path(args.output).resolve()
    if not (root / "briefs/briar-hydra.json").is_file():
        parser.error("package_root must contain briefs/briar-hydra.json")
    if output.exists():
        parser.error("output must be new; previous source and delivery are protected")
    if build:
        if output.suffix != ".blend":
            parser.error("build output must end in .blend")
    elif not (root / "sources/briar-hydra.blend").is_file():
        parser.error("export requires the saved artist source")
    return AuthoringRequest(root, output)


def animation_name(root: Path) -> str:
    brief: object = json.loads((root / "briefs/briar-hydra.json").read_text())
    if not isinstance(brief, dict):
        raise ValueError("Expected brief object")
    animation: object = brief.get("animation")
    if not isinstance(animation, dict):
        raise ValueError("Expected animation brief")
    name: object = animation.get("name")
    if not isinstance(name, str) or not name:
        raise ValueError("Expected animation name")
    return name
