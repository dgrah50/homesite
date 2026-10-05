import * as THREE from "three";

// Texture creation only. Pixel generation belongs to the build scripts.
export function normalizationCube(size, pixels) {
  const faces = pixels.map((data) => {
    const face = new THREE.DataTexture(data, size, size);
    face.flipY = false;
    return face;
  });
  const cube = new THREE.CubeTexture(faces);
  cube.minFilter = cube.magFilter = THREE.LinearFilter;
  cube.generateMipmaps = false;
  cube.needsUpdate = true;
  return cube;
}
export function texture(pixels, size, repeat = false) {
  const map = new THREE.DataTexture(pixels, size, size);
  map.minFilter = map.magFilter = THREE.LinearFilter;
  map.generateMipmaps = false;
  map.wrapS = map.wrapT = repeat
    ? THREE.RepeatWrapping
    : THREE.ClampToEdgeWrapping;
  map.needsUpdate = true;
  return map;
}
