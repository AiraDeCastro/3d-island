precision highp float;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uSandColor;
uniform vec3 uWetSandColor;
uniform float uSandRadius;
uniform float uOceanLevel;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  float distFromCenter = length(vWorldPosition.xz);
  if (distFromCenter > uSandRadius) discard;

  vec3 normal = normalize(vWorldNormal);
  float diffuse = max(dot(normal, normalize(uSunDirection)), 0.0);

  // Darken toward the shoreline edge and anywhere dug low enough to be wet.
  float shoreline = smoothstep(uSandRadius - 1.4, uSandRadius, distFromCenter);
  float dugWet = smoothstep(0.02, -0.02, vWorldPosition.y - uOceanLevel);
  float wetness = clamp(shoreline + dugWet, 0.0, 1.0);

  vec3 dryLit = uSandColor * (0.45 + 0.55 * diffuse);
  vec3 wetLit = uWetSandColor * (0.55 + 0.45 * diffuse);
  vec3 color = mix(dryLit, wetLit, wetness) * uSunColor;

  gl_FragColor = vec4(color, 1.0);
}
