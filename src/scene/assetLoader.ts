import * as THREE from 'three'

// GLTFLoader + DRACOLoader are dynamically imported rather than sitting in
// the main bundle: Lighthouse measured them contributing real parse/compile
// time to the initial script evaluation even though model loading itself
// was already async (see the same reasoning applied to SSAOPass in
// main.ts). Memoized so the loader is only built once regardless of how
// many models request it.
let loaderPromise: ReturnType<typeof buildLoader> | null = null

async function buildLoader() {
  const [{ GLTFLoader }, { DRACOLoader, DRACO_GLTF_CONFIG }] = await Promise.all([
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/loaders/DRACOLoader.js'),
  ])

  // DRACO_GLTF_CONFIG points at the decoder files three.js ships with itself
  // (three/examples/jsm/libs/draco/gltf/); Vite bundles them as ordinary
  // hashed assets, so decoding stays entirely on our own static host with no
  // separate copy step and no CDN dependency, per PLANNING.md.
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(DRACO_GLTF_CONFIG)

  const gltfLoader = new GLTFLoader()
  gltfLoader.setDRACOLoader(dracoLoader)
  return gltfLoader
}

function getLoader() {
  loaderPromise ??= buildLoader()
  return loaderPromise
}

/** Loads a (possibly Draco-compressed) glTF/GLB and returns its root scene graph. */
export async function loadModel(url: string): Promise<THREE.Group> {
  const gltfLoader = await getLoader()
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
