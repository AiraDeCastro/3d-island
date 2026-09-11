import * as THREE from 'three'
import vertexShader from '../shaders/water.vert.glsl?raw'
import fragmentShader from '../shaders/water.frag.glsl?raw'

/** (directionX, directionZ, steepness, wavelength) per Gerstner component. */
const WAVES: [number, number, number, number][] = [
  [1, 0.4, 0.2, 3.2],
  [0.3, -1, 0.14, 2.1],
  [-0.6, 0.7, 0.1, 1.2],
]

export interface OceanSystemOptions {
  radius: number
  level: number
  sandRadius: number
  sandDisplacementScale: number
  segments?: number
  deepColor?: THREE.ColorRepresentation
  shallowColor?: THREE.ColorRepresentation
  foamColor?: THREE.ColorRepresentation
  /** Ping-pong render targets mean this texture reference changes frame to frame. */
  getSandHeightTexture: () => THREE.Texture
}

/**
 * The open ocean: a Gerstner-wave surface with a Fresnel reflect/refract
 * blend, plus a shoreline band that samples the sand system's own height
 * field so wet-sand/foam react to whatever the visitor has dug or piled.
 */
export class OceanSystem {
  readonly mesh: THREE.Mesh

  private readonly material: THREE.ShaderMaterial
  private readonly getSandHeightTexture: () => THREE.Texture

  constructor(options: OceanSystemOptions) {
    const segments = options.segments ?? 128
    const geometry = new THREE.PlaneGeometry(options.radius * 2, options.radius * 2, segments, segments)
    geometry.rotateX(-Math.PI / 2)

    this.getSandHeightTexture = options.getSandHeightTexture

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaveA: { value: new THREE.Vector4(...WAVES[0]) },
        uWaveB: { value: new THREE.Vector4(...WAVES[1]) },
        uWaveC: { value: new THREE.Vector4(...WAVES[2]) },
        uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
        uSunColor: { value: new THREE.Color(0xffffff) },
        uDeepColor: { value: new THREE.Color(options.deepColor ?? 0x0d4b52) },
        uShallowColor: { value: new THREE.Color(options.shallowColor ?? 0x3fa79c) },
        uFoamColor: { value: new THREE.Color(options.foamColor ?? 0xeef6ee) },
        uSandHeightMap: { value: this.getSandHeightTexture() },
        uSandRadius: { value: options.sandRadius },
        uSandDisplacementScale: { value: options.sandDisplacementScale },
        uOceanLevel: { value: options.level },
      },
    })

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.name = 'ocean'
    this.mesh.position.y = options.level
  }

  setSun(direction: THREE.Vector3, color: THREE.Color): void {
    this.material.uniforms.uSunDirection.value.copy(direction)
    this.material.uniforms.uSunColor.value.copy(color)
  }

  update(delta: number): void {
    this.material.uniforms.uTime.value += delta
    this.material.uniforms.uSandHeightMap.value = this.getSandHeightTexture()
  }
}
