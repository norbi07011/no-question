/* =========================================================
   NO QUESTION EVENTS — "Gear" scroll story (home)
   Three pieces of stage gear on a studio pedestal. Scrolling
   takes each one apart into its components (exploded view with
   callouts), puts it back together and hands over to the next:
   microphone → headphones → drum kit.
   Real-time three.js (r147), studio lighting + reflections.
   ========================================================= */
(function () {
  "use strict";
  var sec = document.getElementById("nqGear");
  if (!sec || !window.THREE) return;
  var THREE = window.THREE;
  var canvas = document.getElementById("gearCanvas"), labelsBox = sec.querySelector(".gear__labels");
  var I18N = window.NQ_I18N || {};
  function t(k) { var l = document.documentElement.lang || "nl"; return ((I18N[l] || {})[k]) || ((I18N.nl || {})[k]) || ""; }
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOBILE = Math.min(innerWidth, innerHeight) < 700 || window.matchMedia("(pointer: coarse)").matches;

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance" }); }
  catch (e) { sec.classList.add("gear--nogl"); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x060609, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x060609, 8, 17);
  var cam = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

  /* ---------- helpers ---------- */
  function C(h) { return new THREE.Color(h).convertSRGBToLinear(); }
  function V(x, y, z) { return new THREE.Vector3(x, y, z); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sm(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function eo(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function lathe(pts, seg) { return new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg || 64); }
  function cvTex(w, h, draw, srgb) {
    var c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    var tx = new THREE.CanvasTexture(c); if (srgb !== false) tx.encoding = THREE.sRGBEncoding; tx.anisotropy = 8; return tx;
  }

  /* ---------- studio environment (reflections) ---------- */
  (function () {
    var env = new THREE.Scene();
    var room = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 30), new THREE.MeshBasicMaterial({ color: 0x050507, side: THREE.BackSide }));
    env.add(room);
    function panel(w, h, x, y, z, ry, rx, k, col) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col || 0xffffff).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); env.add(m);
    }
    panel(10, 3, 0, 7.8, 0, 0, Math.PI / 2, 5);          // top softbox
    panel(4, 9, -12, 3, 2, Math.PI / 2, 0, 2.2);           // left strip
    panel(4, 9, 12, 3, -3, -Math.PI / 2, 0, 1.6, 0xb8c4ff);// right strip (cool)
    panel(12, 2, 0, 1, -14, 0, 0, 0.8, 0xffd9b0);          // warm back bounce
    var pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.035).texture;
    pm.dispose();
  })();

  /* ---------- lights ---------- */
  var key = new THREE.SpotLight(0xffffff, 2.2, 20, 0.3, 0.8, 1.4); key.position.set(0.6, 8, 3.2); key.target.position.set(0, 1, 0);
  scene.add(key, key.target);
  var rimA = new THREE.DirectionalLight(0x8a7bff, 1.1); rimA.position.set(-5, 3, -4); scene.add(rimA);
  var rimB = new THREE.DirectionalLight(0x3de08a, 0.0); rimB.position.set(5, 2.5, -3); scene.add(rimB);
  scene.add(new THREE.HemisphereLight(0x9aa0c0, 0x050505, 0.12));

  /* ---------- stage: pedestal, floor pool, light cone, dust ---------- */
  var accent = new THREE.Color(0x8a7bff);
  var floorTex = cvTex(512, 512, function (g, w, h) {
    var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(0.35, "rgba(255,255,255,.16)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var pool = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), new THREE.MeshBasicMaterial({ map: floorTex, transparent: true, depthWrite: false, color: 0x9aa0b8, opacity: 0.26 }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.001; scene.add(pool);
  var floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshBasicMaterial({ color: 0x060609 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  var pedMat = new THREE.MeshPhysicalMaterial({ color: 0x0d0d12, roughness: 0.28, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.18 });
  var ped = new THREE.Mesh(lathe([[0, 0], [1.75, 0], [1.8, 0.04], [1.8, 0.2], [1.72, 0.26], [0, 0.26]], 96), pedMat); scene.add(ped);
  var ringMat = new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(2.4), toneMapped: false });
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.79, 0.012, 8, 160), ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; scene.add(ring);
  // soft light cone from the top
  var coneMat = new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(0.75, 0.78, 1) }, uI: { value: 0.18 } },
    vertexShader: "varying float vY; varying vec3 vN; varying vec3 vW; void main(){ vY=uv.y; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }",
    fragmentShader: "uniform vec3 uC; uniform float uI; varying float vY; varying vec3 vN; varying vec3 vW; void main(){ vec3 V=normalize(cameraPosition-vW); float f=pow(abs(dot(normalize(vN),V)),2.); gl_FragColor=vec4(uC*uI*f*pow(vY,1.6),1.); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
  var cone = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 2.2, 8, 48, 1, true), coneMat); cone.position.set(0, 4.1, 0); scene.add(cone);
  // dust in the beam
  var dustN = MOBILE ? 140 : 260, dpos = new Float32Array(dustN * 3);
  for (var i = 0; i < dustN; i++) { var a = Math.random() * 6.28, r = Math.random() * 1.9; dpos[i * 3] = Math.cos(a) * r; dpos[i * 3 + 1] = Math.random() * 6.5; dpos[i * 3 + 2] = Math.sin(a) * r; }
  var dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  var dot = cvTex(64, 64, function (g) { var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  var dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.035, map: dot, transparent: true, depthWrite: false, opacity: 0.55, blending: THREE.AdditiveBlending, color: 0xdfe4ff }));
  scene.add(dust);

  /* ---------- materials ---------- */
  var M = {
    chrome: new THREE.MeshStandardMaterial({ color: 0xe8e8ee, metalness: 1, roughness: 0.12 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xb9bcc6, metalness: 1, roughness: 0.32 }),
    blackMetal: new THREE.MeshStandardMaterial({ color: 0x17171b, metalness: 0.75, roughness: 0.42 }),
    satin: new THREE.MeshPhysicalMaterial({ color: 0x0f0f13, metalness: 0.2, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd8a94a, metalness: 1, roughness: 0.22 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xc8744a, metalness: 1, roughness: 0.3 }),
    foam: new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 1, metalness: 0 }),
    leather: new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.5, sheen: 0.4 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.75, metalness: 0 }),
    shell: new THREE.MeshPhysicalMaterial({ color: 0x050507, roughness: 0.15, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 }),
    head: new THREE.MeshStandardMaterial({ color: 0xe9e6dd, roughness: 0.55, metalness: 0 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0xc89b45, metalness: 1, roughness: 0.26, side: THREE.DoubleSide }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x1f6b3c, roughness: 0.5, metalness: 0.2 })
  };
  // woven steel grille (alpha map → real see-through wire mesh)
  var meshTex = cvTex(256, 256, function (g, w, h) {
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h); g.strokeStyle = "#fff"; g.lineWidth = 34;
    for (var k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * w, 0); g.lineTo(k * w + w, h); g.stroke(); g.beginPath(); g.moveTo(k * w + w, 0); g.lineTo(k * w, h); g.stroke(); }
  }, false);
  meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping; meshTex.repeat.set(26, 13);
  M.grille = new THREE.MeshStandardMaterial({ color: 0xd9dbe2, metalness: 1, roughness: 0.28, alphaMap: meshTex, alphaTest: 0.5, side: THREE.DoubleSide });
  // printed brand on the mic body / headphone plates / bass drum
  function printTex(w, h, bg, draw) { return cvTex(w, h, function (g) { g.fillStyle = bg; g.fillRect(0, 0, w, h); draw(g, w, h); }); }
  var logoImg = new Image(); if (window.NQ_LOGO) logoImg.src = window.NQ_LOGO;
  var bodyTex = printTex(1024, 256, "#141418", function (g, w, h) {
    g.fillStyle = "rgba(255,255,255,.9)"; g.font = "800 56px Unbounded, Arial Black, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.save(); g.translate(w * 0.5, h * 0.22); g.fillText("NO QUESTION", 0, 0); g.restore();
  });
  M.body = new THREE.MeshPhysicalMaterial({ map: bodyTex, metalness: 0.65, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4 });
  var kickTex = printTex(1024, 1024, "#0a0a0c", function (g, w, h) {
    g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2, w * 0.46, 0, 6.29); g.stroke();
  });
  function drawLogoOn(tex, w, h, x, y, lw) {
    var go = function () { var c = tex.image, g = c.getContext("2d"), r = logoImg.width / logoImg.height || 3.7, lh = lw / r; g.drawImage(logoImg, x - lw / 2, y - lh / 2, lw, lh); tex.needsUpdate = true; };
    if (logoImg.complete && logoImg.naturalWidth) go(); else logoImg.addEventListener("load", go);
  }
  drawLogoOn(kickTex, 1024, 1024, 512, 560, 640);
  var plateTex = printTex(512, 512, "#101014", function (g, w, h) {
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h / 2, w * 0.44, 0, 6.29); g.stroke();
  });
  drawLogoOn(plateTex, 512, 512, 256, 256, 330);

  /* ---------- parts system ---------- */
  function Product(name) { this.g = new THREE.Group(); this.inner = new THREE.Group(); this.g.add(this.inner); this.parts = []; this.name = name; scene.add(this.g); }
  Product.prototype.part = function (obj, off, opt) {
    opt = opt || {};
    var p = new THREE.Group(); p.add(obj); this.inner.add(p);
    var rec = { o: p, home: p.position.clone(), off: off, rot: opt.rot || V(0, 0, 0), delay: opt.delay || 0, label: opt.label || null, anchor: opt.anchor || V(0, 0, 0), side: opt.side || 0 };
    this.parts.push(rec); return rec;
  };
  Product.prototype.explode = function (e) {
    this.parts.forEach(function (r) {
      var k = eo((e - r.delay) / (1 - r.delay * 0.6));
      r.k = k;
      r.o.position.set(r.off.x * k, r.off.y * k, r.off.z * k);
      r.o.rotation.set(r.rot.x * k, r.rot.y * k, r.rot.z * k);
    });
  };
  function mesh(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); return m; }
  function grp() { var g = new THREE.Group(); for (var i = 0; i < arguments.length; i++) g.add(arguments[i]); return g; }

  /* ===== 1. MICROPHONE (built along +Y, laid on its side) ===== */
  var mic = new Product("mic");
  (function () {
    var Y0 = 2.18;                                                          // grille centre
    var ball = []; for (var a = 0; a <= 16; a++) { var th = a / 16 * Math.PI * 0.62; ball.push([Math.sin(th) * 0.52 + 0.0001, Y0 + Math.cos(th) * 0.52]); }
    ball.push([0.5, Y0 - 0.36]);
    var grille = mesh(lathe(ball.reverse(), 72), M.grille);
    var band = mesh(lathe([[0.49, Y0 - 0.44], [0.515, Y0 - 0.43], [0.52, Y0 - 0.33], [0.5, Y0 - 0.3]], 72), M.chrome);
    var foam = mesh(new THREE.SphereGeometry(0.45, 40, 28), M.foam, 0, Y0 - 0.03, 0); foam.scale.set(1, 0.92, 1);
    var cap = grp(
      mesh(lathe([[0.001, 1.47], [0.3, 1.47], [0.31, 1.52], [0.31, 1.84], [0.29, 1.9], [0.001, 1.9]], 64), M.satin),
      mesh(lathe([[0.3, 1.82], [0.325, 1.83], [0.325, 1.9], [0.3, 1.91]], 64), M.gold),
      mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.012, 48), M.gold, 0, 1.915, 0),
      mesh(lathe([[0.001, 1.92], [0.2, 1.92], [0.12, 1.98], [0.001, 2.0]], 48), M.foam)
    );
    var mount = mesh(lathe([[0.3, 1.32], [0.345, 1.32], [0.35, 1.36], [0.35, 1.44], [0.33, 1.47], [0.3, 1.47]], 64), M.steel);
    var bodyG = lathe([[0.001, -0.02], [0.215, -0.02], [0.24, 0.1], [0.3, 0.95], [0.335, 1.24], [0.34, 1.32], [0.001, 1.32]], 72);
    var body = mesh(bodyG, M.body);
    var xlr = grp(
      mesh(lathe([[0.001, -0.3], [0.2, -0.3], [0.212, -0.26], [0.212, -0.02], [0.001, -0.02]], 48), M.chrome),
      mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 12), M.gold, 0.08, -0.38, 0),
      mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 12), M.gold, -0.06, -0.38, 0.05),
      mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 12), M.gold, -0.04, -0.38, -0.07)
    );
    mic.part(grp(grille, band), V(0, 1.45, 0), { label: "gear.m1", anchor: V(0, 2.62, 0) });
    mic.part(foam, V(0, 0.9, 0), { delay: 0.05, label: "gear.m2", anchor: V(0, 2.2, 0.42) });
    mic.part(cap, V(0, 0.42, 0), { delay: 0.1, label: "gear.m3", anchor: V(0, 1.75, 0.3) });
    mic.part(mount, V(0, 0.05, 0), { delay: 0.14, label: "gear.m4", anchor: V(0, 1.4, 0.35) });
    mic.part(body, V(0, -0.45, 0), { delay: 0.08, label: "gear.m5", anchor: V(0, 0.6, 0.29) });
    mic.part(xlr, V(0, -1.0, 0), { delay: 0.16, label: "gear.m6", anchor: V(0, -0.3, 0.2) });
    mic.inner.position.y = -1.18;            // centre the assembled mic on its pivot
    mic.g.rotation.z = Math.PI / 2 - 0.08;   // lying, grille to the left
    mic.base = { y: 1.35, s: 0.92 };
  })();

  /* ===== 2. HEADPHONES ===== */
  var hp = new Product("hp");
  (function () {
    var arc = []; for (var a = 0; a <= 40; a++) { var th = Math.PI * (a / 40); arc.push(V(Math.cos(th) * 1.08, 0.55 + Math.sin(th) * 1.0, 0)); }
    var band = grp(
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), 120, 0.075, 16, false), M.leather),
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc.slice(6, 35).map(function (v) { return v.clone().multiplyScalar(0.94).add(V(0, 0.07, 0)); })), 90, 0.05, 12, false), M.rubber)
    );
    hp.part(band, V(0, 0.55, 0), { label: "gear.h1", anchor: V(0, 1.55, 0.05) });
    [-1, 1].forEach(function (s) {
      var slider = grp(mesh(new THREE.BoxGeometry(0.06, 0.42, 0.11), M.steel, 1.08 * s, 0.38, 0), mesh(new THREE.BoxGeometry(0.1, 0.12, 0.14), M.blackMetal, 1.08 * s, 0.6, 0));
      var yoke = mesh(new THREE.TorusGeometry(0.47, 0.022, 10, 48, Math.PI), M.steel, 1.08 * s, -0.25, 0); yoke.rotation.y = Math.PI / 2;
      var cupG = lathe([[0.001, 0], [0.4, 0], [0.43, 0.04], [0.44, 0.16], [0.4, 0.24], [0.001, 0.24]], 64);
      var cup = mesh(cupG, M.satin); cup.rotation.z = s * -Math.PI / 2;
      var plate = mesh(new THREE.CircleGeometry(0.3, 48), new THREE.MeshPhysicalMaterial({ map: plateTex, metalness: 0.5, roughness: 0.35, clearcoat: 1 }));
      plate.position.x = s * 0.245; plate.rotation.y = s * Math.PI / 2;
      var cupG2 = grp(cup, plate); cupG2.position.set(1.13 * s, -0.25, 0);
      var driver = grp(
        mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.05, 48), M.blackMetal),
        mesh(lathe([[0.04, 0.03], [0.29, 0.03], [0.26, 0.07], [0.06, 0.12], [0.001, 0.13]], 48), M.copper),
        mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 24), M.chrome, 0, -0.05, 0),
        mesh(new THREE.BoxGeometry(0.16, 0.012, 0.1), M.pcb, 0, -0.04, 0.18)
      );
      driver.rotation.z = s * Math.PI / 2; driver.position.set(1.0 * s, -0.25, 0);
      var cushion = mesh(new THREE.TorusGeometry(0.31, 0.095, 18, 56), M.leather); cushion.rotation.y = Math.PI / 2; cushion.position.set(0.86 * s, -0.25, 0);
      hp.part(slider, V(0.22 * s, 0.55, 0), { delay: 0.08, label: s < 0 ? "gear.h2" : null, anchor: V(1.08 * s, 0.45, 0.06) });
      hp.part(yoke, V(0.5 * s, 0.1, 0), { delay: 0.12 });
      hp.part(cupG2, V(0.7 * s, 0, 0), { delay: 0.04, rot: V(0, s * 0.35, 0), label: s > 0 ? "gear.h3" : null, anchor: V(1.37 * s, -0.25, 0) });
      hp.part(driver, V(0.22 * s, 0, 0.0), { delay: 0.1, label: s > 0 ? "gear.h4" : null, anchor: V(1.0 * s, -0.25, 0.32) });
      hp.part(cushion, V(-0.32 * s, 0, 0), { delay: 0.14, label: s < 0 ? "gear.h5" : null, anchor: V(0.86 * s, -0.25, 0.38) });
    });
    // coiled cable + gold jack
    var coil = []; for (var a = 0; a <= 360; a++) { var tt = a / 360; coil.push(V(-1.15 + Math.cos(tt * 70) * 0.05 + tt * 0.3, -0.55 - tt * 1.0, Math.sin(tt * 70) * 0.05 + 0.05)); }
    var tail = [V(-0.85, -1.55, 0.05), V(-0.6, -1.85, 0.2), V(-0.1, -1.95, 0.3), V(0.35, -1.8, 0.2)];
    var cable = grp(
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 900, 0.018, 8, false), M.rubber),
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tail), 60, 0.018, 8, false), M.rubber),
      (function () { var j = grp(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 24), M.gold), mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 16), M.gold, 0, 0.2, 0)); j.position.set(0.45, -1.72, 0.2); j.rotation.z = -1.2; return j; })()
    );
    hp.part(cable, V(-0.1, -0.45, 0.1), { delay: 0.18, label: "gear.h6", anchor: V(0.45, -1.72, 0.2) });
    hp.base = { y: 1.3, s: 0.82 };
  })();

  /* ===== 3. DRUM KIT ===== */
  var dk = new Product("drums");
  (function () {
    function drum(r, d, frontMat) {
      var g = new THREE.Group();
      g.add(mesh(new THREE.CylinderGeometry(r, r, d, 64, 1, true), M.shell));
      g.add(mesh(new THREE.CircleGeometry(r * 0.985, 64), M.head, 0, d / 2 + 0.002, 0)); g.children[1].rotation.x = -Math.PI / 2;
      var bot = mesh(new THREE.CircleGeometry(r * 0.985, 64), frontMat || M.head, 0, -d / 2 - 0.002, 0); bot.rotation.x = Math.PI / 2; g.add(bot);
      [d / 2, -d / 2].forEach(function (y) { var h = mesh(new THREE.TorusGeometry(r + 0.012, 0.016, 10, 72), M.chrome, 0, y, 0); h.rotation.x = Math.PI / 2; g.add(h); });
      for (var k = 0; k < 8; k++) { var a = k / 8 * 6.283; g.add(mesh(new THREE.BoxGeometry(0.03, d * 0.55, 0.04), M.chrome, Math.cos(a) * (r + 0.02), 0, Math.sin(a) * (r + 0.02))); }
      return g;
    }
    function cymbal(r) {
      var c = mesh(lathe([[0.001, 0.05], [0.07, 0.045], [0.1, 0.02], [r, -0.03], [r, -0.036], [0.1, 0.012], [0.07, 0.036], [0.001, 0.042]], 72), M.bronze);
      return c;
    }
    function stand(h, x, z) {
      var g = new THREE.Group();
      g.add(mesh(new THREE.CylinderGeometry(0.018, 0.022, h, 12), M.chrome, 0, h / 2, 0));
      for (var k = 0; k < 3; k++) { var a = k / 3 * 6.283; var leg = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), M.chrome, Math.cos(a) * 0.16, 0.13, Math.sin(a) * 0.16); leg.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(leg); }
      g.position.set(x, 0, z); return g;
    }
    var kickFront = new THREE.MeshStandardMaterial({ map: kickTex, roughness: 0.5, metalness: 0 });
    var kick = drum(0.62, 0.5, kickFront); kick.rotation.x = -Math.PI / 2; kick.position.set(0, 0.64, 0);
    var tomL = drum(0.26, 0.22); tomL.position.set(-0.33, 1.42, -0.1); tomL.rotation.set(0.45, 0, 0.18);
    var tomR = drum(0.28, 0.24); tomR.position.set(0.33, 1.44, -0.1); tomR.rotation.set(0.45, 0, -0.18);
    var floorT = grp(drum(0.34, 0.4), stand(0.01, 0, 0)); floorT.position.set(1.08, 0.62, 0.18);
    var snare = drum(0.3, 0.15); snare.position.set(-0.98, 0.95, 0.32); snare.rotation.x = 0.15;
    var hh = grp(cymbal(0.33), (function () { var c = cymbal(0.33); c.rotation.x = Math.PI; c.position.y = -0.07; return c; })()); hh.position.set(-1.55, 1.38, 0.12);
    var crash = cymbal(0.45); crash.position.set(-0.95, 2.05, -0.25); crash.rotation.set(0.35, 0, 0.25);
    var ride = cymbal(0.5); ride.position.set(1.22, 1.9, -0.25); ride.rotation.set(0.35, 0, -0.22);
    var stands = grp(stand(1.36, -1.55, 0.12), stand(0.88, -0.98, 0.32), stand(2.0, -0.95, -0.25), stand(1.85, 1.22, -0.25), mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 10), M.chrome, 0, 1.0, -0.12));
    var pedal = grp(mesh(new THREE.BoxGeometry(0.16, 0.025, 0.42), M.blackMetal, 0, 0.03, 0.62), mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16), M.foam, 0, 0.5, 0.33));
    dk.part(kick, V(0, -0.05, 0.35), { delay: 0.02, label: "gear.k3", anchor: V(0, 0.64, 0.27) });
    dk.part(tomL, V(-0.5, 0.75, 0.15), { delay: 0.06, rot: V(-0.3, 0, 0.3), label: "gear.k2", anchor: V(-0.33, 1.52, 0.05) });
    dk.part(tomR, V(0.5, 0.75, 0.15), { delay: 0.08, rot: V(-0.3, 0, -0.3) });
    dk.part(floorT, V(0.75, 0.15, 0.25), { delay: 0.1, label: "gear.k6", anchor: V(1.08, 0.82, 0.4) });
    dk.part(snare, V(-0.7, 0.25, 0.35), { delay: 0.04, rot: V(0.5, 0, 0), label: "gear.k1", anchor: V(-0.98, 1.03, 0.45) });
    dk.part(hh, V(-0.55, 0.55, 0.2), { delay: 0.12, label: "gear.k4", anchor: V(-1.75, 1.4, 0.12) });
    dk.part(crash, V(-0.45, 0.85, 0.1), { delay: 0.14, rot: V(-0.3, 0, 0.35), label: "gear.k5", anchor: V(-1.2, 2.15, -0.1) });
    dk.part(ride, V(0.55, 0.85, 0.1), { delay: 0.16, rot: V(-0.3, 0, -0.35) });
    dk.part(stands, V(0, -0.02, -0.55), { delay: 0.18 });
    dk.part(pedal, V(0, -0.02, 0.6), { delay: 0.1 });
    dk.inner.position.y = -0.05;
    dk.base = { y: 0.26, s: 0.78 };
  })();
  var P = [mic, hp, dk];
  var ACC = [new THREE.Color(0x8a7bff), new THREE.Color(0x35c759), new THREE.Color(0x4a7bff)];
  var RIM2 = [new THREE.Color(0x5a8bff), new THREE.Color(0xf2e63a), new THREE.Color(0xff3b4e)];

  /* ---------- labels (HTML callouts) ---------- */
  var labels = [];
  P.forEach(function (pr, pi) {
    pr.parts.forEach(function (r, ri) {
      if (!r.label) return;
      var el = document.createElement("div"); el.className = "glabel";
      var n = labels.filter(function (l) { return l.pi === pi; }).length + 1;
      el.innerHTML = '<i class="glabel__dot"></i><span class="glabel__line"></span><span class="glabel__txt"><b>' + (n < 10 ? "0" : "") + n + "</b><strong data-i18n=\"" + r.label + '"></strong><small data-i18n="' + r.label + 's"></small></span>';
      labelsBox.appendChild(el);
      labels.push({ el: el, pi: pi, r: r, txt: el.querySelector(".glabel__txt") });
    });
  });
  function fillLabels() { labels.forEach(function (l) { l.el.querySelector("strong").textContent = t(l.r.label); l.el.querySelector("small").textContent = t(l.r.label + "s"); }); }
  fillLabels();
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-lang]")) setTimeout(fillLabels, 30); });

  /* ---------- chapters / HUD ---------- */
  var chs = Array.prototype.slice.call(sec.querySelectorAll(".gear__ch")), hud = Array.prototype.slice.call(sec.querySelectorAll(".gear__hud button")), num = sec.querySelector(".gear__num"), bar = sec.querySelector(".gear__bar i");
  hud.forEach(function (b, i) { b.addEventListener("click", function () { var top = sec.offsetTop + (i / 3 + 0.12) * (sec.offsetHeight - innerHeight); if (window.NQ_LENIS) window.NQ_LENIS.scrollTo(top, { duration: 1.6 }); else scrollTo({ top: top, behavior: "smooth" }); }); });

  /* ---------- sizing / scroll / pointer ---------- */
  var W = 0, H = 0, landscape = true;
  function size() {
    W = sec.clientWidth; H = innerHeight; landscape = W / H > 1.05;
    renderer.setSize(W, H, false); cam.aspect = W / H;
    cam.fov = landscape ? 30 : 44;
    if (landscape) cam.setViewOffset(W, H, -W * 0.17, 0, W, H); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }
  size(); window.addEventListener("resize", size);
  var prog = 0, sp = 0, visible = false, mx = 0, my = 0, smx = 0, smy = 0;
  function measure() {
    var r = sec.getBoundingClientRect(), tot = r.height - innerHeight;
    prog = clamp(-r.top / Math.max(1, tot), 0, 1); visible = r.top < innerHeight && r.bottom > 0;
    window.NQ_GL_PAUSE = visible && r.bottom > innerHeight * 0.5;
  }
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("pointermove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  var tmp = new THREE.Vector3(), lastCh = -1, clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    measure();
    if (!visible) return;
    var dt = Math.min(0.05, clock.getDelta()), time = clock.elapsedTime;
    sp += (prog - sp) * (reduced ? 1 : 0.12);
    smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;
    var f = sp * 3, ci = Math.min(2, Math.floor(f)), q = f - ci;
    // per product state
    var accentNow = new THREE.Color(), rimNow = new THREE.Color(), wsum = 0;
    P.forEach(function (pr, i) {
      var local = f - i;                                            // <0 before, 0..1 active, >1 after
      var enter = i === 0 ? 1 : sm(-0.1, 0.12, local), exit = i === 2 ? 0 : sm(0.86, 1.02, local);
      var vis = enter * (1 - exit);
      pr.g.visible = vis > 0.002;
      if (!pr.g.visible) return;
      var e = sm(0.14, 0.46, local) * (1 - sm(0.66, 0.84, local));
      pr.explode(e);
      pr.e = e;
      var s = pr.base.s * (0.55 + 0.45 * eo(vis));
      pr.g.scale.setScalar(s);
      pr.g.position.set(0, pr.base.y + (1 - enter) * -0.9 + exit * 1.4 + Math.sin(time * 0.8) * 0.03, 0);
      var spin = (local - 0.4) * 1.1 + (1 - enter) * -2.2 + exit * 2.2;
      if (pr === mic) { pr.g.rotation.set(0.12 + smy * 0.15, -0.35 + spin * 0.6 + smx * 0.4, Math.PI / 2 - 0.08); }
      else pr.g.rotation.set(-0.06 + smy * 0.12 + (pr === dk ? 0.08 : 0), -0.25 + spin * (pr === dk ? 0.45 : 0.7) + smx * 0.45, 0);
      var wgt = Math.max(0, 1 - Math.abs(local - 0.5) * 1.6); wsum += wgt;
      accentNow.r += ACC[i].r * wgt; accentNow.g += ACC[i].g * wgt; accentNow.b += ACC[i].b * wgt;
      rimNow.r += RIM2[i].r * wgt; rimNow.g += RIM2[i].g * wgt; rimNow.b += RIM2[i].b * wgt;
    });
    if (wsum > 0) { accentNow.multiplyScalar(1 / wsum); rimNow.multiplyScalar(1 / wsum); }
    accent.lerp(accentNow, 0.08);
    ringMat.color.copy(accent).multiplyScalar(2.2);
    rimA.color.copy(accent); rimB.color.lerp(rimNow, 0.08); rimB.intensity = 0.9;
    coneMat.uniforms.uC.value.copy(accent).lerp(new THREE.Color(1, 1, 1), 0.65);
    // camera: gentle dolly in while exploded
    var ex = P[ci].e || 0;
    var dist = (landscape ? 10.2 : 12.6) - ex * 0.6;
    cam.position.set(Math.sin(smx * 0.3) * 0.6, 2.1 + smy * -0.3 + ex * 0.15, dist);
    cam.lookAt(0, 1.45, 0);
    // dust drift
    var dp = dg.attributes.position.array;
    for (var d = 0; d < dustN; d++) { dp[d * 3 + 1] += dt * 0.08; if (dp[d * 3 + 1] > 6.5) dp[d * 3 + 1] = 0; }
    dg.attributes.position.needsUpdate = true;
    ring.rotation.z += dt * 0.2;
    renderer.render(scene, cam);
    // labels
    labels.forEach(function (l) {
      var pr = P[l.pi], on = pr.g.visible ? clamp(((pr.e || 0) - 0.72) / 0.2, 0, 1) : 0;
      if (on <= 0.001) { if (l.el.style.opacity !== "0") l.el.style.opacity = "0"; return; }
      l.r.o.updateWorldMatrix(true, false);
      tmp.copy(l.r.anchor).applyMatrix4(l.r.o.matrixWorld);
      // anchors are in product space; parts are offset inside the product group
      tmp.project(cam);
      var x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H;
      var cx = landscape ? W * 0.66 : W * 0.5, side = landscape ? (x < cx ? -1 : 1) : (x < cx ? 1 : -1);
      l.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      l.el.classList.toggle("is-left", side < 0);
      l.el.style.opacity = on.toFixed(3);
    });
    // copy + HUD
    chs.forEach(function (c, i) {
      var local = f - i, k = sm(-0.02, 0.1, local) * (1 - sm(0.84, 0.96, local));
      if (i === 0) k = 1 - sm(0.84, 0.96, local);
      if (i === 2) k = sm(-0.02, 0.1, local);
      c.style.opacity = k.toFixed(3); c.style.transform = "translate3d(0," + ((1 - k) * 30).toFixed(1) + "px,0)";
      c.classList.toggle("is-on", k > 0.5);
    });
    if (ci !== lastCh) { lastCh = ci; hud.forEach(function (b, i) { b.classList.toggle("is-on", i === ci); }); if (num) num.textContent = "0" + (ci + 1); }
    if (bar) bar.style.transform = "scaleX(" + sp.toFixed(4) + ")";
  }
  measure(); requestAnimationFrame(frame);
})();
