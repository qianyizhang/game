"""Briar Hydra: native Blender construction, editable curves and a deform rig.

The saved scene is the authoring source. Export never reruns this recipe.
Coordinate convention: Z up, -Y forward. glTF exporter handles Y-up delivery.
"""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector, Matrix
from math import sin, cos, pi

ROOT = Path(sys.argv[sys.argv.index('--') + 1])
BRIEF = json.loads((ROOT / 'briefs/briar-hydra.json').read_text())
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for collection in list(bpy.data.collections):
    if collection.name != 'Collection':
        bpy.data.collections.remove(collection)
asset = bpy.data.collections.get('Collection')
asset.name = 'DELIVERY | Briar Hydra'
construction = bpy.data.collections.new('CONSTRUCTION | editable Bezier gestures')
bpy.context.scene.collection.children.link(construction)
construction.hide_render = True
construction.hide_viewport = True


def material(name, color, roughness=0.6, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return m


skin = material('Marsh skin | baked pigment', (0.12, 0.205, 0.135), .58)
plate = material('Throat | warm worn keratin', (.25, .27, .15), .64)
armor = material('Dorsal shields | deep olive', (.065, .12, .081), .52)
horn = material('Horn | weathered ivory', (.42, .37, .24), .48)
horn_tip = material('Horn tip | dark umber', (.16, .12, .07), .5)
mouth = material('Mouth | oxblood', (.095, .018, .021), .48)
eye_mat = material('Iris | amber', (.79, .31, .035), .27)
pupil_mat = material('Pupil | obsidian', (.005, .009, .006), .19)
tooth = material('Teeth | old ivory', (.66, .61, .42), .35)


def active(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def finish(obj, name, mat):
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if obj.type == 'MESH':
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj


def ellipsoid(name, center, scale, mat, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=center)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat)


def curve(name, points, radii, mat, resolution=8, bevel=5, keep=False):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = resolution
    data.bevel_depth = 1
    data.bevel_resolution = bevel
    data.use_fill_caps = True
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for p, xyz, radius in zip(spline.bezier_points, points, radii):
        p.co = xyz
        p.radius = radius
        p.handle_left_type = 'AUTO'
        p.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, data)
    asset.objects.link(obj)
    if keep:
        original = obj.copy()
        original.data = data.copy()
        original.name = name + ' | editable source'
        construction.objects.link(original)
    active(obj)
    bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object, name, mat)


def joined(objects, name, mat, voxel=None, subdiv=False):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    if voxel:
        mod = obj.modifiers.new('Sculpt union | voxel remesh', 'REMESH')
        mod.mode = 'VOXEL'
        mod.voxel_size = voxel
        mod.use_smooth_shade = True
        bpy.ops.object.modifier_apply(modifier=mod.name)
        mod = obj.modifiers.new('Relax anatomical transitions', 'SMOOTH')
        mod.factor = 1.3
        mod.iterations = 5
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if subdiv:
        mod = obj.modifiers.new('Surface finish | editable subdivision', 'SUBSURF')
        mod.levels = 1
        mod.render_levels = 1
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


# Every neck has its own gesture and a smooth, fused root.
paths = [
    [(0, .18, .44), (-.10, .20, .88), (-.18, .25, 1.43), (.02, .15, 2.02), (.12, -.18, 2.51), (.06, -.40, 2.80)],
    [(-.27, .10, .44), (-.56, .15, .79), (-.84, .12, 1.13), (-1.00, -.03, 1.37), (-1.03, -.35, 1.56), (-1.08, -.50, 1.67)],
    [(.28, .16, .43), (.62, .29, .82), (.88, .32, 1.24), (.99, .23, 1.65), (.89, -.02, 1.99), (.77, -.23, 2.13)],
]
radii = [[.30, .25, .195, .16, .138, .155], [.29, .245, .20, .16, .136, .15], [.30, .255, .20, .163, .14, .15]]
coil_points = []
coil_radii = []
for i in range(17):
    t = i / 16
    a = t * 2 * pi * 1.11 + .1
    r = .53 + .64 * sin(t * pi / 2)
    coil_points.append((r * cos(a), .12 + r * sin(a) * .76, .29 - .19 * t))
    coil_radii.append(.32 * (1 - t) ** .66 + .008)
