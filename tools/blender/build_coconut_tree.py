"""Generates assets/models/coconut-tree.glb.

Run headless: blender --background --python tools/blender/build_coconut_tree.py -- <out.glb>

The tree is authored with the trunk's local Z as "height" (Blender is
Z-up; the glTF exporter converts this to Y-up automatically, so a frond
mesh's local Y ends up 0 at its base and positive toward its tip once
loaded in three.js). That's deliberate: the wind-sway shader injected in
src/systems/applyWindSway.ts derives how much a vertex should sway
straight from its local Y, so no custom per-vertex attribute needs to
survive the glTF round-trip — just plain POSITION data.
"""

import math
import random
import sys

import bmesh
import bpy


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.objects):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def make_material(name: str, color: tuple, roughness: float = 0.8):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def build_trunk(height: float, base_radius: float, top_radius: float, lean_deg: float):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=base_radius, depth=height, vertices=10, location=(0, 0, height / 2)
    )
    trunk = bpy.context.active_object
    trunk.name = "Trunk"

    bm = bmesh.new()
    bm.from_mesh(trunk.data)
    bm.verts.ensure_lookup_table()
    top_z = max(v.co.z for v in bm.verts)
    scale = top_radius / base_radius
    for v in bm.verts:
        if abs(v.co.z - top_z) < 1e-4:
            v.co.x *= scale
            v.co.y *= scale
    bm.to_mesh(trunk.data)
    bm.free()

    mod = trunk.modifiers.new("Bend", type="SIMPLE_DEFORM")
    mod.deform_method = "BEND"
    mod.deform_axis = "X"
    mod.angle = math.radians(lean_deg)
    bpy.context.view_layer.objects.active = trunk
    bpy.ops.object.modifier_apply(modifier=mod.name)

    trunk.data.materials.append(make_material("Trunk", (0.42, 0.30, 0.19), roughness=0.9))
    return trunk


def build_frond(length: float, width: float, droop: float, segments: int, name: str):
    bm = bmesh.new()
    rings = []
    for i in range(segments + 1):
        t = i / segments
        z = t * length - droop * t * t
        w = (width * (1 - t * 0.85)) / 2
        rings.append((bm.verts.new((-w, 0, z)), bm.verts.new((w, 0, z))))
    for i in range(segments):
        a, b = rings[i]
        c, d = rings[i + 1]
        bm.faces.new((a, b, d, c))
    bm.normal_update()

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(make_material(f"{name}_Mat", (0.20, 0.42, 0.24), roughness=0.75))
    return obj


def build_coconut(radius: float, name: str):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=10, ring_count=6)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(make_material(f"{name}_Mat", (0.28, 0.17, 0.10), roughness=0.7))
    return obj


def build_tree() -> None:
    random.seed(7)
    root = bpy.data.objects.new("CoconutTree", None)
    bpy.context.collection.objects.link(root)

    height = 3.2
    lean_deg = 6
    trunk = build_trunk(height=height, base_radius=0.14, top_radius=0.075, lean_deg=lean_deg)
    trunk.parent = root

    crown_z = height * math.cos(math.radians(lean_deg))
    crown_x = height * math.sin(math.radians(lean_deg))

    frond_count = 7
    for i in range(frond_count):
        frond = build_frond(length=1.7, width=0.55, droop=0.85, segments=7, name=f"Frond_{i}")
        frond.location = (crown_x, 0, crown_z)
        frond.rotation_euler = (math.radians(-58), 0, (i / frond_count) * math.tau)
        frond.parent = root

    for i in range(3):
        angle = (i / 3) * math.tau
        coconut = build_coconut(radius=0.12, name=f"Coconut_{i}")
        coconut.location = (
            crown_x + math.cos(angle) * 0.15,
            math.sin(angle) * 0.15,
            crown_z - 0.05,
        )
        coconut.parent = root


def main() -> None:
    clear_scene()
    build_tree()

    argv = sys.argv[sys.argv.index("--") + 1 :]
    out_path = argv[0]

    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
