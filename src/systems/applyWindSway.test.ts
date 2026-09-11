import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { applyWindSway } from './applyWindSway'
import { WindSystem } from './WindSystem'

interface FakeShader {
  uniforms: Record<string, unknown>
  vertexShader: string
}

function fakeShader(): FakeShader {
  return {
    uniforms: {},
    vertexShader: '#include <common>\nvoid main() {\n#include <begin_vertex>\n}',
  }
}

describe('applyWindSway', () => {
  it('wires the material to the shared wind uniforms', () => {
    const wind = new WindSystem()
    const material = new THREE.MeshStandardMaterial()
    applyWindSway(material, wind.uniforms, { maxHeight: 1.5 })

    const shader = fakeShader()
    material.onBeforeCompile!(shader as never, {} as never)

    expect(shader.uniforms.uWindDirection).toBe(wind.uniforms.uWindDirection)
    expect(shader.uniforms.uWindStrength).toBe(wind.uniforms.uWindStrength)
    expect((shader.uniforms.uMaxHeight as { value: number }).value).toBe(1.5)
  })

  it('defaults sign to +1 (sway grows upward from the anchor)', () => {
    const wind = new WindSystem()
    const material = new THREE.MeshStandardMaterial()
    applyWindSway(material, wind.uniforms, { maxHeight: 1.5 })

    const shader = fakeShader()
    material.onBeforeCompile!(shader as never, {} as never)

    expect((shader.uniforms.uSwaySign as { value: number }).value).toBe(1)
  })

  it('accepts sign -1 for something hanging down from its anchor', () => {
    const wind = new WindSystem()
    const material = new THREE.MeshStandardMaterial()
    applyWindSway(material, wind.uniforms, { maxHeight: 1.3, sign: -1 })

    const shader = fakeShader()
    material.onBeforeCompile!(shader as never, {} as never)

    expect((shader.uniforms.uSwaySign as { value: number }).value).toBe(-1)
  })

  it('injects the sway displacement into begin_vertex', () => {
    const wind = new WindSystem()
    const material = new THREE.MeshStandardMaterial()
    applyWindSway(material, wind.uniforms, { maxHeight: 1.5 })

    const shader = fakeShader()
    material.onBeforeCompile!(shader as never, {} as never)

    expect(shader.vertexShader).toContain('swayT')
    expect(shader.vertexShader).toContain('transformed.x += sway.x')
  })

  it('gives each material its own program cache key so instances do not share a compiled shader', () => {
    const wind = new WindSystem()
    const materialA = new THREE.MeshStandardMaterial()
    const materialB = new THREE.MeshStandardMaterial()
    applyWindSway(materialA, wind.uniforms, { maxHeight: 1 })
    applyWindSway(materialB, wind.uniforms, { maxHeight: 1 })

    expect(materialA.customProgramCacheKey!()).not.toBe(materialB.customProgramCacheKey!())
  })
})
