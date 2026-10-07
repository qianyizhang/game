"""Authoring entry points must be inert on import and reject unsafe output requests."""

import contextlib
import importlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

from authoring_plan import animation_name, parse_request


class AuthoringPlanTests(unittest.TestCase):
    def test_imports_do_not_require_or_initialize_blender(self) -> None:
        for name in ("build_hydra", "export_asset", "native_types"):
            importlib.import_module(name)
        self.assertNotIn("bpy", sys.modules)
        self.assertNotIn("mathutils", sys.modules)

    def test_existing_source_and_delivery_are_refused(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "briefs").mkdir()
            (root / "briefs/briar-hydra.json").write_text('{"animation":{"name":"Marsh Vigil"}}')
            (root / "sources").mkdir()
            source = root / "sources/briar-hydra.blend"
            source.write_bytes(b"artist edits")
            for build, output in ((True, source), (False, root / "sources")):
                with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                    parse_request(["blender", "--", str(root), str(output)], build=build)
            self.assertEqual(source.read_bytes(), b"artist edits")
            target = root / "candidate.blend"
            request = parse_request(["blender", "--", str(root), str(target)], build=True)
            self.assertEqual(request.output, target.resolve())
            self.assertFalse(target.exists())
            self.assertEqual(animation_name(root), "Marsh Vigil")

    def test_missing_source_and_malformed_brief_fail_before_export(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "briefs").mkdir()
            brief = root / "briefs/briar-hydra.json"
            brief.write_text("{}")
            with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                parse_request(["blender", "--", str(root), str(root / "out")], build=False)
            malformed: tuple[object, ...] = ([], {}, {"animation": []}, {"animation": {"name": 3}})
            for value in malformed:
                brief.write_text(json.dumps(value))
                with self.assertRaises(ValueError):
                    animation_name(root)


if __name__ == "__main__":
    unittest.main()
