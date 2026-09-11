import * as THREE from 'three'
import type { WindUniforms } from './WindSystem'

export interface WindSwayOptions {
  /** Local-space distance from the anchor to the free tip/hem. */
  maxHeight: number
  /** Sway phase so identical assets don't move in lockstep. */
  phaseOffset?: number
  /**
   * +1 for something that extends *up* from its anchor (a frond: base at
   * local y=0, tip at +maxHeight). -1 for something that *hangs down* from
   * its anchor (a curtain: top at local y=0, hem at -maxHeight).
   */
  sign?: 1 | -1
  strength?: number
}

/**
 * Injects wind sway into a standard PBR material via onBeforeCompile,
 * rather than replacing it with a fully custom ShaderMaterial — this way
 * Blender-authored foliage/cloth still gets real lighting (specular,
 * ambient response) instead of the flat hand-rolled shading the earlier
 * procedural trees used.
 *
 * The sway amount comes straight from the vertex's local Y position, so
 * no custom per-vertex attribute needs to survive the glTF export — see
 * the module docstring in the Blender build scripts under tools/blender/.
 */
export function applyWindSway(
  material: THREE.MeshStandardMaterial,
  wind: WindUniforms,
  options: WindSwayOptions,
): void {
  const sign = options.sign ?? 1
  const strength = options.strength ?? 0.35

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindDirection = wind.uWindDirection
    shader.uniforms.uWindStrength = wind.uWindStrength
    shader.uniforms.uWindTime = wind.uWindTime
    shader.uniforms.uPhaseOffset = { value: options.phaseOffset ?? Math.random() * Math.PI * 2 }
    shader.uniforms.uMaxHeight = { value: options.maxHeight }
    shader.uniforms.uSwaySign = { value: sign }
    shader.uniforms.uSwayStrength = { value: strength }

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec2 uWindDirection;
        uniform float uWindStrength;
        uniform float uWindTime;
        uniform float uPhaseOffset;
        uniform float uMaxHeight;
        uniform float uSwaySign;
        uniform float uSwayStrength;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float swayT = clamp((uSwaySign * position.y) / uMaxHeight, 0.0, 1.0);
        swayT *= swayT;
        float windPhase = uWindTime * 2.2 + uPhaseOffset;
        float gust = sin(windPhase) * 0.6 + sin(windPhase * 2.3 + 1.7) * 0.4;
        vec2 sway = normalize(uWindDirection) * (gust * uWindStrength * swayT * uSwayStrength);
        transformed.x += sway.x;
        transformed.z += sway.y;
        transformed.y += abs(gust) * swayT * 0.05 * uWindStrength * uSwaySign;`,
      )
  }

  // Materials are cached/compiled by a key three.js derives from their
  // properties; onBeforeCompile alone doesn't change that key, so force a
  // fresh program per material instance (each frond/curtain gets its own
  // material already, via GLTFLoader, so this doesn't cross-contaminate).
  material.customProgramCacheKey = () => `${material.uuid}-wind-sway`
}
