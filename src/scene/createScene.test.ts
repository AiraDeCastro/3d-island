import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createScene } from './createScene'

describe('createScene', () => {
  it('sets the camera aspect ratio it was given', () => {
    const { camera } = createScene(16 / 9)
    expect(camera.aspect).toBeCloseTo(16 / 9)
  })

  it('adds exactly one ambient light, one directional light, and one mesh', () => {
    const { scene } = createScene(1)

    const ambientLights = scene.children.filter((c) => c instanceof THREE.AmbientLight)
    const directionalLights = scene.children.filter((c) => c instanceof THREE.DirectionalLight)
    const meshes = scene.children.filter((c) => c instanceof THREE.Mesh)

    expect(ambientLights).toHaveLength(1)
    expect(directionalLights).toHaveLength(1)
    expect(meshes).toHaveLength(1)
  })

  it('points the camera at the origin', () => {
    const { camera } = createScene(1)
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)

    const toOrigin = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize()
    expect(direction.dot(toOrigin)).toBeCloseTo(1, 1)
  })
})
