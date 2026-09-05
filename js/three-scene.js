// =====================================================
// KOROSH CRM — Illustrated Diorama & Low-Poly Scene
// File: js/three-scene.js
// =====================================================

(() => {
  'use strict';

  let scene, camera, renderer;
  let worldDiorama, buildingModel, carTaxi;
  let isRotating = true;
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let carT = 0;

  function initIllustratedDiorama() {
    const container = document.getElementById('three-model-container');
    if (!container || typeof THREE === 'undefined') return;

    while (container.firstChild) {
      if (container.firstChild.classList?.contains('canvas-vintage-label')) break;
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // ۱. صحنه و دوربین متمرکز ایزومتریک
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0e6d2); // زمینه کاهی لوپلی

    camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(22, 20, 26);
    camera.lookAt(0, 3, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ۲. نورپردازی کارتونی خورشیدی و گرم
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 2.2);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfff3db, 2.8);
    sun.position.set(20, 35, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);

    const softFill = new THREE.DirectionalLight(0xd49a3d, 1.2);
    softFill.position.set(-15, 10, -15);
    scene.add(softFill);

    worldDiorama = new THREE.Group();
    scene.add(worldDiorama);

    // ۳. ساخت دیوراما زمین، خیابان سنگفرش و محوطه
    buildGroundDiorama();

    // ۴. ساخت عمارت فانتزی چندطبقه (برگرفته از عکس ۱)
    buildIllustratedMansion();

    // ۵. تاکسی زرد کارتونی با بسته‌های روی باربند (برگرفته از عکس ۳)
    buildTaxiCar();

    // ۶. رویدادهای ماوس
    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    container.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      worldDiorama.rotation.y += deltaX * 0.008;
      worldDiorama.rotation.x += deltaY * 0.004;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.025;
      camera.position.z = Math.max(16, Math.min(camera.position.z, 50));
    }, { passive: false });

    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    // دکمه‌های کنترل
    const btnSpin = document.getElementById('btnSpin');
    btnSpin?.addEventListener('click', () => {
      isRotating = !isRotating;
      btnSpin.classList.toggle('active', isRotating);
      btnSpin.textContent = isRotating ? 'گردش نما' : 'توقف چرخش';
    });

    const btnReset = document.getElementById('btnCamReset');
    btnReset?.addEventListener('click', () => {
      worldDiorama.rotation.set(0, 0, 0);
      camera.position.set(22, 20, 26);
      camera.lookAt(0, 3, 0);
    });

    animate();
  }

  function buildGroundDiorama() {
    // قطعه زمین خاک دیوراما
    const earthGeo = new THREE.BoxGeometry(17, 1.2, 17);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x4a3d31, roughness: 0.9 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.y = -0.6;
    earth.receiveShadow = true;
    worldDiorama.add(earth);

    // پیاده‌رو آجری روشن
    const pStone = new THREE.Mesh(
      new THREE.BoxGeometry(17, 0.2, 17),
      new THREE.MeshStandardMaterial({ color: 0xe6dec8, roughness: 0.6 })
    );
    pStone.position.y = 0.1;
    pStone.receiveShadow = true;
    worldDiorama.add(pStone);

    // خیابان سنگفرش تیره در جلوی عمارت
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(17, 0.22, 6.2),
      new THREE.MeshStandardMaterial({ color: 0x2e353d, roughness: 0.8 })
    );
    road.position.set(0, 0.11, 4.2);
    road.receiveShadow = true;
    worldDiorama.add(road);

    // درختچه‌های توپی فانتزی
    const treeCoords = [[-6, 0.2, -4.5], [-2, 0.2, -6], [5.5, 0.2, -4], [6, 0.2, 0]];
    treeCoords.forEach(([tx, ty, tz]) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8),
        new THREE.MeshStandardMaterial({ color: 0x5c4033 })
      );
      trunk.position.y = 0.45;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliage = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.85, 1),
        new THREE.MeshStandardMaterial({ color: 0x4f7942, flatShading: true })
      );
      foliage.position.y = 1.35;
      foliage.castShadow = true;
      tree.add(foliage);

      tree.position.set(tx, ty, tz);
      worldDiorama.add(tree);
    });
  }

  function buildIllustratedMansion() {
    buildingModel = new THREE.Group();

    // همکف: کارگاه و مغازه با رنگ صورتی-بنفش رترو
    const gFloor = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 2.5, 5.2),
      new THREE.MeshStandardMaterial({ color: 0x9b5966, roughness: 0.6 })
    );
    gFloor.position.set(-0.6, 1.35, -1.8);
    gFloor.castShadow = true;
    buildingModel.add(gFloor);

    // سایه‌بان مایل بالای شیشه
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.14, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xd98880 })
    );
    awning.rotation.x = Math.PI / 8;
    awning.position.set(-0.6, 2.3, 1.0);
    buildingModel.add(awning);

    // تابلوی سردر آجری قرمز
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.8, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xb84a39, emissive: 0x72281c, emissiveIntensity: 0.4 })
    );
    sign.position.set(-0.6, 2.8, 0.9);
    buildingModel.add(sign);

    // طبقه دو: آجری نارنجی با پنجره‌های دوتایی فیروزه‌ای
    const midFloor = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 2.3, 5.4),
      new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.7 })
    );
    midFloor.position.set(-0.6, 3.65, -1.8);
    midFloor.castShadow = true;
    buildingModel.add(midFloor);

    // طبقه سه: کج و زاویه‌دار فیروزه‌ای پاستلی
    const topFloor = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 2.1, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x16a085, roughness: 0.6 })
    );
    topFloor.position.set(-0.6, 5.75, -1.8);
    topFloor.rotation.z = -0.04;
    topFloor.castShadow = true;
    buildingModel.add(topFloor);

    // سقف نهایی با نرده‌های بام
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.3, 5.5),
      new THREE.MeshStandardMaterial({ color: 0x7f8c8d })
    );
    roof.position.set(-0.6, 6.9, -1.8);
    roof.castShadow = true;
    buildingModel.add(roof);

    worldDiorama.add(buildingModel);
  }

  function buildTaxiCar() {
    carTaxi = new THREE.Group();

    // بدنه خردلی تاکسی
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.85, 1.3),
      new THREE.MeshStandardMaterial({ color: 0xf39c12, roughness: 0.4 })
    );
    body.position.y = 0.6;
    body.castShadow = true;
    carTaxi.add(body);

    // شیشه شیب‌دار کابین
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.75, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.2 })
    );
    cabin.position.set(-0.1, 1.35, 0);
    carTaxi.add(cabin);

    // جعبه‌ها و بارهای روی سقف
    const box1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.45, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xb84a39 })
    );
    box1.position.set(-0.2, 1.95, -0.2);
    box1.castShadow = true;
    carTaxi.add(box1);

    const box2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x4f7942 })
    );
    box2.position.set(0.1, 1.95, 0.25);
    box2.castShadow = true;
    carTaxi.add(box2);

    // چرخ‌ها
    const wGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 14);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const wheelPositions = [[0.65, 0.26, 0.65], [-0.65, 0.26, 0.65], [0.65, 0.26, -0.65], [-0.65, 0.26, -0.65]];
    wheelPositions.forEach(([x, y, z]) => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, y, z);
      carTaxi.add(w);
    });

    worldDiorama.add(carTaxi);
  }

  function animate() {
    requestAnimationFrame(animate);

    // حرکت رفت و برگشتی تاکسی در خیابان
    carT += 0.014;
    const xPos = Math.sin(carT) * 6.5;
    const dir = Math.cos(carT) >= 0 ? 1 : -1;

    carTaxi.position.set(xPos, 0.02, 4.2);
    carTaxi.rotation.y = dir === 1 ? 0 : Math.PI;

    // افکت لرزش کارتونی فنربندی خودرو حین حرکت
    carTaxi.position.y = 0.02 + Math.abs(Math.sin(carT * 8)) * 0.035;

    if (isRotating && !isDragging) {
      worldDiorama.rotation.y += 0.003;
    }

    renderer.render(scene, camera);
  }

  document.addEventListener('DOMContentLoaded', initIllustratedDiorama);
})();