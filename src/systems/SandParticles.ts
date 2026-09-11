import * as THREE from 'three'
import vertexShader from '../shaders/sandParticle.vert.glsl?raw'
import fragmentShader from '../shaders/sandParticle.frag.glsl?raw'

const MAX_PARTICLES = 200
const GRAVITY = -2.4
const LIFETIME = 0.6

/**
 * A small fixed-size pool of billboarded points, kicked up when a drag
 * across the sand moves fast enough. Cheap enough at this count to update
 * on the CPU each frame rather than earning its own GPU pass.
 */
export class SandParticles {
  readonly points: THREE.Points

  private readonly positions: Float32Array
  private readonly velocities: Float32Array
  private readonly ages: Float32Array
  private cursor = 0

  constructor(color: THREE.ColorRepresentation = 0xe4d4a3) {
    this.positions = new Float32Array(MAX_PARTICLES * 3)
    this.velocities = new Float32Array(MAX_PARTICLES * 3)
    this.ages = new Float32Array(MAX_PARTICLES).fill(LIFETIME)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geometry.setAttribute('aAge', new THREE.BufferAttribute(this.ages, 1))
    geometry.setAttribute('aLifetime', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES).fill(LIFETIME), 1))

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uColor: { value: new THREE.Color(color) } },
      transparent: true,
      depthWrite: false,
    })

    this.points = new THREE.Points(geometry, material)
    this.points.frustumCulled = false
  }

  spawnBurst(origin: THREE.Vector3, count: number): void {
    for (let i = 0; i < count; i++) {
      const index = this.cursor
      this.cursor = (this.cursor + 1) % MAX_PARTICLES

      const angle = Math.random() * Math.PI * 2
      const speed = 0.4 + Math.random() * 0.6

      this.positions[index * 3] = origin.x
      this.positions[index * 3 + 1] = origin.y
      this.positions[index * 3 + 2] = origin.z

      this.velocities[index * 3] = Math.cos(angle) * speed
      this.velocities[index * 3 + 1] = 1.1 + Math.random() * 0.7
      this.velocities[index * 3 + 2] = Math.sin(angle) * speed

      this.ages[index] = 0
    }
  }

  update(delta: number): void {
    const position = this.points.geometry.getAttribute('position') as THREE.BufferAttribute
    const age = this.points.geometry.getAttribute('aAge') as THREE.BufferAttribute

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.ages[i] >= LIFETIME) continue

      this.ages[i] += delta
      this.velocities[i * 3 + 1] += GRAVITY * delta

      this.positions[i * 3] += this.velocities[i * 3] * delta
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * delta
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * delta

      age.array[i] = this.ages[i]
    }

    position.needsUpdate = true
    age.needsUpdate = true
  }
}
