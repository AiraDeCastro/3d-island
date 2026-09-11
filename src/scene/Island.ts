import * as THREE from 'three'
import { createCoconutTree } from './CoconutTree'
import { createBeachHut } from './Hut'
import type { WindUniforms } from '../systems/WindSystem'

export const SAND_RADIUS = 4
export const OCEAN_RADIUS = 9
export const OCEAN_LEVEL = -0.15

interface TreePlacement {
  angle: number // radians around the island center
  distance: number // from center, world units
  scale: number
  /** Extra yaw so identical trunks/fronds don't all face the same way. */
  yaw: number
}

// Hand-placed rather than randomized: a handful of deliberate positions
// reads better than a scatter, and stays deterministic for tests. Trunk
// lean itself is baked into the Blender asset (see build_coconut_tree.py),
// not varied per instance.
export const TREE_PLACEMENTS: TreePlacement[] = [
  { angle: 0.4, distance: 2.8, scale: 1, yaw: 0.5 },
  { angle: 1.7, distance: 3.1, scale: 0.85, yaw: 2.1 },
  { angle: 2.6, distance: 2.5, scale: 1.1, yaw: 4.0 },
  { angle: 3.8, distance: 3.2, scale: 0.9, yaw: 1.2 },
  { angle: 5.1, distance: 2.7, scale: 1, yaw: 3.3 },
]

export const HUT_PLACEMENT = { angle: 2.15, distance: 1.5 }

/**
 * Places the coconut grove and beach hut around the sand disc. The sand
 * and ocean surfaces themselves live in SandSystem/OceanSystem — both need
 * a WebGLRenderer, so main.ts assembles them directly. Loading the
 * Blender-authored models is async, so this returns a promise; main.ts
 * adds the grove to the scene once it resolves rather than blocking the
 * rest of the scene on it.
 */
export async function createIslandTrees(windUniforms: WindUniforms): Promise<THREE.Group> {
  const grove = new THREE.Group()
  grove.name = 'grove'

  const trees = await Promise.all(TREE_PLACEMENTS.map(() => createCoconutTree({ windUniforms })))

  trees.forEach((tree, i) => {
    const placement = TREE_PLACEMENTS[i]
    tree.scale.setScalar(placement.scale)
    tree.position.set(
      Math.cos(placement.angle) * placement.distance,
      0,
      Math.sin(placement.angle) * placement.distance,
    )
    tree.rotation.y = placement.yaw
    grove.add(tree)
  })

  return grove
}

export async function createIslandHut(windUniforms: WindUniforms): Promise<THREE.Group> {
  const hut = await createBeachHut({ windUniforms })
  hut.position.set(
    Math.cos(HUT_PLACEMENT.angle) * HUT_PLACEMENT.distance,
    0,
    Math.sin(HUT_PLACEMENT.angle) * HUT_PLACEMENT.distance,
  )
  hut.rotation.y = HUT_PLACEMENT.angle + Math.PI
  hut.scale.setScalar(0.9)
  return hut
}
