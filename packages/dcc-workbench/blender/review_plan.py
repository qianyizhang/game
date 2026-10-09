"""Validated inputs and retention receipts for disposable native review renders."""

from __future__ import annotations

import argparse
import hashlib
import json
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

VIEWS: tuple[tuple[str, tuple[float, float, float]], ...] = (
    ("portrait", (4.0, -6.7, 3.0)),
    ("front", (0.0, -7.6, 2.0)),
    ("side", (7.6, 0.0, 2.0)),
    ("rear", (0.0, 7.6, 2.0)),
)


@dataclass(frozen=True)
class ReviewRequest:
    package_root: Path
    output: Path


def parse_request(argv: list[str]) -> ReviewRequest:
    """Parse Blender's arguments after -- before touching the loaded scene."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package_root", type=Path)
    arguments = argv[argv.index("--") + 1 :] if "--" in argv else []
    namespace = parser.parse_args(arguments)
    root = Path(namespace.package_root).resolve()
    if not (root / "sources/briar-hydra.blend").is_file():
        parser.error("package_root must contain sources/briar-hydra.blend")
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    output = root.parent.parent / "test-results/disposable" / f"dcc-review-{stamp}-{uuid4().hex}"
    return ReviewRequest(root, output)


def close_review(output: Path) -> None:
    """Opt in only a complete set of four PNGs to the 14-day cleanup policy."""
    expected = {f"hydra-{name}.png" for name, _ in VIEWS}
    close_captures(output, expected)


def new_capture_batch(workspace: Path) -> Path:
    """Allocate one disposable render batch; never copy artist sources."""
    parent = workspace.resolve() / "test-results/disposable"
    parent.mkdir(parents=True, exist_ok=True)
    return Path(tempfile.mkdtemp(prefix="dcc-session-", dir=parent))


def capture_path(output: Path, name: str) -> Path:
    """Check each destination immediately before a single-writer render."""
    if Path(name).name != name or not name.endswith(".png"):
        raise ValueError("Capture name must be a local PNG filename")
    if output.is_symlink() or not output.is_dir() or (output / ".retention.json").exists():
        raise ValueError("Capture batch must be an open regular directory")
    path = output / name
    if path.exists() or path.is_symlink():
        raise FileExistsError(f"Capture already exists: {path}")
    return path


def close_captures(output: Path, expected: set[str]) -> None:
    """Reuse existing retention for complete batches; pin selected evidence before expiry."""
    if (
        output.is_symlink()
        or not expected
        or any(Path(name).name != name or not name.endswith(".png") for name in expected)
    ):
        raise ValueError("Capture batch requires local PNG filenames and a regular directory")
    if {path.name for path in output.iterdir()} != expected:
        raise ValueError("Review must contain exactly the expected PNGs before closure")
    files: dict[str, str] = {}
    for name in sorted(expected):
        path = output / name
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"Review image is not a regular file: {name}")
        files[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    manifest = {
        "schemaVersion": 1,
        "kind": "output",
        "state": "closed",
        "pinned": False,
        "closedAt": datetime.now(UTC).isoformat(),
        "files": files,
    }
    with (output / ".retention.json").open("x", encoding="utf-8") as stream:
        stream.write(json.dumps(manifest, indent=2) + "\n")
