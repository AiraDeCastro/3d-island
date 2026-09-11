import * as THREE from 'three'
import { createCoconutTree } from './CoconutTree'
import type { WindUniforms } from '../systems/WindSystem'

export const SAND_RADIUS = 4
export const OCEAN_RADIUS = 9
export const OCEAN_LEVEL = -0.15

interface TreePlacement {
  angle: number // radians around the island center
  distance: number // from center, world units
  scale: number
  lean: number
}

// Hand-placed rather than randomized: a handful of deliberate positions
// reads better than a scatter, and stays deterministic for tests.
const TREE_PLACEMENTS: TreePlacement[] = [
  { angle: 0.4, distance: 2.8, scale: 1, lean: 0.1 },
  { angle: 1.7, distance: 3.1, scale: 0.85, lean: -0.12 },
  { angle: 2.6, distance: 2.5, scale: 1.1, lean: 0.06 },
  { angle: 3.8, distance: 3.2, scale: 0.9, lean: 0.15 },
  { angle: 5.1, distance: 2.7, scale: 1, lean: -0.08 },
]

/**
 * Places the coconut grove around the sand disc. The sand and ocean
 * surfaces themselves live in SandSystem/OceanSystem — both need a
 * WebGLRenderer to run their shaders, so main.ts assembles them directly;
 * this stays a pure, DOM-free function.
 */
export function createIslandTrees(windUniforms: WindUniforms): THREE.Group {
  const grove = new THREE.Group()
  grove.name = 'grove'

  for (const placement of TREE_PLACEMENTS) {
    const tree = createCoconutTree({
      windUniforms,
      scale: placement.scale,
      lean: placement.lean,
    })
    tree.position.set(
      Math.cos(placement.angle) * placement.distance,
      0,
      Math.sin(placement.angle) * placement.distance,
    )
    tree.rotation.y = placement.angle
    grove.add(tree)
  }

  return grove
}
