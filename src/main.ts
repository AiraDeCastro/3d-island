import './style.css'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { createIslandTrees, SAND_RADIUS, OCEAN_RADIUS, OCEAN_LEVEL } from './scene/Island'
import { createSky } from './scene/Sky'
import { createCamera, createControls } from './scene/Camera'
import { WindSystem } from './systems/WindSystem'
import { SandSystem } from './systems/SandSystem'
import { OceanSystem } from './systems/OceanSystem'

const canvas = document.querySelector<HTMLCanvasElement>('#app')!
canvas.style.touchAction = 'none' // single-finger drag shapes sand; don't let the page scroll instead

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1

const scene = new THREE.Scene()

const wind = new WindSystem()

const sand = new SandSystem(renderer, { radius: SAND_RADIUS, oceanLevel: OCEAN_LEVEL })
const ocean = new OceanSystem({
  radius: OCEAN_RADIUS,
  level: OCEAN_LEVEL,
  sandRadius: SAND_RADIUS,
  sandDisplacementScale: sand.displacementScale,
  getSandHeightTexture: () => sand.heightMapTexture,
})
scene.add(sand.mesh, sand.particles.points, ocean.mesh)
scene.add(createIslandTrees(wind.uniforms))

const { dome, sunLight } = createSky()
scene.add(dome, sunLight)
scene.add(new THREE.AmbientLight(0xffffff, 0.4))

const sunDirection = sunLight.position.clone().normalize()
sand.setSun(sunDirection, sunLight.color)
ocean.setSun(sunDirection, sunLight.color)

const camera = createCamera(window.innerWidth / window.innerHeight)
const controls = createControls(camera, canvas)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(new OutputPass())

function resize() {
  const width = window.innerWidth
  const height = window.innerHeight
  if (width === 0 || height === 0) return // e.g. a transient layout pass with no viewport yet

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  composer.setSize(width, height)
}
window.addEventListener('resize', resize)

// --- Pointer-driven sand shaping -------------------------------------
// Left-click / one-finger drags the sand; the camera (see Camera.ts) only
// answers to the right button or a two-finger gesture, so the two never
// fight over the same gesture.

const raycaster = new THREE.Raycaster()
const pointerNdc = new THREE.Vector2()
let sandDragging = false

function updatePointerNdc(event: PointerEvent) {
  const rect = canvas.getBoundingClientRect()
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function raycastSand(): THREE.Vector3 | null {
  raycaster.setFromCamera(pointerNdc, camera)
  const hits = raycaster.intersectObject(sand.mesh, false)
  return hits.length > 0 ? hits[0].point : null
}

canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return
  updatePointerNdc(event)
  const point = raycastSand()
  if (point) {
    sandDragging = true
    canvas.setPointerCapture(event.pointerId)
    sand.onPointerDrag(point)
  }
})

canvas.addEventListener('pointermove', (event) => {
  if (!sandDragging) return
  updatePointerNdc(event)
  const point = raycastSand()
  if (point) sand.onPointerDrag(point)
})

function endSandDrag() {
  if (!sandDragging) return
  sandDragging = false
  sand.onPointerUp()
}

canvas.addEventListener('pointerup', endSandDrag)
canvas.addEventListener('pointercancel', endSandDrag)
canvas.addEventListener('pointerleave', endSandDrag)

// --- Render loop --------------------------------------------------------

const timer = new THREE.Timer()
timer.connect(document)

function animate() {
  requestAnimationFrame(animate)
  timer.update()
  const delta = timer.getDelta()

  wind.update(delta)
  sand.update(delta)
  ocean.update(delta)
  controls.update(delta)

  composer.render()
}
animate()
