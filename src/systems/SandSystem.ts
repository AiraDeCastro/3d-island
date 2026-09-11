import * as THREE from 'three'
import { GPUComputationRenderer, type Variable } from 'three/addons/misc/GPUComputationRenderer.js'
import computeShader from '../shaders/sandCompute.frag.glsl?raw'
import vertexShader from '../shaders/sand.vert.glsl?raw'
import fragmentShader from '../shaders/sand.frag.glsl?raw'
import { SandParticles } from './SandParticles'

const HEIGHT_RESOLUTION = 128
const DISPLACEMENT_SCALE = 0.35
const DECAY_PER_SECOND = 0.95
const BRUSH_RADIUS_UV = 0.05
const BRUSH_STRENGTH_PER_SECOND = 3
const FAST_DRAG_SPEED = 3 // world units/sec above which sand kicks up
const PARTICLES_PER_BURST = 4

/** Converts a world (x, z) point on the sand disc into the height field's UV space. */
export function worldToSandUv(radius: number, x: number, z: number): THREE.Vector2 {
  return new THREE.Vector2(x / (radius * 2) + 0.5, z / (radius * 2) + 0.5)
}

/** Frame-rate-independent multiplier for one frame of exponential decay. */
export function decayMultiplier(delta: number): number {
  return Math.pow(DECAY_PER_SECOND, delta)
}

export interface SandSystemOptions {
  radius: number
  segments?: number
  oceanLevel: number
  sandColor?: THREE.ColorRepresentation
  wetSandColor?: THREE.ColorRepresentation
}

/**
 * Owns the sand height field (a GPGPU ping-pong render target), the mesh
 * that displaces against it, and the particle burst that fires on a fast
 * drag. See the Sand deformation entry in CLAUDE.md — stamping and decay
 * are the same compute pass, not separate systems.
 */
export class SandSystem {
  readonly mesh: THREE.Mesh
  readonly particles: SandParticles
  readonly radius: number

  private readonly gpuCompute: GPUComputationRenderer
  private readonly heightVariable: Variable
  private readonly material: THREE.ShaderMaterial

  private dragging = false
  private dragUv: THREE.Vector2 | null = null
  private lastDragPoint: THREE.Vector3 | null = null

  constructor(renderer: THREE.WebGLRenderer, options: SandSystemOptions) {
    this.radius = options.radius
    const segments = options.segments ?? 96

    this.gpuCompute = new GPUComputationRenderer(HEIGHT_RESOLUTION, HEIGHT_RESOLUTION, renderer)
    const initialTexture = this.gpuCompute.createTexture()
    this.heightVariable = this.gpuCompute.addVariable('textureHeight', computeShader, initialTexture)
    this.gpuCompute.setVariableDependencies(this.heightVariable, [this.heightVariable])

    Object.assign(this.heightVariable.material.uniforms, {
      uBrushUv: { value: new THREE.Vector2(-1, -1) },
      uBrushActive: { value: 0 },
      uBrushRadius: { value: BRUSH_RADIUS_UV },
      uBrushStrength: { value: 0 },
      uDecay: { value: 1 },
    })

    const initError = this.gpuCompute.init()
    if (initError) {
      throw new Error(`SandSystem: GPUComputationRenderer failed to initialize — ${initError}`)
    }

    const geometry = new THREE.PlaneGeometry(this.radius * 2, this.radius * 2, segments, segments)
    geometry.rotateX(-Math.PI / 2)

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uHeightMap: { value: this.currentHeightTexture() },
        uHeightMapTexel: { value: new THREE.Vector2(1 / HEIGHT_RESOLUTION, 1 / HEIGHT_RESOLUTION) },
        uDisplacementScale: { value: DISPLACEMENT_SCALE },
        uSandRadius: { value: this.radius },
        uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
        uSunColor: { value: new THREE.Color(0xffffff) },
        uSandColor: { value: new THREE.Color(options.sandColor ?? 0xd9c48a) },
        uWetSandColor: { value: new THREE.Color(options.wetSandColor ?? 0x8a7248) },
        uOceanLevel: { value: options.oceanLevel },
      },
    })

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.name = 'sand'

    this.particles = new SandParticles(options.sandColor ?? 0xd9c48a)
  }

  get heightMapTexture(): THREE.Texture {
    return this.currentHeightTexture()
  }

  get displacementScale(): number {
    return DISPLACEMENT_SCALE
  }

  setSun(direction: THREE.Vector3, color: THREE.Color): void {
    this.material.uniforms.uSunDirection.value.copy(direction)
    this.material.uniforms.uSunColor.value.copy(color)
  }

  /** Called from the pointer-move handler in main.ts with the raycast hit on the sand plane. */
  onPointerDrag(worldPoint: THREE.Vector3): void {
    this.dragging = true
    this.dragUv = worldToSandUv(this.radius, worldPoint.x, worldPoint.z)

    if (this.lastDragPoint) {
      const distance = this.lastDragPoint.distanceTo(worldPoint)
      // A rough per-event speed proxy: real dt comes from update(), but a
      // sufficiently large single-event jump already means "moving fast".
      if (distance > FAST_DRAG_SPEED / 30) {
        this.particles.spawnBurst(worldPoint, PARTICLES_PER_BURST)
      }
    }
    this.lastDragPoint = worldPoint.clone()
  }

  onPointerUp(): void {
    this.dragging = false
    this.lastDragPoint = null
  }

  update(delta: number): void {
    const uniforms = this.heightVariable.material.uniforms
    uniforms.uDecay.value = decayMultiplier(delta)

    if (this.dragging && this.dragUv) {
      uniforms.uBrushUv.value.copy(this.dragUv)
      uniforms.uBrushActive.value = 1
      uniforms.uBrushStrength.value = BRUSH_STRENGTH_PER_SECOND * delta
    } else {
      uniforms.uBrushActive.value = 0
    }

    this.gpuCompute.compute()
    this.material.uniforms.uHeightMap.value = this.currentHeightTexture()

    this.particles.update(delta)
  }

  private currentHeightTexture(): THREE.Texture {
    return this.gpuCompute.getCurrentRenderTarget(this.heightVariable).texture
  }
}
