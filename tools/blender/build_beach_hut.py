"""Generates assets/models/beach-hut.glb.

Run headless: blender --background --python tools/blender/build_beach_hut.py -- <out.glb>

Everything is rigid except the "Curtain" mesh hanging in the doorway.
That one is authored with its anchor (the roof beam) at local Z=0 and
its free hem at negative Z, so after the glTF Y-up conversion its local
Y runs from 0 (anchor, still) down to negative (hem, swaying) — the
sign flip from the coconut fronds is handled by the `sign` option on
applyWindSway() rather than by a different mesh convention.
"""

import math
import sys

import bmesh
import bpy

PLATFORM_SIZE = 2.0
PLATFORM_HEIGHT = 0.9
POST_HEIGHT = 1.7
ROOF_HEIGHT = 1.2
EAVE_OVERHANG = 0.35


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.objects):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def make_material(name: str, color: tuple, roughness: float = 0.85):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def add_box(name: str, size, location):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def build_stilts(wood_mat):
    half = PLATFORM_SIZE / 2 - 0.15
    stilts = []
    for i, (sx, sy) in enumerate([(-1, -1), (1, -1), (-1, 1), (1, 1)]):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.08,
            depth=PLATFORM_HEIGHT,
            vertices=8,
            location=(sx * half, sy * half, PLATFORM_HEIGHT / 2),
        )
        stilt = bpy.context.active_object
        stilt.name = f"Stilt_{i}"
        stilt.data.materials.append(wood_mat)
        stilts.append(stilt)
    return stilts


def build_posts(wood_mat):
    half = PLATFORM_SIZE / 2 - 0.15
    posts = []
    for i, (sx, sy) in enumerate([(-1, -1), (1, -1), (-1, 1), (1, 1)]):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.06,
            depth=POST_HEIGHT,
            vertices=8,
            location=(sx * half, sy * half, PLATFORM_HEIGHT + POST_HEIGHT / 2),
        )
        post = bpy.context.active_object
        post.name = f"Post_{i}"
        post.data.materials.append(wood_mat)
        posts.append(post)
    return posts


def build_roof(thatch_mat):
    base_z = PLATFORM_HEIGHT + POST_HEIGHT
    bpy.ops.mesh.primitive_cone_add(
        radius1=PLATFORM_SIZE / 2 + EAVE_OVERHANG,
        depth=ROOF_HEIGHT,
        vertices=6,
        location=(0, 0, base_z + ROOF_HEIGHT / 2),
    )
    roof = bpy.context.active_object
    roof.name = "Roof"
    roof.rotation_euler = (0, 0, math.radians(15))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    roof.data.materials.append(thatch_mat)
    return roof


def build_curtain(cloth_mat):
    """Anchored at local Z=0 (the roof beam); hangs to Z=-height (the free hem)."""
    width = 0.9
    height = 1.3
    segments = 8

    bm = bmesh.new()
    rings = []
    for i in range(segments + 1):
        t = i / segments
        sag = 0.05 * math.sin(t * math.pi)  # a little slack, not a rigid flat sheet
        z = -t * height
        rings.append((bm.verts.new((-width / 2, sag, z)), bm.verts.new((width / 2, sag, z))))
    for i in range(segments):
        a, b = rings[i]
        c, d = rings[i + 1]
        bm.faces.new((a, b, d, c))
    bm.normal_update()

    mesh = bpy.data.meshes.new("Curtain")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("Curtain", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (0, -(PLATFORM_SIZE / 2 - 0.05), PLATFORM_HEIGHT + POST_HEIGHT - 0.1)
    obj.data.materials.append(cloth_mat)
    return obj


def build_hut() -> None:
    wood_mat = make_material("Wood", (0.42, 0.30, 0.19), roughness=0.9)
    deck_mat = make_material("Deck", (0.55, 0.42, 0.28), roughness=0.85)
    thatch_mat = make_material("Thatch", (0.62, 0.48, 0.22), roughness=0.95)
    cloth_mat = make_material("Cloth", (0.83, 0.36, 0.30), roughness=0.6)

    root = bpy.data.objects.new("BeachHut", None)
    bpy.context.collection.objects.link(root)

    platform = add_box(
        "Platform",
        (PLATFORM_SIZE, PLATFORM_SIZE, 0.12),
        (0, 0, PLATFORM_HEIGHT),
    )
    platform.data.materials.append(deck_mat)
    platform.parent = root

    for stilt in build_stilts(wood_mat):
        stilt.parent = root
    for post in build_posts(wood_mat):
        post.parent = root

    roof = build_roof(thatch_mat)
    roof.parent = root

    curtain = build_curtain(cloth_mat)
    curtain.parent = root


def main() -> None:
    clear_scene()
    build_hut()

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
