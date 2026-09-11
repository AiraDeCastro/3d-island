import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { OceanSystem } from './OceanSystem'

function makeTexture() {
  return new THREE.Texture()
}

describe('OceanSystem', () => {
  it('positions the mesh at the configured ocean level', () => {
    const ocean = new OceanSystem({
      radius: 9,
      level: -0.15,
      sandRadius: 4,
      sandDisplacementScale: 0.35,
      getSandHeightTexture: makeTexture,
    })

    expect(ocean.mesh.position.y).toBeCloseTo(-0.15)
  })

  it('advances uTime and re-reads the sand height texture each update', () => {
    const textureA = makeTexture()
    const textureB = makeTexture()
    const getTexture = vi.fn().mockReturnValueOnce(textureA).mockReturnValueOnce(textureB)

    const ocean = new OceanSystem({
      radius: 9,
      level: -0.15,
      sandRadius: 4,
      sandDisplacementScale: 0.35,
      getSandHeightTexture: getTexture,
    })

    const material = ocean.mesh.material as THREE.ShaderMaterial
    expect(material.uniforms.uSandHeightMap.value).toBe(textureA)

    ocean.update(0.5)

    expect(material.uniforms.uTime.value).toBeCloseTo(0.5)
    expect(material.uniforms.uSandHeightMap.value).toBe(textureB)
  })
})
