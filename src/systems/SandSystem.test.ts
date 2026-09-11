import { describe, expect, it } from 'vitest'
import { decayMultiplier, worldToSandUv } from './SandSystem'

describe('worldToSandUv', () => {
  it('maps the disc center to uv (0.5, 0.5)', () => {
    const uv = worldToSandUv(4, 0, 0)
    expect(uv.x).toBeCloseTo(0.5)
    expect(uv.y).toBeCloseTo(0.5)
  })

  it('maps the positive edge of the disc to uv 1', () => {
    const uv = worldToSandUv(4, 4, 0)
    expect(uv.x).toBeCloseTo(1)
  })

  it('maps the negative edge of the disc to uv 0', () => {
    const uv = worldToSandUv(4, 0, -4)
    expect(uv.y).toBeCloseTo(0)
  })
})

describe('decayMultiplier', () => {
  it('is 1 (no decay) at zero delta', () => {
    expect(decayMultiplier(0)).toBeCloseTo(1)
  })

  it('is frame-rate independent: two half-steps equal one full step', () => {
    const half = decayMultiplier(0.5)
    const full = decayMultiplier(1)
    expect(half * half).toBeCloseTo(full, 10)
  })

  it('leaves only a small fraction of height after about a minute', () => {
    expect(decayMultiplier(60)).toBeLessThan(0.06)
  })
})
