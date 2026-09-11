import { describe, expect, it } from 'vitest'
import { createIslandTrees, SAND_RADIUS } from './Island'
import { WindSystem } from '../systems/WindSystem'

describe('createIslandTrees', () => {
  it('places every tree within the sand radius', () => {
    const wind = new WindSystem()
    const grove = createIslandTrees(wind.uniforms)

    expect(grove.children.length).toBeGreaterThan(0)
    for (const tree of grove.children) {
      const distance = Math.hypot(tree.position.x, tree.position.z)
      expect(distance).toBeLessThan(SAND_RADIUS)
    }
  })

  it('gives each placed tree its own rotation to avoid an obviously repeated layout', () => {
    const wind = new WindSystem()
    const grove = createIslandTrees(wind.uniforms)
    const rotations = new Set(grove.children.map((tree) => tree.rotation.y.toFixed(3)))

    expect(rotations.size).toBe(grove.children.length)
  })
})
