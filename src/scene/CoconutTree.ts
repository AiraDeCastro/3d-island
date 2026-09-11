import * as THREE from 'three'
import { loadModel, findMeshesByPrefix } from './assetLoader'
import { applyWindSway } from '../systems/applyWindSway'
import type { WindUniforms } from '../systems/WindSystem'
import treeUrl from '../../assets/models/coconut-tree.glb?url'

// Must match the frond `length` in tools/blender/build_coconut_tree.py.
const FROND_LENGTH = 1.7

let cachedTemplate: Promise<THREE.Group> | null = null

function loadTemplate(): Promise<THREE.Group> {
  cachedTemplate ??= loadModel(treeUrl)
  return cachedTemplate
}

export interface CoconutTreeOptions {
  windUniforms: WindUniforms
  /** Wind-sway phase offset so trees planted together don't move in lockstep. */
  phaseOffset?: number
}

/**
 * Clones the Blender-authored coconut tree (tools/blender/build_coconut_tree.py)
 * and wires its fronds to the shared wind via applyWindSway. Authored geometry
 * loads once and is cloned per placement — see Island.ts.
 */
export async function createCoconutTree(options: CoconutTreeOptions): Promise<THREE.Group> {
  const template = await loadTemplate()
  const tree = template.clone(true)

  const fronds = findMeshesByPrefix(tree, 'Frond')
  if (fronds.length > 0) {
    const material = (fronds[0].material as THREE.MeshStandardMaterial).clone()
    applyWindSway(material, options.windUniforms, {
      maxHeight: FROND_LENGTH,
      phaseOffset: options.phaseOffset ?? Math.random() * Math.PI * 2,
    })
    for (const frond of fronds) {
      frond.material = material
    }
  }

  return tree
}
