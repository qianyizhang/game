"""Runtime comparisons reject changed topology, nonfinite data and stale source shapes."""

import math
import unittest

from verify_runtime import compare, read_samples


class RuntimeComparisonTests(unittest.TestCase):
    def test_runtime_comparison_rejects_material_drift(self) -> None:
        samples = {"mesh/a": [1.0, 2.0, 3.0]}
        self.assertLess(compare(samples, {"mesh/a": [1.0, 2.0, 3.000001]}, 1e-4), 1e-4)
        for other in (
            {"mesh/b": [1.0, 2.0, 3.0]},
            {"mesh/a": [1.0, 2.0]},
            {"mesh/a": [1.0, 2.0, 3.01]},
            {"mesh/a": [1.0, math.nan, 3.0]},
        ):
            with self.assertRaises(ValueError):
                compare(samples, other, 1e-4)

    def test_baseline_requires_finite_numeric_arrays(self) -> None:
        self.assertEqual(read_samples({"mesh/a": [1, 2.0]}), {"mesh/a": [1.0, 2.0]})
        for raw in ({"a": [True]}, {"a": ["1"]}, {"a": None}, {"a": [math.inf]}):
            with self.assertRaises(ValueError):
                read_samples(raw)


if __name__ == "__main__":
    unittest.main()
