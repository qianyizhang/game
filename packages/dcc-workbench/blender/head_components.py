"""Install native driven head assemblies on an existing skinned source.

No scene reset, remesh, action replacement or material rebake. Each native
control drives all fitted facial meshes through the same anatomical frame.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from head_shape import CHANNELS, HEADS, head_offset
from native_types import mesh_data, present, property_controls, require

if TYPE_CHECKING:
    import bpy


def driven_key(obj: bpy.types.Object, name: str, control: bpy.types.Object) -> bpy.types.ShapeKey:
    import bpy

    key = obj.shape_key_add(name=name, from_mix=False)
    key.slider_min = 0.0
    key.slider_max = 1.5
    curve = require(key.driver_add("value"), bpy.types.FCurve)
    driver = present(curve.driver)
    driver.type = "SCRIPTED"
    variable = driver.variables.new()
    variable.name = "setting"
    variable.type = "SINGLE_PROP"
    variable.targets[0].id = control
    variable.targets[0].data_path = f'["{name}"]'
    driver.expression = "setting"
    return key


def validate_heads(collection: bpy.types.Collection) -> None:
    """Reject delivery when a displayed native setting is silently clamped."""
    from math import isclose

    import bpy

    for design in HEADS:
        control = bpy.data.objects.get(f"EDIT | Head.{design.role}")
        # Sources predating semantic controls remain exportable.
        if control is None:
            continue
        for obj in collection.all_objects:
            if obj.type != "MESH" or obj.get("component") != f"Head.{design.role}":
                continue
            keys = present(mesh_data(obj).shape_keys)
            for channel in CHANNELS:
                key = keys.key_blocks[channel]
                setting = control[channel]
                if not isinstance(setting, (float, int)) or not isclose(
                    key.value, setting, abs_tol=1e-6
                ):
                    raise ValueError(
                        f"Head control differs from evaluated shape: {design.role}, {channel}"
                    )


def install_heads(collection: bpy.types.Collection, rig: bpy.types.Object) -> None:
    import bpy
    from mathutils import Matrix, Vector

    armature = require(rig.data, bpy.types.Armature)
    if bpy.data.objects.get("EDIT | Head.Search"):
        raise ValueError("Head controls already exist; edit their native custom properties instead")
    for index, design in enumerate(HEADS):
        frame = (
            Matrix.Translation(armature.bones[f"Head.{index}"].head_local)
            @ Matrix.Rotation([0.03, -0.37, 0.32][index], 4, "Z")
            @ Matrix.Scale([1.02, 0.88, 0.94][index], 4)
        )
        control = bpy.data.objects.new(f"EDIT | Head.{design.role}", None)
        control.empty_display_type = "PLAIN_AXES"
        control.empty_display_size = 0.18
        control.location = armature.bones[f"Head.{index}"].head_local
        control.show_name = True
        control["component"] = "cranial-assembly.v1"
        collection.objects.link(control)
        for channel, value in zip(
            CHANNELS, (design.reach, design.taper, design.crown, design.horns), strict=True
        ):
            control[channel] = value
            property_controls(control).id_properties_ui(channel).update(
                min=0.0,
                max=1.5,
                description="Coordinated head shape; 0 restores this aspect of the source",
            )
        assembly = bpy.data.collections.new(f"HEAD | {design.role}")
        collection.children.link(assembly)
        groups = {f"Head.{index}", f"Jaw.{index}"}
        count = 0
        for obj in list(collection.objects):
            if obj.type != "MESH" or not obj.vertex_groups:
                continue
            if not {group.name for group in obj.vertex_groups} <= groups:
                continue
            if mesh_data(obj).shape_keys:
                raise ValueError(f"Refusing to replace artist shape keys: {obj.name}")
            assembly.objects.link(obj)
            obj["component"] = f"Head.{design.role}"
            obj.shape_key_add(name="Basis", from_mix=False)
            to_frame = frame.inverted() @ obj.matrix_world
            from_frame = obj.matrix_world.inverted() @ frame
            local_points = [to_frame @ vertex.co for vertex in mesh_data(obj).vertices]
            for channel in CHANNELS:
                key = driven_key(obj, channel, control)
                for vertex, point in zip(key.data, local_points, strict=True):
                    offset = Vector(
                        head_offset(
                            (point.x, point.y, point.z),
                            channel,
                            horn=obj.name.startswith("Crown horn."),
                        )
                    )
                    require(vertex, bpy.types.ShapeKeyPoint).co = from_frame @ (point + offset)
            count += 1
        control["fitted_meshes"] = count
        if count < 10:
            raise ValueError(f"Incomplete cranial assembly: {design.role}")
