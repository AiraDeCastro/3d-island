attribute float aSway;

uniform vec2 uWindDirection;
uniform float uWindStrength;
uniform float uWindTime;
uniform float uPhaseOffset;

varying vec2 vUv;

void main() {
  vUv = uv;

  float phase = uWindTime * 2.2 + uPhaseOffset;
  float gust = sin(phase) * 0.6 + sin(phase * 2.3 + 1.7) * 0.4;

  vec3 displaced = position;
  vec2 sway = normalize(uWindDirection) * (gust * uWindStrength * aSway * 0.35);
  displaced.x += sway.x;
  displaced.z += sway.y;
  displaced.y += abs(gust) * aSway * 0.05 * uWindStrength;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
