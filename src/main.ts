import './style.css'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
// SSAOPass is dynamically imported below (see ensureSsaoPass) — it's only
// ever used on the high quality tier, and Lighthouse measured it adding
// ~700ms of parse/compile blocking time to *every* load, including
// low-tier devices that were never going to enable it.
import type { SSAOPass as SSAOPassType } from 'three/addons/postprocessing/SSAOPass.js'
import { createIslandTrees, createIslandHut, SAND_RADIUS, OCEAN_RADIUS, OCEAN_LEVEL } from './scene/Island'
import { createSky } from './scene/Sky'
import { createCamera, createControls as createCameraControls } from './scene/Camera'
import { WindSystem } from './systems/WindSystem'
import { SandSystem } from './systems/SandSystem'
import { OceanSystem } from './systems/OceanSystem'
import { AudioSystem } from './systems/AudioSystem'
import { detectCapabilities, chooseQualityTier, getQualityProfile, type QualityTier } from './quality/DeviceProfile'
import { mountControls } from './ui/Controls'
import { mountHintOverlay } from './ui/HintOverlay'

const canvas = document.querySelector<HTMLCanvasElement>('#app')!
canvas.style.touchAction = 'none' // single-finger drag shapes sand; don't let the page scroll instead

// Some embedding contexts (a not-yet-laid-out iframe, a backgrounded PWA
// launch, certain mobile browser chrome transitions) can report a
// momentarily zero-sized viewport. Clamping to at least 1px keeps every
// render target/pass valid from the very first frame instead of hitting
// "framebuffer incomplete: attachment has zero size" until the next
// resize event corrects it.
function currentViewportSize() {
  return {
    width: Math.max(window.innerWidth, 1),
    height: Math.max(window.innerHeight, 1),
  }
}

let qualityTier: QualityTier = chooseQualityTier(detectCapabilities())
let profile = getQualityProfile(qualityTier)

const initialSize = currentViewportSize()

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(initialSize.width, initialSize.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1

const scene = new THREE.Scene()

const wind = new WindSystem()

// Mesh density is decided once from the auto-detected profile — changing
// it later would mean rebuilding these meshes, which the quality toggle
// deliberately doesn't do (see DeviceProfile.ts).
const sand = new SandSystem(renderer, {
  radius: SAND_RADIUS,
  oceanLevel: OCEAN_LEVEL,
  segments: profile.sandSegments,
})
const ocean = new OceanSystem({
  radius: OCEAN_RADIUS,
  level: OCEAN_LEVEL,
  sandRadius: SAND_RADIUS,
  sandDisplacementScale: sand.displacementScale,
  getSandHeightTexture: () => sand.heightMapTexture,
  segments: profile.oceanSegments,
})
scene.add(sand.mesh, sand.particles.points, ocean.mesh)

// The grove and hut load Blender-authored glTF models over the network —
// don't block the rest of the scene (already interactive) on that; they
// pop in once ready, same spirit as the PRD's <3s time-to-interactive
// budget applying to the *experience*, not every last asset.
createIslandTrees(wind.uniforms).then((grove) => scene.add(grove))
createIslandHut(wind.uniforms).then((hut) => scene.add(hut))

const { dome, sunLight } = createSky()
scene.add(dome, sunLight)
scene.add(new THREE.AmbientLight(0xffffff, 0.4))

const sunDirection = sunLight.position.clone().normalize()
sand.setSun(sunDirection, sunLight.color)
ocean.setSun(sunDirection, sunLight.color)

const camera = createCamera(initialSize.width / initialSize.height)
const cameraControls = createCameraControls(camera, canvas)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

// Threshold kept high so only real highlights (sun glint, foam crests)
// bloom — not the whole bright sky/sand.
const bloomPass = new UnrealBloomPass(new THREE.Vector2(initialSize.width, initialSize.height), 0.5, 0.4, 0.85)
bloomPass.enabled = profile.bloomEnabled
composer.addPass(bloomPass)

composer.addPass(new OutputPass())

let ssaoPass: SSAOPassType | null = null
let ssaoLoading: Promise<SSAOPassType> | null = null

/** Lazily imports, builds, and inserts SSAOPass the first time it's actually needed. */
function ensureSsaoPass(): Promise<SSAOPassType> {
  ssaoLoading ??= import('three/addons/postprocessing/SSAOPass.js').then(({ SSAOPass }) => {
    const { width, height } = currentViewportSize()
    const pass = new SSAOPass(scene, camera, width, height)
    composer.insertPass(pass, 1) // right after RenderPass, before bloom/output
    ssaoPass = pass
    return pass
  })
  return ssaoLoading
}

if (profile.ssaoEnabled) {
  void ensureSsaoPass().then((pass) => {
    pass.enabled = true
  })
}

function resize() {
  const { width, height } = currentViewportSize()

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  composer.setSize(width, height)
  ssaoPass?.setSize(width, height)
}
window.addEventListener('resize', resize)

// --- Audio ---------------------------------------------------------------

const audio = new AudioSystem()
audio.start()

// --- Controls & hint overlay ----------------------------------------------

const hint = mountHintOverlay()

mountControls({
  initialMuted: false,
  initialQualityTier: qualityTier,
  onMuteToggle: (muted) => audio.setMuted(muted),
  onQualityToggle: (tier) => {
    qualityTier = tier
    profile = getQualityProfile(tier)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap))
    bloomPass.enabled = profile.bloomEnabled
    if (profile.ssaoEnabled) {
      void ensureSsaoPass().then((pass) => {
        pass.enabled = true
      })
    } else if (ssaoPass) {
      ssaoPass.enabled = false
    }
  },
})

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
    hint.dismiss()
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
  audio.update(wind.uniforms.uWindStrength.value)
  cameraControls.update(delta)

  composer.render()
}
animate()
