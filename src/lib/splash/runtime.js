import * as THREE from "three";
import { buildScene } from "./scene.mjs";
import { retailFog } from "./retail-fog.mjs";
import { retailShadows } from "./retail-shadows.mjs";
import { retailLogo } from "./retail-logo.mjs";
import { chamberVisibility } from "./scenery.mjs";
import {
  normalizationCube,
  roughNormalTexture,
  glowTexture,
  blobMaterial,
  sceneMaterial,
} from "./retail-materials.mjs";
import {
  BlobSimulation,
  makeCamera,
  sampleCamera,
  cameraTime,
  cubeSphere,
  deformSphere,
  clamp,
} from "./simulation.mjs";
import { logoRenderState } from "./fissure-transition.mjs";
import { splashFraming } from "./framing.mjs";

export async function createSplash(canvas, domain, { signal } = {}) {
  const load = async (name) => {
    const response = await fetch(`/splash/${name}.json`, { signal });
    if (!response.ok) throw new Error(`Splash asset ${name} failed to load.`);
    return response.json();
  };
  const [data, meshes, study] = await Promise.all(
    ["retail", "retail-geometry", "dg"].map(load),
  );
  signal?.throwIfAborted();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  try {
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.autoClear = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0);
    const camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.4, 800);
    camera.up.set(0, 0, 1);
    const simulation = new BlobSimulation();
    const cubes = [normalizationCube(64), normalizationCube(256)],
      rough = roughNormalTexture();
    const { objects, advance } = buildScene(
      data,
      (kind) => sceneMaterial(kind, cubes, rough, simulation),
      meshes,
    );
    scene.add(objects);
    for (const mesh of objects.children)
      mesh.onBeforeRender = () => mesh.material.userData.update(mesh);
    const scenery = chamberVisibility(objects);
    const unit = cubeSphere(),
      deformed = new Float32Array(unit.positions.length),
      normals = new Float32Array(unit.positions.length);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(deformed, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setIndex(unit.indices);
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage),
    );
    const largeMaterial = blobMaterial(cubes[0]),
      smallMaterial = blobMaterial(cubes[0], true);
    const blob = new THREE.Mesh(geometry, largeMaterial);
    blob.frustumCulled = false;
    blob.renderOrder = 2;
    scene.add(blob);
    const smallUnit = cubeSphere(4),
      smallGeometry = new THREE.BufferGeometry();
    smallGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(smallUnit.positions, 3),
    );
    smallGeometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(smallUnit.positions, 3),
    );
    smallGeometry.setIndex(smallUnit.indices);
    const small = simulation.bloblets.map(() => {
      const mesh = new THREE.Mesh(smallGeometry, smallMaterial);
      mesh.renderOrder = 3;
      scene.add(mesh);
      return mesh;
    });
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        color: new THREE.Color(160 / 255, 1, 64 / 255),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    halo.renderOrder = 1;
    scene.add(halo);
    const logo = retailLogo(data, {
      custom: study.logo,
      style: "fissure",
      contours: study.polygons,
    });
    logo.setLighting("soft");
    logo.setCenter("soft-split");
    const path = makeCamera(data.cameraPaths[0]);
    logo.group.matrix.makeBasis(
      new THREE.Vector3(...path.x),
      new THREE.Vector3(...path.y),
      new THREE.Vector3(...path.z),
    );
    logo.group.matrix.setPosition(
      new THREE.Vector3(...path.transform([0, -path.offset, 0])),
    );
    logo.group.matrixAutoUpdate = false;
    const fog = retailFog(renderer, scene, camera, objects, simulation, {
      highQuality: true,
    });
    const shadows = retailShadows(renderer, objects, simulation);
    let time = 0,
      disposed = false,
      width = 0,
      height = 0;

    function render(t) {
      if (disposed) return;
      time = t;
      const rect = canvas.getBoundingClientRect();
      const frame = splashFraming(
        rect.width,
        rect.height,
        t,
        window.devicePixelRatio || 1,
      );
      if (rect.width !== width || rect.height !== height) {
        width = rect.width;
        height = rect.height;
        renderer.setPixelRatio(frame.pixelRatio);
        renderer.setSize(width, height, false);
      }
      camera.aspect = frame.aspect;
      camera.fov = frame.fov;
      camera.updateProjectionMatrix();
      domain.style.top = `${frame.domainY}px`;
      domain.style.opacity = clamp((t - 6.5) / 0.3);
      simulation.seek(t);
      deformSphere(unit.positions, simulation, deformed, normals);
      geometry.attributes.position.needsUpdate =
        geometry.attributes.normal.needsUpdate = true;
      const base = simulation.intensity - simulation.pulse;
      largeMaterial.uniforms.intensity.value =
        (0.3 + 4 * (1.2 * base + 0.8 * simulation.pulse)) * Math.min(1, t * 4);
      smallMaterial.uniforms.intensity.value = simulation.intensity;
      const c = logoRenderState(
        sampleCamera(path, cameraTime(t)),
        t,
        "fissure",
      );
      camera.position.set(...c.position);
      camera.lookAt(new THREE.Vector3(...c.target));
      for (let i = 0; i < small.length; i++) {
        const l = simulation.bloblets[i],
          mesh = small[i];
        mesh.position.set(...l.position);
        mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(...l.dir),
        );
        mesh.scale.set(
          l.radius / Math.sqrt(l.wobble),
          l.radius / Math.sqrt(l.wobble),
          l.radius * l.wobble,
        );
        mesh.visible = t >= 0.6 && c.renderScene;
      }
      advance(t);
      objects.visible = c.renderScene && simulation.intensity > 0;
      scenery.update(true);
      blob.visible = halo.visible = c.renderScene && t >= 0.6;
      halo.scale.setScalar(simulation.radius * 10.4);
      halo.material.opacity =
        Math.trunc(clamp(simulation.intensity) * 255) / 255;
      logo.update(t, c);
      if (c.renderScene && simulation.intensity > 0) shadows.update();
      fog.render(t, c, logo.scene);
      canvas.dataset.time = t.toFixed(2);
    }
    const observer = new ResizeObserver(() => render(time));
    observer.observe(canvas);
    function dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      const geometries = new Set(),
        materials = new Set(),
        textures = new Set([...cubes, rough]);
      for (const root of [scene, logo.scene])
        root.traverse((node) => {
          if (node.geometry) geometries.add(node.geometry);
          if (node.userData.geometryHi)
            geometries.add(node.userData.geometryHi);
          if (node.userData.geometryLo)
            geometries.add(node.userData.geometryLo);
          const list = Array.isArray(node.material)
            ? node.material
            : [node.material];
          for (const material of list)
            if (material) {
              materials.add(material);
              for (const value of Object.values(material))
                if (value?.isTexture) textures.add(value);
              for (const uniform of Object.values(material.uniforms || {}))
                if (uniform.value?.isTexture) textures.add(uniform.value);
            }
        });
      fog.dispose();
      shadows.dispose();
      for (const item of [...geometries, ...materials, ...textures])
        item.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
    return { render, dispose };
  } catch (error) {
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }
}

// Audio code and tables load with an active intro; repeat visits skip them.
export async function enableSplashAudio(context, signal) {
  const [{ renderAudio }, response] = await Promise.all([
    import("./audio-engine.mjs"),
    fetch("/splash/retail-audio.json", { signal }),
  ]);
  if (!response.ok) throw new Error("Splash audio failed to load.");
  const audio = renderAudio(await response.json());
  signal.throwIfAborted();
  const buffer = context.createBuffer(2, audio.left.length, audio.sampleRate);
  buffer.copyToChannel(audio.left, 0);
  buffer.copyToChannel(audio.right, 1);
  return buffer;
}