# Bury the start cap inside the saddle; an exposed cap creates a planar coil seam.
coil_points.insert(0, (0, .16, .44))
coil_radii.insert(0, .34)
parts = [ellipsoid('Shoulder saddle', (0, .16, .48), (.61, .45, .33), skin)]
parts.append(curve('Coil gesture', coil_points, coil_radii, skin, keep=True))
for i, path in enumerate(paths):
    parts.append(curve(f'Neck {i+1} gesture', path, radii[i], skin, keep=True))
body = joined(parts, 'Skin | fused shoulder, necks and anchored coil', skin, .038, True)
body['construction'] = 'Bezier profiles, voxel remesh, smooth relaxation, live subdivision'

# Rig the continuous skin; no independent head objects pretending to bend a neck.
arm_data = bpy.data.armatures.new('Hydra deformation skeleton')
rig = bpy.data.objects.new('RIG | Briar Hydra', arm_data)
asset.objects.link(rig)
active(rig)
bpy.ops.object.mode_set(mode='EDIT')
root_bone = arm_data.edit_bones.new('Coil.anchor')
root_bone.head = (0, .15, .2)
root_bone.tail = (0, .15, .55)
for i, path in enumerate(paths):
    previous = root_bone
    for j in range(len(path)-1):
        bone = arm_data.edit_bones.new(f'Neck.{i}.{j}')
        bone.head = path[j]
        bone.tail = path[j+1]
        bone.parent = previous
        previous = bone
    head = arm_data.edit_bones.new(f'Head.{i}')
    head.head = path[-1]
    head.tail = Vector(path[-1]) + Vector((0, -.46, .02))
    head.parent = previous
    jaw = arm_data.edit_bones.new(f'Jaw.{i}')
    jaw.head = Vector(path[-1]) + Vector((0, -.08, -.10))
    jaw.tail = jaw.head + Vector((0, -.40, -.02))
    jaw.parent = head
bpy.ops.object.mode_set(mode='OBJECT')
rig.show_in_front = True
rig.data.display_type = 'BBONE'


def attach(obj, bone=None):
    obj.parent = rig
    mod = obj.modifiers.new('Hydra | deformation', 'ARMATURE')
    mod.object = rig
    if bone:
        obj.vertex_groups.new(name=bone).add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
    return obj


def weights_for_point(p):
    if p.z < .58:
        return [('Coil.anchor', 1)]
    best = None
    for i, path in enumerate(paths):
        for j in range(len(path)-1):
            a, b = Vector(path[j]), Vector(path[j+1])
            t = max(0, min(1, (p-a).dot(b-a)/(b-a).length_squared))
            distance = (p-a-(b-a)*t).length
            if best is None or distance < best[0]:
                best = (distance, i, j, t)
    _, i, j, t = best
    # Blend adjacent bone frames around the segment midpoint.
    if t < .5:
        prev = f'Neck.{i}.{j-1}' if j else 'Coil.anchor'
        result = [(prev, .5-t), (f'Neck.{i}.{j}', .5+t)]
    else:
        nxt = f'Neck.{i}.{j+1}' if j < 4 else f'Head.{i}'
        result = [(f'Neck.{i}.{j}', 1.5-t), (nxt, t-.5)]
    return [(n, w) for n, w in result if w > .00001]


attach(body)
for bone in arm_data.bones:
    body.vertex_groups.new(name=bone.name)
for vertex in body.data.vertices:
    p = body.matrix_world @ vertex.co
    for name, weight in weights_for_point(p):
        body.vertex_groups[name].add([vertex.index], weight, 'REPLACE')


def attach_neck_detail(obj):
    attach(obj)
    for vertex in obj.data.vertices:
        p = obj.matrix_world @ vertex.co
        for name, weight in weights_for_point(p):
            group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
            group.add([vertex.index], weight, 'REPLACE')


