uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {
  float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
  float t = max(pow(max(h, 0.0), exponent), 0.0);
  gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
}
