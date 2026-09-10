import * as THREE from 'three'

const SAND_RADIUS = 4
const OCEAN_RADIUS = 9

/**
 * Placeholder terrain: a flat sand disc and a flat ocean disc beneath it.
 * Stands in for the real heightmap-driven beach and Gerstner-wave ocean
 * until the Sand and Ocean systems (Milestone 1) replace their surfaces.
 */
export function createIsland(): THREE.Group {
  const island = new THREE.Group()
  island.name = 'island'

  const sand = new THREE.Mesh(
    new THREE.CircleGeometry(SAND_RADIUS, 48),
    new THREE.MeshStandardMaterial({ color: 0xd9c48a, roughness: 1 }),
  )
  sand.rotation.x = -Math.PI / 2
  sand.name = 'sand'
  island.add(sand)

  const ocean = new THREE.Mesh(
    new THREE.CircleGeometry(OCEAN_RADIUS, 64),
    new THREE.MeshStandardMaterial({
      color: 0x1c6e68,
      roughness: 0.3,
      metalness: 0.1,
    }),
  )
  ocean.rotation.x = -Math.PI / 2
  ocean.position.y = -0.15
  ocean.name = 'ocean'
  island.add(ocean)

  return island
}
