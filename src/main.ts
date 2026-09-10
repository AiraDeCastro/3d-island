import './style.css'
import { createScene } from './scene/createScene'
import * as THREE from 'three'

const canvas = document.querySelector<HTMLCanvasElement>('#app')!

const { scene, camera } = createScene(window.innerWidth / window.innerHeight)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

renderer.render(scene, camera)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.render(scene, camera)
})
