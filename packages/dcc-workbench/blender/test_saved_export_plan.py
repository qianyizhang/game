"""Saved exports reject wrong source/profile/output before invoking Blender."""

import importlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

from saved_export_plan import SavedExportRequest, parse_request


class SavedExportPlanTests(unittest.TestCase):
    def test_import_does_not_load_blender(self) -> None:
        importlib.import_module("export_saved")
        self.assertNotIn("bpy", sys.modules)

    def test_source_contract_and_published_outputs_are_protected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            (root / "sources").mkdir()
            source = root / "sources/bird.blend"
            source.write_bytes(b"artist source")
            animation = {"name": "Listening", "seconds": 6, "fps": 24}
            delivery: dict[str, object] = {
                "profile": "skinned",
                "directory": "assets/bird",
                "animation": animation,
            }
            asset = {"source": "sources/bird.blend", "delivery": delivery}
            registry = {"schemaVersion": 1, "assets": {"bird": asset}}

            def request(path: Path) -> SavedExportRequest:
                (root / "registry.json").write_text(json.dumps(registry))
                return parse_request(["blender", "--", str(root), str(path)])

            candidate = root / "temporary/bird"
            result = request(candidate)
            self.assertEqual(result.source, source)
            self.assertFalse(candidate.exists())
            with self.assertRaisesRegex(ValueError, "registered asset"):
                request(root / "temporary/unknown")
            with self.assertRaisesRegex(ValueError, "published delivery"):
                request(root / "assets/bird")
            candidate.mkdir(parents=True)
            with self.assertRaisesRegex(ValueError, "must be new"):
                request(candidate)
            candidate.rmdir()
            delivery["profile"] = "static"
            with self.assertRaisesRegex(ValueError, "static is unsupported"):
                request(candidate)
            delivery["profile"] = "skinned"
            animation["fps"] = 23.5
            with self.assertRaisesRegex(ValueError, "integer fps"):
                request(candidate)
            animation["fps"] = 24
            asset["source"] = "../outside.blend"
            with self.assertRaisesRegex(ValueError, "canonical relative"):
                request(candidate)
            self.assertEqual(source.read_bytes(), b"artist source")


if __name__ == "__main__":
    unittest.main()
