uniform float uTime;
// Each wave: (directionX, directionZ, steepness, wavelength)
uniform vec4 uWaveA;
uniform vec4 uWaveB;
uniform vec4 uWaveC;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal) {
  float steepness = wave.z;
  float wavelength = wave.w;
  float k = 6.28318530718 / wavelength;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(wave.xy);
  float f = k * (dot(d, p.xz) - c * uTime);
  float a = steepness / k;
  float sinF = sin(f);
  float cosF = cos(f);

  tangent += vec3(-d.x * d.x * steepness * sinF, d.x * steepness * cosF, -d.x * d.y * steepness * sinF);
  binormal += vec3(-d.x * d.y * steepness * sinF, d.y * steepness * cosF, -d.y * d.y * steepness * sinF);

  return vec3(d.x * a * cosF, a * sinF, d.y * a * cosF);
}

void main() {
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);

  vec3 displaced = position;
  displaced += gerstnerWave(uWaveA, position, tangent, binormal);
  displaced += gerstnerWave(uWaveB, position, tangent, binormal);
  displaced += gerstnerWave(uWaveC, position, tangent, binormal);

  vec3 normal = normalize(cross(binormal, tangent));

  vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