# Curved throat scutes overlap into a ventral plane, with quiet shoulders below.
for i, path in enumerate(paths):
    for j in range(2, 23):
        f = j / 23 * 4.65
        k = min(4, int(f))
        t = f-k
        center = Vector(path[k]).lerp(Vector(path[k+1]), t)
        radius = radii[i][k]*(1-t) + radii[i][k+1]*t
        tangent=(Vector(path[k+1])-Vector(path[k])).normalized()
        lateral=(Vector((1,0,0))-tangent*tangent.x).normalized()
        front=lateral.cross(tangent).normalized()
        verts=[]
        for row in range(3):
            length=(row-1)*.048
            for column in range(9):
                angle=(column/8-.5)*2.0
                raised=(1-abs(column-4)/4)*.012
                r=radius*.99+raised
                v=center + tangent*length + lateral*(sin(angle)*r) + front*(cos(angle)*r)
                verts.append(v)
        faces=[(row*9+c,row*9+c+1,(row+1)*9+c+1,(row+1)*9+c) for row in range(2) for c in range(8)]
        mesh=bpy.data.meshes.new(f'Throat plate cage.{i}.{j}'); mesh.from_pydata(verts,[],faces); mesh.update()
        obj=bpy.data.objects.new(f'Throat.{i}.{j} | fitted transverse scute',mesh); asset.objects.link(obj)
        finish(obj,obj.name,plate); active(obj)
        mod=obj.modifiers.new('Thin keratin shell','SOLIDIFY'); mod.thickness=.008
        bpy.ops.object.modifier_apply(modifier=mod.name)
        attach_neck_detail(obj)
    # A sparse swept dorsal crest follows the back of each neck.
    for j in range(3, 11):
        f = j/11*4.8
        k = min(4, int(f)); t=f-k
        p = Vector(path[k]).lerp(Vector(path[k+1]), t)
        r = radii[i][k]*(1-t) + radii[i][k+1]*t
        p.y += r*.85
        length = .16 + .055*sin(j*.65)
        obj = curve(f'Crest.{i}.{j}', [p, p+Vector((0,.08,.055)), p+Vector((0,length,.10))], [.058,.044,.002], armor, 4, 2)
        attach_neck_detail(obj)


