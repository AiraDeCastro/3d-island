import * as THREE from "three";
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { Water } from "https://threejs.org/examples/jsm/objects/Water.js";
import { Sky } from "https://threejs.org/examples/jsm/objects/Sky.js";

const scene = buildScene();
const renderer = buildRenderer();
const camera = buildCamera();
const sky = buildSky(scene);
const sun = buildSun(scene, renderer, sky);
const water = buildWater(scene);

setOrbitControls(camera, renderer);

function buildScene() {
  return new THREE.Scene();
}

function buildCamera() {
  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(30, 30, 100);
  return camera;
}

function buildRenderer() {
  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

function buildSky(scene) {
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);
  return sky;
}

function buildSun(scene, renderer, sky) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sun = new THREE.Vector3();

  const theta = Math.PI * (0.49 - 0.5);
  const phi = 2 * Math.PI * (0.205 - 0.5);
  sun.x = Math.cos(phi);
  sun.y = Math.sin(phi) * Math.sin(theta);
  sun.z = Math.sin(phi) * Math.cos(theta);

  sky.material.uniforms["sunPosition"].value.copy(sun);
  scene.environment = pmremGenerator.fromScene(sky).texture;
  return sun;
}

function buildWater(scene) {
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load("", function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    alpha: 1.0,
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  return water;
}

function setOrbitControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();
}

function update() {
  // Animates our water
  water.material.uniforms["time"].value += 1.0 / 60.0;

  // Finally, render our scene
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

function animate() {
  requestAnimationFrame(animate);
  update();
}
animate();
