"""Publish the saved artist source without changing it. Flatten only a delivery copy."""
import bpy
import json
import sys
import math
from pathlib import Path
from mathutils import Vector
ROOT=Path(sys.argv[sys.argv.index('--')+1])
scene=bpy.context.scene
collection=bpy.data.collections['DELIVERY | Briar Hydra']
objects=list(collection.objects)
rig=next(o for o in objects if o.type=='ARMATURE')
meshes=[o for o in objects if o.type=='MESH']
if not rig.animation_data or not rig.animation_data.action:
    raise RuntimeError('Delivery rig has no animation action')
if scene.render.fps != 24 or scene.frame_end-scene.frame_start != 144:
    raise RuntimeError('Pilot expects a six-second action at 24 fps')
# Check actual evaluated geometry at motion extremes and loop closure.
body=next(o for o in meshes if o.name.startswith('Skin |'))
anchor=body.vertex_groups['Coil.anchor'].index
fixed=[v.index for v in body.data.vertices if any(g.group==anchor and g.weight>.999 for g in v.groups)]
# Disable subdivision only for matching evaluated vertex indices in this skin audit.
subdiv=[m for m in body.modifiers if m.type=='SUBSURF']
for m in subdiv: m.show_viewport=False
samples=[]
for frame in [1,37,73,109,145]:
    scene.frame_set(frame)
    evaluated=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=evaluated.to_mesh()
    samples.append([tuple(v.co) for v in mesh.vertices])
    evaluated.to_mesh_clear()
for m in subdiv: m.show_viewport=True
max_anchor=max((Vector(s[i])-Vector(samples[0][i])).length for s in samples for i in fixed)
max_loop=max((Vector(a)-Vector(b)).length for a,b in zip(samples[0],samples[-1]))
max_motion=max((Vector(a)-Vector(b)).length for a,b in zip(samples[0],samples[2]))
if max_anchor>1e-5 or max_loop>1e-5 or max_motion<.005:
    raise RuntimeError(f'Invalid deformation: anchor={max_anchor}, loop={max_loop}, motion={max_motion}')
for obj in meshes:
    for v in obj.data.vertices:
        if any(not math.isfinite(x) for x in v.co): raise RuntimeError('Non-finite geometry')
        if abs(sum(g.weight for g in v.groups)-1)>1e-4: raise RuntimeError(f'Invalid weights: {obj.name}')
scene.frame_set(1)
authoring={
    'blender':bpy.app.version_string,
    'features':scene.get('dcc_native_features',''),
    'constructionCurves':len(bpy.data.collections['CONSTRUCTION | editable Bezier gestures'].objects),
    'sourceMeshes':len(meshes),
    'liveSubdivisionModifiers':sum(1 for o in meshes for m in o.modifiers if m.type=='SUBSURF'),
    'packedImages':[im.name for im in bpy.data.images if im.packed_file],
    'action':rig.animation_data.action.name,
    'audit':{'sampleFrames':[1,37,73,109,145],'fixedVertices':len(fixed),'maxAnchorDrift':max_anchor,'maxLoopDifference':max_loop,'maxMidpointDeformation':max_motion},
}
# Apply finishing modifiers before combining the delivery meshes. The source keeps them editable.
for obj in meshes:
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
    for modifier in list(obj.modifiers):
        if modifier.type!='ARMATURE': bpy.ops.object.modifier_apply(modifier=modifier.name)
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes: obj.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.object.join()
# Simplify the evaluated delivery surface; keep the full editable source intact.
mod=body.modifiers.new('Web delivery | bounded simplification','DECIMATE')
mod.ratio=.64
bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL',limit=4)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL',lock_active=False)
body.name='Briar Hydra | delivery skin'
# Joining retains vertex-group names and one common armature; material slots become primitives.
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); rig.select_set(True)
bpy.context.view_layer.objects.active=rig
# Save stable evaluated delivery samples for an independent Three.js skinning comparison.
indices=list(dict.fromkeys(round(i*(len(body.data.vertices)-1)/63) for i in range(64)))
poses=[]
for frame in [1,37,73,109,145]:
    scene.frame_set(frame)
    evaluated=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=evaluated.to_mesh()
    points=[]
    for index in indices:
        point=evaluated.matrix_world @ mesh.vertices[index].co
        points.append([round(point.x,7),round(point.z,7),round(-point.y,7)])
    poses.append({'seconds':(frame-1)/24,'points':points})
    evaluated.to_mesh_clear()
(ROOT/'assets/pose-samples.json').write_text(json.dumps({'space':'glTF world, Y up','samples':poses},separators=(',',':'))+'\n')
scene.frame_set(1)
bpy.ops.export_scene.gltf(
    filepath=str(ROOT/'assets/briar-hydra.pending.glb'),export_format='GLB',
    use_selection=True,export_animations=True,export_force_sampling=True,
    export_frame_range=True,export_anim_slide_to_zero=True,export_skins=True,export_yup=True,
    export_materials='EXPORT',export_cameras=False,export_lights=False,
    export_extras=False,export_texcoords=True,export_normals=True,
)
(ROOT/'assets/authoring.json').write_text(json.dumps(authoring,indent=2)+'\n')
print('DCC_EXPORT_AUDIT',json.dumps(authoring['audit']))
