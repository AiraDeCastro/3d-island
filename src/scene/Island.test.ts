import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createIsland } from './Island'

describe('createIsland', () => {
  it('adds exactly a sand disc and an ocean disc', () => {
    const island = createIsland()
    const meshes = island.children.filter((c): c is THREE.Mesh => c instanceof THREE.Mesh)

    expect(meshes).toHaveLength(2)
    expect(meshes.map((m) => m.name).sort()).toEqual(['ocean', 'sand'])
  })

  it('keeps the ocean disc below and wider than the sand disc', () => {
    const island = createIsland()
    const sand = island.getObjectByName('sand') as THREE.Mesh
    const ocean = island.getObjectByName('ocean') as THREE.Mesh

    sand.geometry.computeBoundingSphere()
    ocean.geometry.computeBoundingSphere()

    expect(ocean.geometry.boundingSphere!.radius).toBeGreaterThan(
      sand.geometry.boundingSphere!.radius,
    )
    expect(ocean.position.y).toBeLessThan(sand.position.y)
  })
})