# Skull parts are fused before ornament. A wedge-shaped muzzle and hooded eyes.
for i, path in enumerate(paths):
    c = Vector(path[-1])
    scale = [1.02, .88, .94][i]
    yaw = [0.03, -.37, .32][i]
    rot = Matrix.Rotation(yaw, 4, 'Z')
    def pt(x, y, z):
        return c + (rot @ Vector((x*scale, y*scale, z*scale)))
    # A native quad cage creates cranial planes instead of a cluster of spheres.
    # Each ring specifies y, half-width, crown height and jaw-line height.
    rings=[(.19,.105,.085,-.08),(.085,.225,.17,-.11),(-.095,.245,.15,-.10),(-.25,.205,.105,-.068),(-.46,.171,.061,-.051),(-.60,.119,.042,-.037)]
    verts=[]
    for y,w,top,bottom in rings:
        mid=(top+bottom)*.5
        for x,z in [(0,top),(w*.70,top*.92),(w,mid+.027),(w*.92,bottom+.025),(w*.6,bottom),(0,bottom),(-w*.6,bottom),(-w*.92,bottom+.025),(-w,mid+.027),(-w*.7,top*.92)]:
            verts.append(pt(x,y,z))
    faces=[]
    for r in range(len(rings)-1):
        for a in range(10):
            faces.append((r*10+a,r*10+(a+1)%10,(r+1)*10+(a+1)%10,(r+1)*10+a))
    faces += [tuple(reversed(range(10))),tuple((len(rings)-1)*10+a for a in range(10))]
    mesh=bpy.data.meshes.new(f'Skull cage.{i}');mesh.from_pydata(verts,[],faces);mesh.update()
    skull=bpy.data.objects.new(f'Skull.{i} | sculpted cranial cage',mesh);asset.objects.link(skull)
    finish(skull,skull.name,skin)
    active(skull)
    # Recalculate winding and keep subdivision editable in the artist source.
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
    mod=skull.modifiers.new('Cranial planes | subdivision','SUBSURF');mod.levels=2;mod.render_levels=2
    attach(skull, f'Head.{i}')
    jaw_obj = ellipsoid(f'Jaw.{i} | fitted lower mandible', pt(0,-.30,-.14), (.17*scale,.31*scale,.043*scale), skin)
    jaw_obj.rotation_euler.z = yaw
    attach(jaw_obj, f'Jaw.{i}')
    # Oral planes lie inside the skull and mandible, not over the lip edges.
    for lower in [False, True]:
        obj = ellipsoid(f"Oral.{'lower' if lower else 'upper'}.{i}", pt(0,-.29,-.102 if not lower else -.11), (.155*scale,.26*scale,.023*scale), mouth, 24, 10)
        obj.rotation_euler.z = yaw
        attach(obj, f'Jaw.{i}' if lower else f'Head.{i}')
    for side in [-1, 1]:
        # Eyes are mostly buried in the temple; small dark slits sit on amber.
        eye = ellipsoid(f'Eye.{i}.{side}', pt(side*.210,-.15,.044), (.026*scale,.051*scale,.027*scale), eye_mat, 20, 12)
        eye.rotation_euler.z = yaw
        attach(eye, f'Head.{i}')
        pupil = ellipsoid(f'Pupil.{i}.{side}', pt(side*.233,-.162,.044), (.006*scale,.009*scale,.022*scale), pupil_mat, 16, 10)
        pupil.rotation_euler.z = yaw
        attach(pupil, f'Head.{i}')
        brow = curve(f'Brow.{i}.{side}', [pt(side*.13,-.30,.074),pt(side*.222,-.16,.081),pt(side*.215,.025,.102)], [.018,.025,.013], armor, 6, 3)
        attach(brow, f'Head.{i}')
        nostril = ellipsoid(f'Nostril.{i}.{side}', pt(side*.094,-.52,.037), (.023,.031,.008), pupil_mat, 16, 8)
        nostril.rotation_euler.z = yaw
        attach(nostril, f'Head.{i}')
        # Swept horns retain editable native curve sources in the construction collection.
        tip = .39 if not (i == 1 and side == -1) else .25
        points = [pt(side*.15,.055,.145),pt(side*.24,.18,.255),pt(side*.30,.36,tip),pt(side*.25,.53,tip+.08)]
        obj = curve(f'Crown horn.{i}.{side}', points, [.085,.063,.029,.0015], horn, 9, 4, True)
        attach(obj, f'Head.{i}')
        # A lower cheek spur helps the head read from the rear.
        obj = curve(f'Cheek spur.{i}.{side}', [pt(side*.21,.05,-.055),pt(side*.32,.20,-.015),pt(side*.38,.34,.10)], [.062,.041,.001], armor, 6, 3)
        attach(obj, f'Head.{i}')
        # Individually fitted, uneven teeth; the longest pair sit back from the tip.
        for j in range(8):
            y = -.49+j*.045
            x = side*(.107 + .04*sin(j/7*pi))
            length = .047 + (.032 if j == 2 else .009*sin(j*2.1))
            for lower in [False, True]:
                z = -.092 if not lower else -.10
                end = z-length if not lower else z+length*.66
                obj = curve(f'Tooth.{i}.{side}.{j}.{lower}', [pt(x,y,z),pt(x*.97,y-.009,end)], [.013,.0006], tooth, 2, 2)
                attach(obj, f'Jaw.{i}' if lower else f'Head.{i}')
    # Central forehead shields have different sizes, avoiding a bead necklace.
    for j, (y, z, s) in enumerate([(-.13,.132,.082),(.02,.162,.095),(.16,.099,.063)]):
        obj = ellipsoid(f'Crown shield.{i}.{j}', pt(0,y,z), (s*scale,.083*scale,.013*scale), armor, 16, 8)
        obj.rotation_euler.z = yaw
        attach(obj, f'Head.{i}')

# UVs and a real Blender procedural-material bake. This survives glTF delivery.
# All skin objects share one packed pigment atlas. The shader remains in the file.
skin_objects = [o for o in asset.objects if o.type == 'MESH' and skin in list(o.data.materials)]
bpy.ops.object.select_all(action='DESELECT')
for obj in skin_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.015)
bpy.ops.object.mode_set(mode='OBJECT')
nodes = skin.node_tree.nodes; links = skin.node_tree.links
bsdf = nodes.get('Principled BSDF')
texcoord = nodes.new('ShaderNodeTexCoord')
noise = nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=8.5; noise.inputs['Detail'].default_value=3.0
links.new(texcoord.outputs['Object'],noise.inputs['Vector'])
ramp=nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position=.2; ramp.color_ramp.elements[0].color=(.033,.065,.040,1)
ramp.color_ramp.elements[1].position=.8; ramp.color_ramp.elements[1].color=(.105,.155,.069,1)
links.new(noise.outputs['Fac'],ramp.inputs['Fac'])
links.new(ramp.outputs['Color'],bsdf.inputs['Base Color'])
image=bpy.data.images.new('Hydra | baked marsh pigment',width=2048,height=2048)
image.colorspace_settings.name='sRGB'
bake_node=nodes.new('ShaderNodeTexImage'); bake_node.image=image
nodes.active=bake_node
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=1
scene.render.bake.use_pass_direct=False
scene.render.bake.use_pass_indirect=False
scene.render.bake.use_pass_color=True
scene.render.bake.margin=8
# Bake one selected object at a time without clearing the shared atlas.
scene.render.bake.use_clear=True
for index,obj in enumerate(skin_objects):
    active(obj)
    nodes.active=bake_node
    bpy.ops.object.bake(type='DIFFUSE')
    scene.render.bake.use_clear=False
