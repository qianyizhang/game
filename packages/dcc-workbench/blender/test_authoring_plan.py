"""Authoring entry points must be inert on import and reject unsafe output requests."""

import contextlib
import importlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from authoring_plan import animation_name, parse_request, save_working_source


class AuthoringPlanTests(unittest.TestCase):
    def test_working_save_preserves_backup_and_refuses_another_source(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "source.blend"
            backup = Path(directory) / "source.blend1"
            other = Path(directory) / "other.blend"
            source.write_bytes(b"working source")
            backup.write_bytes(b"protected backup")
            other.write_bytes(b"another source")
            settings = SimpleNamespace(save_version=1)

            # Simulate Blender's backup rotation to exercise the named overwrite regression.
            def save(*, filepath: str, compress: bool) -> None:
                if settings.save_version:
                    backup.write_bytes(source.read_bytes())
                Path(filepath).write_bytes(b"saved edit")

            fake = SimpleNamespace(
                data=SimpleNamespace(filepath=str(source)),
                context=SimpleNamespace(preferences=SimpleNamespace(filepaths=settings)),
                ops=SimpleNamespace(wm=SimpleNamespace(save_as_mainfile=save)),
            )
            with patch.dict(sys.modules, {"bpy": fake}):
                save_working_source(source)
                with self.assertRaises(ValueError):
                    save_working_source(other)
            self.assertEqual(source.read_bytes(), b"saved edit")
            self.assertEqual(backup.read_bytes(), b"protected backup")
            self.assertEqual(other.read_bytes(), b"another source")
            self.assertEqual(settings.save_version, 1)

    def test_failed_working_save_restores_preference(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "source.blend"
            source.write_bytes(b"working source")
            settings = SimpleNamespace(save_version=2)

            def fail(*, filepath: str, compress: bool) -> None:
                raise RuntimeError("injected disk failure")

            fake = SimpleNamespace(
                data=SimpleNamespace(filepath=str(source)),
                context=SimpleNamespace(preferences=SimpleNamespace(filepaths=settings)),
                ops=SimpleNamespace(wm=SimpleNamespace(save_as_mainfile=fail)),
            )
            with patch.dict(sys.modules, {"bpy": fake}), self.assertRaises(RuntimeError):
                save_working_source(source)
            self.assertEqual(settings.save_version, 2)
            self.assertEqual(source.read_bytes(), b"working source")

    def test_imports_do_not_require_or_initialize_blender(self) -> None:
        for name in (
            "build_hydra",
            "export_asset",
            "native_types",
            "author_components",
            "head_components",
            "scale_components",
            "verify_edit_loop",
        ):
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
