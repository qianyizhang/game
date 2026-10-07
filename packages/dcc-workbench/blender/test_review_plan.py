"""Check failure boundaries without requiring Blender in the unit-test environment."""

import contextlib
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path

from review_plan import VIEWS, close_review, parse_request


class ReviewPlanTests(unittest.TestCase):
    def test_arguments_fail_before_scene_work(self) -> None:
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            parse_request(["blender", "--background"])
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            parse_request(["blender", "--", "/missing/package"])

    def test_each_run_gets_a_fresh_disposable_output(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "packages/dcc-workbench"
            (root / "sources").mkdir(parents=True)
            (root / "sources/briar-hydra.blend").write_bytes(b"artist source")
            a = parse_request(["blender", "--", str(root)])
            b = parse_request(["blender", "--", str(root)])
            self.assertNotEqual(a.output, b.output)
            self.assertEqual(a.output.parent, Path(directory).resolve() / "test-results/disposable")
            self.assertFalse(a.output.exists())

    def test_partial_or_extra_output_cannot_be_closed(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / "hydra-front.png").write_bytes(b"incomplete")
            with self.assertRaises(ValueError):
                close_review(output)
            self.assertFalse((output / ".retention.json").exists())
            for name, _ in VIEWS:
                (output / f"hydra-{name}.png").write_bytes(b"render")
            (output / "artist.blend").write_bytes(b"keep")
            with self.assertRaises(ValueError):
                close_review(output)

    def test_closure_pins_exact_output_bytes_and_cannot_be_rewritten(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            for name, _ in VIEWS:
                (output / f"hydra-{name}.png").write_bytes(name.encode())
            close_review(output)
            manifest = json.loads((output / ".retention.json").read_text())
            self.assertEqual(manifest["state"], "closed")
            self.assertEqual(
                manifest["files"]["hydra-front.png"], hashlib.sha256(b"front").hexdigest()
            )
            with self.assertRaises(ValueError):
                close_review(output)

    def test_symlink_is_never_registered(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            for name, _ in VIEWS:
                (output / f"hydra-{name}.png").write_bytes(b"render")
            path = output / "hydra-front.png"
            path.unlink()
            path.symlink_to(output / "hydra-side.png")
            with self.assertRaises(ValueError):
                close_review(output)


if __name__ == "__main__":
    unittest.main()
