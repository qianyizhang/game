"""RNA properties must be checked dynamically on Blender's embedded Python."""

import unittest

from native_types import color_socket, cycles_settings, float_socket, property_controls


class DynamicRNA:
    def __init__(self, name: str, value: object) -> None:
        self.name, self.value = name, value

    def __getattr__(self, name: str) -> object:
        if name == self.name:
            return self.value
        raise AttributeError(name)


class NativeBoundaryTests(unittest.TestCase):
    def test_dynamic_rna_members_are_available_on_python_312_and_later(self) -> None:
        color = DynamicRNA("default_value", (1.0, 0.5, 0.0, 1.0))
        numeric = DynamicRNA("default_value", 0.5)
        cycles = DynamicRNA("samples", 32)
        controls = DynamicRNA("id_properties_ui", lambda key: key)
        self.assertIs(color_socket(color), color)
        self.assertIs(float_socket(numeric), numeric)
        self.assertIs(cycles_settings(cycles), cycles)
        self.assertIs(property_controls(controls), controls)
        for check in (color_socket, float_socket, cycles_settings, property_controls):
            with self.assertRaises(ValueError):
                check(object())


if __name__ == "__main__":
    unittest.main()
