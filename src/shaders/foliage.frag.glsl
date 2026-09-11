precision mediump float;

uniform vec3 uBaseColor;
uniform vec3 uTipColor;

varying vec2 vUv;

void main() {
  vec3 color = mix(uBaseColor, uTipColor, vUv.y);
  gl_FragColor = vec4(color, 1.0);
}
