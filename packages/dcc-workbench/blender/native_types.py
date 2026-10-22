"""Checked Blender boundaries. Importing this module does not mutate or require Blender."""

from __future__ import annotations

from typing import TYPE_CHECKING, Protocol, TypeVar, cast

if TYPE_CHECKING:
    import bpy

T = TypeVar("T")


def require(value: object, kind: type[T]) -> T:
    if not isinstance(value, kind):
        raise ValueError(f"Expected Blender {kind.__name__}, got {type(value).__name__}")
    return value


def mesh_data(obj: bpy.types.Object) -> bpy.types.Mesh:
    import bpy

    return require(obj.data, bpy.types.Mesh)


def active_object() -> bpy.types.Object:
    import bpy

    return require(bpy.context.object, bpy.types.Object)


# Cycles is a bundled add-on, absent from generated bpy stubs. Keep its used interface narrow.


class CyclesSettings(Protocol):
    samples: int


class FloatSocket(Protocol):
    default_value: float


class ColorSocket(Protocol):
    default_value: tuple[float, float, float, float]


def present(value: T | None) -> T:
    if value is None:
        raise ValueError("Missing required Blender data")
    return value


def cycles_settings(value: object) -> CyclesSettings:
    if not isinstance(getattr(value, "samples", None), int):
        raise ValueError("Missing Cycles settings")
    return cast(CyclesSettings, value)


def float_socket(value: object) -> FloatSocket:
    if not isinstance(getattr(value, "default_value", None), (int, float)):
        raise ValueError("Missing numeric shader socket")
    return cast(FloatSocket, value)


def color_socket(value: object) -> ColorSocket:
    # Python 3.12+ runtime Protocol checks use static attribute lookup, which misses
    # Blender's dynamically exposed RNA properties. Check the actual value instead.
    default = getattr(value, "default_value", None)
    if default is None or not hasattr(default, "__len__") or len(default) != 4:
        raise ValueError("Missing color shader socket")
    return cast(ColorSocket, value)


class PropertyUI(Protocol):
    def update(self, *, min: float, max: float, description: str) -> None: ...


class EditableProperties(Protocol):
    def id_properties_ui(self, key: str) -> PropertyUI: ...


def property_controls(value: object) -> EditableProperties:
    """Generated stubs omit the native IDProperty UI manager return type."""
    if not callable(getattr(value, "id_properties_ui", None)):
        raise ValueError("Missing native custom-property controls")
    return cast(EditableProperties, value)
