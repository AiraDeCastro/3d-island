import * as THREE from 'three'
import { loadModel, findMeshesByPrefix } from './assetLoader'
import { applyWindSway } from '../systems/applyWindSway'
import type { WindUniforms } from '../systems/WindSystem'
import hutUrl from '../../assets/models/beach-hut.glb?url'

// Must match the curtain `height` in tools/blender/build_beach_hut.py.
const CURTAIN_HEIGHT = 1.3

let cachedTemplate: Promise<THREE.Group> | null = null

function loadTemplate(): Promise<THREE.Group> {
  cachedTemplate ??= loadModel(hutUrl)
  return cachedTemplate
}

export interface HutOptions {
  windUniforms: WindUniforms
  phaseOffset?: number
}

/**
 * Clones the Blender-authored beach hut (tools/blender/build_beach_hut.py),
 * wires its doorway curtain to the shared wind, and adds a warm point light
 * for the dusk interior glow — the curtain is the only rigid-body exception,
 * hanging from its anchor rather than rising from one, hence `sign: -1`.
 */
export async function createBeachHut(options: HutOptions): Promise<THREE.Group> {
  const template = await loadTemplate()
  const hut = template.clone(true)

  const [curtain] = findMeshesByPrefix(hut, 'Curtain')
  if (curtain) {
    const material = (curtain.material as THREE.MeshStandardMaterial).clone()
    applyWindSway(material, options.windUniforms, {
      maxHeight: CURTAIN_HEIGHT,
      phaseOffset: options.phaseOffset ?? Math.random() * Math.PI * 2,
      sign: -1,
    })
    curtain.material = material
  }

  const glow = new THREE.PointLight(0xffb066, 1.2, 3.5, 2)
  glow.position.set(0, 1.6, 0.2)
  glow.name = 'hut-glow'
  hut.add(glow)

  return hut
}
