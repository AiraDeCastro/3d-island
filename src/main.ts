import './style.css'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { createIsland } from './scene/Island'
import { createSky } from './scene/Sky'
import { createCamera, createControls } from './scene/Camera'

const canvas = document.querySelector<HTMLCanvasElement>('#app')!

const scene = new THREE.Scene()
scene.add(createIsland())

const { dome, sunLight } = createSky()
scene.add(dome, sunLight)
scene.add(new THREE.AmbientLight(0xffffff, 0.4))

const camera = createCamera(window.innerWidth / window.innerHeight)
const controls = createControls(camera, canvas)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(new OutputPass())

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', resize)

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  controls.update(clock.getDelta())
  composer.render()
}
animate()
