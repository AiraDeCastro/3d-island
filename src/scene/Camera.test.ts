import { describe, expect, it } from 'vitest'
import { createCamera } from './Camera'

describe('createCamera', () => {
  it('sets the aspect ratio it was given', () => {
    const camera = createCamera(21 / 9)
    expect(camera.aspect).toBeCloseTo(21 / 9)
  })

  it('starts above and back from the island so it opens framed', () => {
    const camera = createCamera(16 / 9)
    expect(camera.position.y).toBeGreaterThan(0)
    expect(camera.position.length()).toBeGreaterThan(4)
  })
})
