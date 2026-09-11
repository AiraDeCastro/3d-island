import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createCoconutTree } from './CoconutTree'
import { WindSystem } from '../systems/WindSystem'

describe('createCoconutTree', () => {
  it('builds one trunk, seven fronds, and three coconuts', () => {
    const wind = new WindSystem()
    const tree = createCoconutTree({ windUniforms: wind.uniforms })

    const byName = (name: string) => tree.children.filter((c) => c.name === name)

    expect(byName('trunk')).toHaveLength(1)
    expect(byName('frond')).toHaveLength(7)
    expect(byName('coconut')).toHaveLength(3)
  })

  it('gives each tree a different sway phase unless one is specified', () => {
    const wind = new WindSystem()
    const a = createCoconutTree({ windUniforms: wind.uniforms })
    const b = createCoconutTree({ windUniforms: wind.uniforms })

    const phaseOf = (tree: THREE.Group) => {
      const frond = tree.children.find((c) => c.name === 'frond') as THREE.Mesh
      const material = frond.material as THREE.ShaderMaterial
      return material.uniforms.uPhaseOffset.value as number
    }

    expect(phaseOf(a)).not.toBe(phaseOf(b))
  })

  it('shares the same wind uniforms object across trees so one clock drives all of them', () => {
    const wind = new WindSystem()
    const a = createCoconutTree({ windUniforms: wind.uniforms })
    const b = createCoconutTree({ windUniforms: wind.uniforms })

    const frondOf = (tree: THREE.Group) => tree.children.find((c) => c.name === 'frond') as THREE.Mesh
    const materialA = frondOf(a).material as THREE.ShaderMaterial
    const materialB = frondOf(b).material as THREE.ShaderMaterial

    expect(materialA.uniforms.uWindTime).toBe(materialB.uniforms.uWindTime)
  })
})
