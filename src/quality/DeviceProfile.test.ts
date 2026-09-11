import { describe, expect, it } from 'vitest'
import { chooseQualityTier, getQualityProfile } from './DeviceProfile'

describe('chooseQualityTier', () => {
  it('picks low for a touch-primary (coarse pointer) device', () => {
    expect(chooseQualityTier({ hardwareConcurrency: 8, isCoarsePointer: true })).toBe('low')
  })

  it('picks low for a device with very few cores, even with a fine pointer', () => {
    expect(chooseQualityTier({ hardwareConcurrency: 2, isCoarsePointer: false })).toBe('low')
  })

  it('picks high for a capable desktop', () => {
    expect(chooseQualityTier({ hardwareConcurrency: 8, isCoarsePointer: false })).toBe('high')
  })
})

describe('getQualityProfile', () => {
  it('gives the low tier a smaller pixel ratio cap and coarser meshes than high', () => {
    const low = getQualityProfile('low')
    const high = getQualityProfile('high')

    expect(low.pixelRatioCap).toBeLessThan(high.pixelRatioCap)
    expect(low.sandSegments).toBeLessThan(high.sandSegments)
    expect(low.oceanSegments).toBeLessThan(high.oceanSegments)
  })

  it('only enables SSAO on the high tier', () => {
    expect(getQualityProfile('high').ssaoEnabled).toBe(true)
    expect(getQualityProfile('low').ssaoEnabled).toBe(false)
  })
})
