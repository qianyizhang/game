"""Attachment and semantic-shape contracts, independent of the Blender runtime."""

import unittest

from head_shape import CHANNELS, head_offset


class HeadShapeTests(unittest.TestCase):
    def test_neck_attachment_does_not_move(self) -> None:
        for channel in CHANNELS:
            self.assertEqual(head_offset((0.1, 0.19, 0.08), channel), (0, 0, 0))

    def test_fitted_parts_share_transform_and_keep_bilateral_symmetry(self) -> None:
        for channel in CHANNELS:
            a = head_offset((0.16, -0.4, 0.04), channel)
            b = head_offset((-0.16, -0.4, 0.04), channel)
            self.assertEqual(a, (-b[0], b[1], b[2]))
        self.assertLess(head_offset((0.1, -0.6, 0), "Muzzle reach")[1], 0)
        with self.assertRaises(ValueError):
            head_offset((0, 0, 0), "typo")

    def test_horn_roots_stay_fitted_while_tips_sweep_back(self) -> None:
        self.assertEqual(head_offset((0.15, 0.05, 0.145), "Horn sweep", horn=True), (0, 0, 0))
        delta = head_offset((0.25, 0.53, 0.47), "Horn sweep", horn=True)
        self.assertGreater(delta[1], 0)
        self.assertLess(delta[2], 0)


if __name__ == "__main__":
    unittest.main()
