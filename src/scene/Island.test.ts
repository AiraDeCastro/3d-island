import { describe, expect, it } from 'vitest'
import { HUT_PLACEMENT, SAND_RADIUS, TREE_PLACEMENTS } from './Island'

// createIslandTrees()/createIslandHut() themselves load a glTF over the
// network via GLTFLoader — not something to exercise in a unit test (see
// the same reasoning applied to SandSystem's GPU-bound constructor).
// What's still worth pinning down is the hand-placed layout data itself.

describe('TREE_PLACEMENTS', () => {
  it('keeps every tree within the sand radius', () => {
    for (const placement of TREE_PLACEMENTS) {
      expect(placement.distance).toBeLessThan(SAND_RADIUS)
    }
  })

  it('gives each tree its own yaw so the layout does not look stamped-out', () => {
    const yaws = new Set(TREE_PLACEMENTS.map((p) => p.yaw))
    expect(yaws.size).toBe(TREE_PLACEMENTS.length)
  })
})

describe('HUT_PLACEMENT', () => {
  it('sits within the sand radius, clear of the shoreline', () => {
    expect(HUT_PLACEMENT.distance).toBeLessThan(SAND_RADIUS - 1)
  })

  it("doesn't coincide with any tree's position", () => {
    for (const placement of TREE_PLACEMENTS) {
      const sameSpot =
        Math.abs(placement.angle - HUT_PLACEMENT.angle) < 0.3 &&
        Math.abs(placement.distance - HUT_PLACEMENT.distance) < 0.5
      expect(sameSpot).toBe(false)
    }
  })
})
