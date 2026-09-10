import * as THREE from 'three'

export interface SceneBundle {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
}

/**
 * Builds the scaffold-stage scene graph: background, lights, camera, and a
 * placeholder box standing in for the island until real terrain lands.
 * Kept free of canvas/renderer setup so it can be unit tested without WebGL.
 */
export function createScene(aspect: number): SceneBundle {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b1a1f)

  const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
  camera.position.set(2, 2, 3)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))

  const sun = new THREE.DirectionalLight(0xffffff, 1.2)
  sun.position.set(3, 4, 2)
  scene.add(sun)

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x3fa79c }),
  )
  scene.add(box)

  return { scene, camera }
}
