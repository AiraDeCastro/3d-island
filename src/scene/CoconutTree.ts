import * as THREE from 'three'
import vertexShader from '../shaders/foliage.vert.glsl?raw'
import fragmentShader from '../shaders/foliage.frag.glsl?raw'
import type { WindUniforms } from '../systems/WindSystem'

const FROND_COUNT = 7
const TRUNK_HEIGHT = 3.2
const TRUNK_RADIUS_BASE = 0.12
const TRUNK_RADIUS_TOP = 0.07

export interface CoconutTreeOptions {
  windUniforms: WindUniforms
  /** Natural trunk tilt in radians — real palms rarely grow straight. */
  lean?: number
  /** Wind-sway phase offset so trees planted together don't move in lockstep. */
  phaseOffset?: number
  scale?: number
}

/**
 * A stylized low-poly palm, built procedurally rather than from an authored
 * asset — there's no modeling pipeline (Blender/Draco export) wired up yet,
 * so this stands in until real art assets replace it. Fronds carry an
 * `aSway` attribute (0 at the base, 1 at the tip) that foliage.vert.glsl
 * uses to bend them in the shared wind.
 */
export function createCoconutTree(options: CoconutTreeOptions): THREE.Group {
  const scale = options.scale ?? 1
  const lean = options.lean ?? 0.08

  const group = new THREE.Group()
  group.name = 'coconut-tree'

  const trunkGeometry = new THREE.CylinderGeometry(
    TRUNK_RADIUS_TOP * scale,
    TRUNK_RADIUS_BASE * scale,
    TRUNK_HEIGHT * scale,
    7,
  )
  trunkGeometry.translate(0, (TRUNK_HEIGHT * scale) / 2, 0)
  const trunk = new THREE.Mesh(trunkGeometry, new THREE.MeshStandardMaterial({ color: 0x8a6b4a, roughness: 0.9 }))
  trunk.rotation.z = lean
  trunk.name = 'trunk'
  group.add(trunk)

  const crownOrigin = new THREE.Vector3(
    Math.sin(lean) * TRUNK_HEIGHT * scale,
    Math.cos(lean) * TRUNK_HEIGHT * scale,
    0,
  )

  const frondGeometry = createFrondGeometry(1.6 * scale, 0.5 * scale, 0.9 * scale)
  const frondMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      uWindDirection: options.windUniforms.uWindDirection,
      uWindStrength: options.windUniforms.uWindStrength,
      uWindTime: options.windUniforms.uWindTime,
      uPhaseOffset: { value: options.phaseOffset ?? Math.random() * Math.PI * 2 },
      uBaseColor: { value: new THREE.Color(0x2f6b3a) },
      uTipColor: { value: new THREE.Color(0x7fbf6a) },
    },
  })

  for (let i = 0; i < FROND_COUNT; i++) {
    const frond = new THREE.Mesh(frondGeometry, frondMaterial)
    frond.name = 'frond'
    frond.position.copy(crownOrigin)
    frond.rotation.y = (i / FROND_COUNT) * Math.PI * 2
    frond.rotation.x = -Math.PI / 2.6
    group.add(frond)
  }

  const coconutGeometry = new THREE.SphereGeometry(0.12 * scale, 8, 6)
  const coconutMaterial = new THREE.MeshStandardMaterial({ color: 0x5b3a24, roughness: 0.8 })
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2
    const coconut = new THREE.Mesh(coconutGeometry, coconutMaterial)
    coconut.name = 'coconut'
    coconut.position.set(
      crownOrigin.x + Math.cos(angle) * 0.15 * scale,
      crownOrigin.y - 0.05 * scale,
      crownOrigin.z + Math.sin(angle) * 0.15 * scale,
    )
    group.add(coconut)
  }

  return group
}

function createFrondGeometry(length: number, width: number, droop: number, segments = 6): THREE.BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const sway: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const y = t * length - droop * t * t
    const w = (width * (1 - t * 0.85)) / 2

    positions.push(-w, y, 0, w, y, 0)
    uvs.push(0, t, 1, t)
    sway.push(t, t)

    if (i < segments) {
      const a = i * 2
      const b = i * 2 + 1
      const c = i * 2 + 2
      const d = i * 2 + 3
      indices.push(a, b, c, b, d, c)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
