import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const START_POSITION = new THREE.Vector3(9, 7, 12)
const LOOK_TARGET = new THREE.Vector3(0, 0.5, 0)

/** Pure camera setup — no DOM dependency, so it's unit-testable on its own. */
export function createCamera(aspect: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000)
  camera.position.copy(START_POSITION)
  camera.lookAt(LOOK_TARGET)
  return camera
}

/**
 * Damped orbit/pan bound to a canvas, clamped so the island always stays
 * framed: can't dolly inside it, fly above the sky dome, or dip below the
 * sand.
 */
export function createControls(
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
): OrbitControls {
  const controls = new OrbitControls(camera, domElement)
  controls.target.copy(LOOK_TARGET)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 4
  controls.maxDistance = 20
  controls.minPolarAngle = THREE.MathUtils.degToRad(15)
  controls.maxPolarAngle = THREE.MathUtils.degToRad(85)
  controls.update()
  return controls
}
