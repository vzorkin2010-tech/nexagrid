import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const palettes = {
  astralab: {
    planetA: "#102a4c",
    planetB: "#37e6ff",
    planetC: "#d8faff",
    accent: "#8df5ff",
    glow: "#2bc8ff",
  },
  orbit: {
    planetA: "#21180d",
    planetB: "#f6d46b",
    planetC: "#fff2bd",
    accent: "#f6d46b",
    glow: "#ffb847",
  },
};

function makeTexture(palette) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, palette.planetA);
  gradient.addColorStop(0.5, palette.planetB);
  gradient.addColorStop(1, palette.planetC);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 950; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 12 + Math.random() * 90;
    const alpha = 0.045 + Math.random() * 0.09;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, 1 + Math.random() * 4, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addStars(scene, count, radius) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = radius * (0.45 + Math.random() * 0.55);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.022,
    transparent: true,
    opacity: 0.78,
  });
  scene.add(new THREE.Points(geometry, material));
}

function ring(radius, color, opacity) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2);
  const points = curve.getPoints(180).map((point) => new THREE.Vector3(point.x, point.y, 0));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.LineLoop(geometry, material);
}

function createPlanetScene(group, palette) {
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 96, 96),
    new THREE.MeshStandardMaterial({
      map: makeTexture(palette),
      roughness: 0.72,
      metalness: 0.04,
    }),
  );
  group.add(planet);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.62, 96, 96),
    new THREE.MeshBasicMaterial({
      color: palette.glow,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(atmosphere);

  for (const [index, radius] of [2.05, 2.48, 2.92].entries()) {
    const orbit = ring(radius, palette.accent, 0.34 - index * 0.07);
    orbit.rotation.x = Math.PI / 2.8 + index * 0.12;
    orbit.rotation.z = index * 0.32;
    group.add(orbit);
  }

  const satellite = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.16, 0.26),
    new THREE.MeshStandardMaterial({ color: 0xf4fbff, roughness: 0.35, metalness: 0.55 }),
  );
  const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x214fff, roughness: 0.45, metalness: 0.35 });
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.2), panelMaterial);
  const rightPanel = leftPanel.clone();
  leftPanel.position.x = -0.38;
  rightPanel.position.x = 0.38;
  satellite.add(body, leftPanel, rightPanel);
  satellite.position.set(2.5, 0.38, 0);
  group.add(satellite);

  return { planet, satellite };
}

function createStationScene(group, palette) {
  const station = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xdce6ee, roughness: 0.32, metalness: 0.65 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xf7c85f, roughness: 0.4, metalness: 0.36 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x1f51a8, roughness: 0.46, metalness: 0.2 });

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.9, 36), metal);
  core.rotation.z = Math.PI / 2;
  station.add(core);

  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.44, 48, 48), gold);
  station.add(hub);

  const ringMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.035, 16, 120),
    new THREE.MeshStandardMaterial({ color: 0xf4f7fa, roughness: 0.28, metalness: 0.7 }),
  );
  ringMesh.rotation.y = Math.PI / 2;
  station.add(ringMesh);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.055, 0.055), metal);
    arm.position.x = side * 0.95;
    station.add(arm);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 0.58), blue);
    panel.position.x = side * 1.62;
    panel.rotation.y = side * 0.2;
    station.add(panel);
  }

  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.34, 48, 1, true), metal);
  dish.position.set(0, -0.88, 0.08);
  dish.rotation.x = Math.PI;
  station.add(dish);

  station.rotation.x = -0.22;
  station.rotation.z = 0.16;
  group.add(station);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 64, 64),
    new THREE.MeshStandardMaterial({ color: 0x8f989f, roughness: 0.92, metalness: 0.02 }),
  );
  moon.position.set(2.15, -1.05, -1.55);
  group.add(moon);

  for (const [index, radius] of [1.75, 2.38, 3.1].entries()) {
    const orbit = ring(radius, palette.accent, 0.35 - index * 0.08);
    orbit.rotation.x = Math.PI / 2.4;
    orbit.rotation.z = 0.4 + index * 0.2;
    group.add(orbit);
  }

  return { station, moon };
}

function setupSpaceCanvas(canvas) {
  const sceneName = canvas.dataset.spaceScene;
  const palette = sceneName === "orbit" ? palettes.orbit : palettes.astralab;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 0.25, 6.4);

  addStars(scene, 1350, 18);
  scene.add(new THREE.AmbientLight(0x9fb4ff, 0.72));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(3.2, 2.8, 4);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(palette.glow, 2.8, 9);
  rimLight.position.set(-3, -1.4, 2.2);
  scene.add(rimLight);

  const group = new THREE.Group();
  scene.add(group);
  const model = sceneName === "orbit" ? createStationScene(group, palette) : createPlanetScene(group, palette);

  let targetX = sceneName === "orbit" ? -0.14 : -0.06;
  let targetY = sceneName === "orbit" ? 0.4 : -0.32;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 720 ? 7.6 : 6.4;
    group.position.x = width > 880 ? 1.15 : 0;
    camera.updateProjectionMatrix();
  }

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    targetY += dx * 0.008;
    targetX += dy * 0.006;
    targetX = Math.max(-0.9, Math.min(0.9, targetX));
  });

  canvas.addEventListener("pointerup", (event) => {
    dragging = false;
    canvas.releasePointerCapture(event.pointerId);
  });

  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  function animate() {
    const elapsed = clock.getElapsedTime();
    group.rotation.x += (targetX - group.rotation.x) * 0.055;
    group.rotation.y += (targetY - group.rotation.y) * 0.055;
    group.rotation.y += dragging ? 0 : 0.0028;

    if (model.planet) {
      model.planet.rotation.y += 0.0035;
      model.satellite.position.x = Math.cos(elapsed * 0.75) * 2.5;
      model.satellite.position.z = Math.sin(elapsed * 0.75) * 2.5;
      model.satellite.position.y = 0.36 + Math.sin(elapsed * 1.3) * 0.12;
      model.satellite.lookAt(0, 0, 0);
    }

    if (model.station) {
      model.station.rotation.y += 0.006;
      model.moon.rotation.y += 0.002;
      model.moon.position.y = -1.05 + Math.sin(elapsed * 0.6) * 0.08;
    }

    renderer.render(scene, camera);
    canvas.dataset.rendered = "true";
    requestAnimationFrame(animate);
  }

  animate();
}

document.querySelectorAll("[data-space-scene]").forEach(setupSpaceCanvas);
