precision highp float;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uFoamColor;
uniform float uTime;
uniform sampler2D uSandHeightMap;
uniform float uSandRadius;
uniform float uSandDisplacementScale;
uniform float uOceanLevel;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
  vec3 color = mix(uDeepColor, uShallowColor, fresnel);

  vec3 halfDir = normalize(normalize(uSunDirection) + viewDir);
  float specular = pow(max(dot(normal, halfDir), 0.0), 80.0);
  color += uSunColor * specular * 0.6;

  // Shoreline reacts to the sand's own height field, not just distance —
  // dig a trench near the water and it floods; pile sand up and it recedes.
  vec2 shoreUv = clamp(vWorldPosition.xz / (uSandRadius * 2.0) + 0.5, 0.0, 1.0);
  float sandSurfaceY = texture2D(uSandHeightMap, shoreUv).x * uSandDisplacementScale;

  float distFromCenter = length(vWorldPosition.xz);
  float shoreDist = distFromCenter - uSandRadius;

  float edgeWetness = 1.0 - smoothstep(-0.4, 1.6, shoreDist);
  float floodWetness = smoothstep(0.05, -0.1, sandSurfaceY - uOceanLevel) * (1.0 - smoothstep(-1.0, 0.6, shoreDist));
  float wetness = clamp(edgeWetness + floodWetness, 0.0, 1.0);

  float foamPhase = sin(uTime * 0.6 - distFromCenter * 1.5) * 0.5 + 0.5;
  float foamCenter = uSandRadius + (foamPhase - 0.5) * 0.6;
  float foam = smoothstep(0.22, 0.0, abs(distFromCenter - foamCenter)) * step(shoreDist, 1.0);

  color = mix(color, uFoamColor, wetness * 0.35);
  color = mix(color, uFoamColor, foam);

  gl_FragColor = vec4(color, 1.0);
}
