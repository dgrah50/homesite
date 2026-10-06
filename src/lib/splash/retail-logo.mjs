import * as THREE from "three";
import { fissureMaterials } from "./fissure-material.mjs";
import { CRATER_REVEAL_END } from "./fissure-transition.mjs";

export function retailLogo({ custom, preparedField }) {
  const scene = new THREE.Scene(),
    group = new THREE.Group();
  scene.add(group);
  const fissure = fissureMaterials(preparedField),
    materials = [],
    revealMeshes = [];
  for (const [name, a] of Object.entries(custom)) {
    // The website address now supplies the single name below the monogram.
    if (name === "text_0") continue;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(a.positions, 3),
    );
    geometry.setIndex(a.indices);
    if (a.uv) geometry.setAttribute("uv", new THREE.BufferAttribute(a.uv, 2));
    const material = name.includes("interiorfloor")
      ? fissure.floor
      : name.includes("interior")
        ? fissure.interior
        : name.includes("lip")
          ? fissure.lip
          : fissure.surface;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    group.add(mesh);
    materials.push(material);
    revealMeshes.push(mesh);
  }
  group.add(fissure.crater.mesh);
  materials.push(fissure.crater.material);
  return {
    scene,
    group,
    materials,
    setLighting(id) {
      fissure.crater.setLighting(id);
    },
    setCenter(id) {
      fissure.crater.setCenter(id);
    },
    update(t, c) {
      fissure.update(t);
      for (const mesh of revealMeshes) mesh.visible = t < CRATER_REVEAL_END;
      group.visible = c.renderLogo;
    },
  };
}
