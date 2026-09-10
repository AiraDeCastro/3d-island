import { describe, expect, it } from 'vitest'
import { createSky } from './Sky'

describe('createSky', () => {
  it('places the sun above the horizon for a positive elevation', () => {
    const { sunLight } = createSky(35, -35)
    expect(sunLight.position.y).toBeGreaterThan(0)
  })

  it('places the sun below the horizon for a negative elevation', () => {
    const { sunLight } = createSky(-10, -35)
    expect(sunLight.position.y).toBeLessThan(0)
  })

  it('names the dome and sun so they can be found in the scene graph', () => {
    const { dome, sunLight } = createSky()
    expect(dome.name).toBe('sky')
    expect(sunLight.name).toBe('sun')
  })
})