image.pack()
voronoi=nodes.new('ShaderNodeTexVoronoi');voronoi.feature='DISTANCE_TO_EDGE';voronoi.inputs['Scale'].default_value=72
links.new(texcoord.outputs['Object'],voronoi.inputs['Vector'])
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.32;bump.inputs['Distance'].default_value=.018
links.new(voronoi.outputs['Distance'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
normal_image=bpy.data.images.new('Hydra | baked scale relief',width=2048,height=2048)
normal_image.colorspace_settings.name='Non-Color'
normal_tex=nodes.new('ShaderNodeTexImage');normal_tex.image=normal_image
scene.render.bake.use_clear=True
for obj in skin_objects:
    active(obj);nodes.active=normal_tex
    bpy.ops.object.bake(type='NORMAL')
    scene.render.bake.use_clear=False
normal_image.pack()
normal_map=nodes.new('ShaderNodeNormalMap');normal_map.inputs['Strength'].default_value=.65
links.new(normal_tex.outputs['Color'],normal_map.inputs['Color']);links.new(normal_map.outputs['Normal'],bsdf.inputs['Normal'])
links.new(bake_node.outputs['Color'],bsdf.inputs['Base Color'])
# Keep the procedural graph as an editable upstream source, disconnected at delivery.
noise.label='Authoring pigment — rebake after surface edits'
ramp.label='Authoring palette — baked to atlas'

# Motion is one named Blender action, with different phases and fixed support.
scene.frame_start=1; scene.frame_end=145; scene.render.fps=24
for f in range(1,146,3):
    t=(f-1)/144*2*pi
    for i in range(3):
        phase=i*1.7
        for j in range(5):
            bone=rig.pose.bones[f'Neck.{i}.{j}']; bone.rotation_mode='XYZ'
            influence=(j/4)**1.3
            bone.rotation_euler=(.018*sin(t+phase-j*.30)*influence, .018*sin(t+phase*.7)*influence, .028*sin(t+phase-j*.25)*influence)
            bone.keyframe_insert('rotation_euler',frame=f,group=f'Neck {i+1}')
        head=rig.pose.bones[f'Head.{i}']; head.rotation_mode='XYZ'
        head.rotation_euler=(.035*sin(t+phase), .045*sin(t+phase+.6), .055*sin(t+phase))
        head.keyframe_insert('rotation_euler',frame=f,group=f'Head {i+1}')
        jaw=rig.pose.bones[f'Jaw.{i}']; jaw.rotation_mode='XYZ'
        jaw.rotation_euler=([.42,.07,.16][i]+([.14,.035,.06][i])*(.5+.5*sin(t+phase)),0,0)
        jaw.keyframe_insert('rotation_euler',frame=f,group=f'Jaw {i+1}')
rig.animation_data.action.name=BRIEF['animation']['name']
# Linear interpolation avoids unexpected handle overshoot; endpoints coincide.
for curve_data in rig.animation_data.action.fcurves:
    for key in curve_data.keyframe_points:
        key.interpolation='LINEAR'
scene.frame_set(1)
scene['dcc_brief']='briefs/briar-hydra.json'
scene['dcc_recipe']='blender/build_hydra.py'
scene['dcc_native_features']='Bezier curves; voxel remesh; smooth; live subdivision; armature; F-curves; UV atlas; procedural pigment and normal bake'
scene['dcc_note']='Editable source. Export preserves manual edits. Construction curves are retained separately.'
# The file opens with the model and rig easy to inspect.
active(body)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=5.8
            area.spaces.active.region_3d.view_location=(0,0,1.4)
            area.spaces.active.shading.type='MATERIAL'
scene.render.engine='BLENDER_EEVEE_NEXT'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'sources/briar-hydra.blend'),compress=True)
print('DCC_SOURCE_SAVED', ROOT/'sources/briar-hydra.blend')
