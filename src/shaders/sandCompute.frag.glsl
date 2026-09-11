// GPGPU pass for the sand height field. `textureHeight` and `resolution`
// are injected automatically by GPUComputationRenderer.

uniform vec2 uBrushUv;
uniform float uBrushActive;
uniform float uBrushRadius;
uniform float uBrushStrength;
uniform float uDecay;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float height = texture2D(textureHeight, uv).x;

  // Relax back toward flat — this is also what erodes old footprints.
  height *= uDecay;

  float dist = distance(uv, uBrushUv);
  float brush = smoothstep(uBrushRadius, 0.0, dist) * uBrushActive * uBrushStrength;
  height = clamp(height + brush, 0.0, 1.0);

  gl_FragColor = vec4(height, 0.0, 0.0, 1.0);
}
