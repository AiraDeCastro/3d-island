attribute float aAge;
attribute float aLifetime;

varying float vLifeFraction;

void main() {
  vLifeFraction = clamp(aAge / aLifetime, 0.0, 1.0);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = mix(7.0, 1.0, vLifeFraction) * (40.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
