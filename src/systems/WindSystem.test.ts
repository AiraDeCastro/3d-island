import { describe, expect, it } from 'vitest'
import { WindSystem, gustEnvelope } from './WindSystem'

describe('gustEnvelope', () => {
  it('never drops to zero or fully stalls the wind', () => {
    for (let t = 0; t < 50; t += 0.37) {
      expect(gustEnvelope(t)).toBeGreaterThan(0.15)
    }
  })

  it('varies over time rather than holding one value', () => {
    const values = [0, 5, 10, 15, 20].map(gustEnvelope)
    const distinct = new Set(values.map((v) => v.toFixed(4)))
    expect(distinct.size).toBeGreaterThan(1)
  })
})

describe('WindSystem', () => {
  it('accumulates uWindTime by the delta passed to update', () => {
    const wind = new WindSystem()
    wind.update(0.5)
    wind.update(0.25)
    expect(wind.uniforms.uWindTime.value).toBeCloseTo(0.75)
  })

  it('scales strength around the configured base rather than a fixed constant', () => {
    const wind = new WindSystem(undefined, 2)
    wind.update(1)
    const first = wind.uniforms.uWindStrength.value
    wind.update(3)
    const second = wind.uniforms.uWindStrength.value

    expect(first).not.toBeCloseTo(second)
    expect(first).toBeGreaterThan(0)
    expect(second).toBeGreaterThan(0)
  })
})
