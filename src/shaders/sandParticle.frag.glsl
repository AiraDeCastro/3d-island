precision mediump float;

uniform vec3 uColor;

varying float vLifeFraction;

void main() {
  if (vLifeFraction >= 1.0) discard;

  vec2 fromCenter = gl_PointCoord - vec2(0.5);
  if (length(fromCenter) > 0.5) discard;

  float alpha = (1.0 - vLifeFraction) * 0.85;
  gl_FragColor = vec4(uColor, alpha);
}
