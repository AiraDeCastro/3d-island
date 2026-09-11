import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/addons/loaders/DRACOLoader.js'

const dracoLoader = new DRACOLoader()
// DRACO_GLTF_CONFIG points at the decoder files three.js ships with itself
// (three/examples/jsm/libs/draco/gltf/); Vite bundles them as ordinary
// hashed assets, so decoding stays entirely on our own static host with no
// separate copy step and no CDN dependency, per PLANNING.md.
dracoLoader.setDecoderPath(DRACO_GLTF_CONFIG)

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/** Loads a (possibly Draco-compressed) glTF/GLB and returns its root scene graph. */
export async function loadModel(url: string): Promise<THREE.Group> {
  const gltf = await gltfLoader.loadAsync(url)
  return gltf.scene
}

/** Finds every mesh in a loaded model whose node name starts with `prefix`. */
export function findMeshesByPrefix(root: THREE.Object3D, prefix: string): THREE.Mesh[] {
  const matches: THREE.Mesh[] = []
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name.startsWith(prefix)) {
      matches.push(child)
    }
  })
  return matches
}
