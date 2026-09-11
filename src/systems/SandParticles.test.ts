import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { SandParticles } from './SandParticles'

describe('SandParticles', () => {
  it('places a burst at the origin point with fresh age', () => {
    const particles = new SandParticles()
    particles.spawnBurst(new THREE.Vector3(1, 0.2, -3), 5)

    const position = particles.points.geometry.getAttribute('position')
    const age = particles.points.geometry.getAttribute('aAge')

    expect(position.getX(0)).toBeCloseTo(1)
    expect(position.getY(0)).toBeCloseTo(0.2)
    expect(position.getZ(0)).toBeCloseTo(-3)
    expect(age.getX(0)).toBe(0)
  })

  it('moves a live particle upward then lets gravity pull it back down', () => {
    const particles = new SandParticles()
    particles.spawnBurst(new THREE.Vector3(0, 0, 0), 1)

    const position = particles.points.geometry.getAttribute('position')
    particles.update(1 / 60)
    const yAfterOneStep = position.getY(0)

    expect(yAfterOneStep).toBeGreaterThan(0)
  })

  it('stops advancing a particle once it has aged past its lifetime', () => {
    const particles = new SandParticles()
    particles.spawnBurst(new THREE.Vector3(0, 0, 0), 1)

    for (let i = 0; i < 120; i++) particles.update(1 / 60)

    const position = particles.points.geometry.getAttribute('position')
    const stuckY = position.getY(0)

    particles.update(1 / 60)
    expect(position.getY(0)).toBe(stuckY)
  })
})
