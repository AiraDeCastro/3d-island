import * as THREE from 'three'
import vertexShader from '../shaders/sky.vert.glsl?raw'
import fragmentShader from '../shaders/sky.frag.glsl?raw'

const SKY_RADIUS = 500

export interface SkyBundle {
  dome: THREE.Mesh
  sunLight: THREE.DirectionalLight
}

/**
 * A vertical-gradient sky dome plus a directional "sun" light positioned by
 * elevation/azimuth. Stands in for a full atmospheric sky model — enough to
 * light the scene and read as a time of day until that's revisited.
 */
export function createSky(elevationDeg = 35, azimuthDeg = -35): SkyBundle {
  const geometry = new THREE.SphereGeometry(SKY_RADIUS, 32, 16)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x2a6f7a) },
      bottomColor: { value: new THREE.Color(0xf3e2b8) },
      offset: { value: 20 },
      exponent: { value: 0.7 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    fog: false,
  })

  const dome = new THREE.Mesh(geometry, material)
  dome.name = 'sky'

  const sunLight = new THREE.DirectionalLight(0xfff1d6, 2)
  sunLight.name = 'sun'
  positionSun(sunLight, elevationDeg, azimuthDeg)

  return { dome, sunLight }
}

function positionSun(light: THREE.DirectionalLight, elevationDeg: number, azimuthDeg: number) {
  const elevation = THREE.MathUtils.degToRad(elevationDeg)
  const azimuth = THREE.MathUtils.degToRad(azimuthDeg)

  light.position
    .set(
      Math.cos(elevation) * Math.cos(azimuth),
      Math.sin(elevation),
      Math.cos(elevation) * Math.sin(azimuth),
    )
    .multiplyScalar(50)
}
