uniform sampler2D uHeightMap;
uniform vec2 uHeightMapTexel;
uniform float uDisplacementScale;
uniform float uSandRadius;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

// The plane geometry has its rotation baked into its vertex data (see
// Island.ts), so local `position.xz` already lines up with world ground
// coordinates — no rotation to account for here.
vec2 worldToUv(vec2 xz) {
  return xz / (uSandRadius * 2.0) + 0.5;
}

void main() {
  vec2 uvC = worldToUv(position.xz);
  vec2 stepX = vec2(uHeightMapTexel.x * uSandRadius * 2.0, 0.0);
  vec2 stepZ = vec2(0.0, uHeightMapTexel.y * uSandRadius * 2.0);

  float hC = texture2D(uHeightMap, uvC).x;
  float hX = texture2D(uHeightMap, worldToUv(position.xz + stepX)).x;
  float hZ = texture2D(uHeightMap, worldToUv(position.xz + stepZ)).x;

  vec3 pC = vec3(position.x, hC * uDisplacementScale, position.z);
  vec3 pX = vec3(position.x + stepX.x, hX * uDisplacementScale, position.z);
  vec3 pZ = vec3(position.x, hZ * uDisplacementScale, position.z + stepZ.y);

  vec3 normal = normalize(cross(pZ - pC, pX - pC));

  vec4 worldPosition = modelMatrix * vec4(pC, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
