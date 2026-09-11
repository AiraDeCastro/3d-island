import * as THREE from 'three'

export interface WindUniforms {
  uWindDirection: { value: THREE.Vector2 }
  uWindStrength: { value: number }
  uWindTime: { value: number }
}

/**
 * The single shared "weather" clock. Trees, hut cloth, ocean ripple detail,
 * and drifting sand particles all read these uniforms directly rather than
 * animating on their own — see the Wind entry in CLAUDE.md.
 *
 * Strength isn't constant: it rides a slow, layered-sine gust envelope so
 * the wind visibly swells and eases rather than holding one intensity.
 */
export class WindSystem {
  readonly uniforms: WindUniforms

  constructor(direction = new THREE.Vector2(1, 0.35).normalize(), baseStrength = 1) {
    this.uniforms = {
      uWindDirection: { value: direction },
      uWindStrength: { value: baseStrength },
      uWindTime: { value: 0 },
    }
    this.baseStrength = baseStrength
  }

  private readonly baseStrength: number

  update(delta: number): void {
    this.uniforms.uWindTime.value += delta
    this.uniforms.uWindStrength.value = this.baseStrength * gustEnvelope(this.uniforms.uWindTime.value)
  }
}

/** Two out-of-phase sine octaves, kept in [0.2, 1] so the wind never fully dies. */
export function gustEnvelope(time: number): number {
  const slow = Math.sin(time * 0.17)
  const fast = Math.sin(time * 0.53 + 1.3)
  return 0.6 + 0.25 * slow + 0.15 * fast
}
