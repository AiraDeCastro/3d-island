import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { findMeshesByPrefix } from './assetLoader'

describe('findMeshesByPrefix', () => {
  it('finds nested meshes whose name starts with the given prefix', () => {
    const root = new THREE.Group()
    const frond0 = new THREE.Mesh()
    frond0.name = 'Frond_0'
    const frond1 = new THREE.Mesh()
    frond1.name = 'Frond_1'
    const trunk = new THREE.Mesh()
    trunk.name = 'Trunk'

    const nested = new THREE.Group()
    nested.add(frond1)
    root.add(frond0, trunk, nested)

    const fronds = findMeshesByPrefix(root, 'Frond')

    expect(fronds).toHaveLength(2)
    expect(fronds).toContain(frond0)
    expect(fronds).toContain(frond1)
    expect(fronds).not.toContain(trunk)
  })

  it('returns an empty array when nothing matches', () => {
    const root = new THREE.Group()
    root.add(new THREE.Mesh())

    expect(findMeshesByPrefix(root, 'Curtain')).toHaveLength(0)
  })
})
