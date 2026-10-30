/* =========================================================
   NO QUESTION EVENTS — WebGL scene (Three.js r149)
   A chrome 3D version of the logo, a particle tunnel and
   floating media panels the camera flies through on scroll.
   ========================================================= */
(function () {
  "use strict";
  var canvas = document.getElementById("gl");
  if (!window.THREE || !canvas) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 760px)").matches;
  var MODE = document.body.getAttribute("data-scene") || "home";

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: false, powerPreference: "high-performance" });
  } catch (e) { canvas.style.display = "none"; return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x07070a, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07070a, 0.028);

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 400);
  camera.position.set(0, 0, 14);

  var BRAND = [new THREE.Color("#f2e63a"), new THREE.Color("#35c759"), new THREE.Color("#2e7f8f"), new THREE.Color("#3a3fd6"), new THREE.Color("#8a3cff")];
  function gradColor(t) {
    t = Math.max(0, Math.min(1, t)) * (BRAND.length - 1);
    var i = Math.floor(t), f = t - i;
    var a = BRAND[i], b = BRAND[Math.min(i + 1, BRAND.length - 1)];
    return a.clone().lerp(b, f);
  }

  /* ---------- environment for chrome reflections ---------- */
  var pmrem = new THREE.PMREMGenerator(renderer);
  var envScene = new THREE.Scene();
  var envMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
    fragmentShader: [
      "varying vec3 vP;",
      "void main(){",
      " float y = vP.y; float a = atan(vP.z, vP.x);",
      " vec3 base = mix(vec3(0.02), vec3(0.10), smoothstep(-0.2,1.0,y));",
      " float strip = smoothstep(0.92,1.0, sin(a*3.0)*0.5+0.5);",
      " vec3 c1 = vec3(0.95,0.90,0.23); vec3 c2 = vec3(0.21,0.78,0.35); vec3 c3 = vec3(0.23,0.25,0.84);",
      " vec3 tint = mix(mix(c1,c2,smoothstep(-1.0,0.2,sin(a))), c3, smoothstep(0.0,1.0,cos(a)));",
      " base += tint * strip * 2.2;",
      " base += vec3(1.0) * smoothstep(0.75,1.0,y) * 2.5;",
      " base += tint * smoothstep(-0.2,-0.9,y) * 0.6;",
      " gl_FragColor = vec4(base,1.0);",
      "}"
    ].join("\n")
  });
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), envMat));
  var envRT = pmrem.fromScene(envScene, 0.02);
  scene.environment = envRT.texture;

  /* ---------- 3D logo emblem ---------- */
  var emblem = new THREE.Group();
  var S = 1 / 60, CX = 576, CY = 538;
  function P(x, y) { return new THREE.Vector3((x - CX) * S, -(y - CY) * S, 0); }
  function arc(cx, cy, r, a0, a1, n, out) {
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * (i / n);
      out.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
  }
  // "n"
  var nPts = [], R = 52;
  nPts.push(P(159, 617)); nPts.push(P(159, 560));
  arc(159 + R, 481 + R, R, Math.PI, Math.PI * 1.5, 10, nPts);
  arc(364 - R, 481 + R, R, Math.PI * 1.5, Math.PI * 2, 10, nPts);
  nPts.push(P(364, 560)); nPts.push(P(364, 617));
  // "O" pill
  var oPts = [], r2 = 58.5, cyO = 538.5;
  arc(995 - r2, cyO, r2, -Math.PI / 2, Math.PI / 2, 18, oPts);
  arc(426 + r2, cyO, r2, Math.PI / 2, Math.PI * 1.5, 18, oPts);

  var chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.4 });
  var nCurve = new THREE.CatmullRomCurve3(nPts, false, "centripetal");
  var oCurve = new THREE.CatmullRomCurve3(oPts, true, "centripetal");
  var nMesh = new THREE.Mesh(new THREE.TubeGeometry(nCurve, 160, 0.36, 28, false), chrome);
  var oMesh = new THREE.Mesh(new THREE.TubeGeometry(oCurve, 240, 0.34, 28, true), chrome);
  emblem.add(nMesh, oMesh);
  // caps on the "n" legs
  [P(159, 617), P(364, 617)].forEach(function (p) {
    var cap = new THREE.Mesh(new THREE.CircleGeometry(0.36, 28), chrome);
    cap.position.copy(p); cap.rotation.x = Math.PI / 2; emblem.add(cap);
  });

  // gradient bar inside the O
  var barMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLevel: { value: 0 } },
    vertexShader: "varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
    fragmentShader: [
      "uniform float uTime; uniform float uLevel; varying vec2 vUv; varying vec3 vN;",
      "vec3 grad(float t){",
      " vec3 a=vec3(0.95,0.90,0.23), b=vec3(0.21,0.78,0.35), c=vec3(0.18,0.50,0.56), d=vec3(0.23,0.25,0.84);",
      " return t<0.38? mix(a,b,t/0.38) : t<0.68? mix(b,c,(t-0.38)/0.30) : mix(c,d,(t-0.68)/0.32);",
      "}",
      "void main(){",
      " float t = clamp(vUv.y,0.0,1.0);",
      " vec3 col = grad(t);",
      " float sweep = smoothstep(0.08,0.0,abs(fract(uTime*0.18)-t));",
      " float fres = pow(1.0-abs(vN.z),2.0);",
      " col *= 1.25 + uLevel*1.6; col += sweep*0.9 + fres*0.25;",
      " gl_FragColor = vec4(col,1.0);",
      "}"
    ].join("\n")
  });
  var barLen = (935 - 486) * S, barR = 16 * S;
  var bar = new THREE.Mesh(new THREE.CapsuleGeometry(barR, barLen, 12, 32), barMat);
  bar.rotation.z = -Math.PI / 2; // uv.y runs along length → left (yellow) to right (blue)
  bar.position.copy(P((486 + 935) / 2, 540));
  emblem.add(bar);

  // soft glow behind bar
  function glowTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var g = c.getContext("2d"); var gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    var t = new THREE.CanvasTexture(c); return t;
  }
  var glowTex = glowTexture();
  var glowCols = ["#f2e63a", "#35c759", "#3a3fd6"];
  var glows = [];
  glowCols.forEach(function (c, i) {
    var m = new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    var s = new THREE.Sprite(m);
    s.scale.set(5, 2.6, 1);
    s.position.copy(P(540 + i * 170, 540)); s.position.z = -0.4;
    emblem.add(s); glows.push(s);
  });

  scene.add(emblem);
  var key = new THREE.PointLight(0xffffff, 1.2, 40); key.position.set(4, 6, 8); scene.add(key);

  /* ---------- particle tunnel ---------- */
  var COUNT = isMobile ? 900 : 2200;
  var pGeo = new THREE.BufferGeometry();
  var pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3), rnd = new Float32Array(COUNT);
  for (var i = 0; i < COUNT; i++) {
    var z = 24 - Math.random() * 300;
    var a = Math.random() * Math.PI * 2;
    var rr = 2.5 + Math.pow(Math.random(), 0.6) * 16;
    pos[i * 3] = Math.cos(a) * rr; pos[i * 3 + 1] = Math.sin(a) * rr * 0.75; pos[i * 3 + 2] = z;
    var c = gradColor(((-z + 24) / 300 + Math.random() * 0.25) % 1);
    if (Math.random() < 0.35) c.setRGB(1, 1, 1);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    rnd[i] = Math.random();
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  pGeo.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 1));
  var pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uTime: { value: 0 }, uSize: { value: 26 * renderer.getPixelRatio() }, uLevel: { value: 0 }, uVel: { value: 0 } },
    vertexShader: [
      "attribute float aRnd; uniform float uTime; uniform float uSize; uniform float uLevel; uniform float uVel; varying vec3 vC; varying float vA;",
      "void main(){",
      " vec3 p = position;",
      " float a = uTime*0.05*(0.3+aRnd) ;",
      " p.xy = mat2(cos(a),-sin(a),sin(a),cos(a))*p.xy;",
      " p.y += sin(uTime*0.6 + aRnd*20.0)*0.15;",
      " vec4 mv = modelViewMatrix*vec4(p,1.0);",
      " float d = -mv.z;",
      " gl_PointSize = uSize*(0.25+aRnd*0.75)*(1.0+uLevel*1.5)/max(d,0.5) * (1.0+abs(uVel)*0.6);",
      " vA = smoothstep(120.0,20.0,d)*smoothstep(0.3,2.0,d)*(0.35+aRnd*0.65)*(0.75+0.25*sin(uTime*2.0+aRnd*40.0));",
      " vC = color;",
      " gl_Position = projectionMatrix*mv;",
      "}"
    ].join("\n"),
    fragmentShader: "varying vec3 vC; varying float vA; void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c); float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vC, a*a*vA); }"
  });
  var points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ---------- floating media panels ---------- */
  var mediaList = [] || [
    "assets/img/poster-sarius.jpg", "assets/img/aftermovie-1.jpg", "assets/img/live-teal.jpg", "assets/img/stage-live.jpg",
    "assets/img/holandia.jpg", "assets/img/brand-logo.jpg", "assets/img/interview-street.jpg", "assets/img/night-cut-2.jpg",
    "assets/img/horizons.jpg", "assets/img/banner-crowd.jpg", "assets/img/teaser-bw.jpg", "assets/img/brand-reel.jpg",
    "assets/img/koncert-effenaar.jpg", "assets/img/aftermovie-2.jpg", "assets/img/promo-sarius-bonson-epis.jpg", "assets/img/night-cut-1.jpg",
    "assets/img/backstage-1.jpg", "assets/img/manifest-words.jpg", "assets/img/live-blue.jpg", "assets/img/poster-wide.jpg",
    "assets/img/live-purple.jpg", "assets/img/backstage-2.jpg", "assets/img/tickets-sale.jpg"
  ];
  var panelVS = [
    "uniform float uVel; varying vec2 vUv;",
    "void main(){ vUv = uv; vec3 p = position; p.z += sin(uv.x*3.14159)*uVel*0.6 + sin(uv.y*3.14159)*abs(uVel)*0.3;",
    " gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);} "
  ].join("\n");
  var panelFS = [
    "uniform sampler2D uTex; uniform float uOpacity; uniform float uVel; uniform float uHover; varying vec2 vUv;",
    "void main(){",
    " vec2 uv = vUv; float s = 0.006 + abs(uVel)*0.025;",
    " float r = texture2D(uTex, uv + vec2(s,0.0)).r; float g = texture2D(uTex, uv).g; float b = texture2D(uTex, uv - vec2(s,0.0)).b;",
    " vec3 c = vec3(r,g,b);",
    " vec2 e = smoothstep(vec2(0.0), vec2(0.025), uv) * smoothstep(vec2(0.0), vec2(0.025), 1.0-uv);",
    " float edge = e.x*e.y;",
    " gl_FragColor = vec4(c, uOpacity*edge);",
    "}"
  ].join("\n");
  var loader = new THREE.TextureLoader();
  var panels = [];
  var TUNNEL_START = -18, GAP = isMobile ? 10 : 9.5;
  mediaList.forEach(function (src, i) {
    var mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTex: { value: null }, uOpacity: { value: 0 }, uVel: { value: 0 }, uHover: { value: 0 } },
      vertexShader: panelVS, fragmentShader: panelFS
    });
    var geo = new THREE.PlaneGeometry(1, 1, 16, 16);
    var mesh = new THREE.Mesh(geo, mat);
    var ang = i * 2.399 + 0.6;
    var rad = isMobile ? 3.6 : (MODE === "home" ? 6.4 : 7.6) + (i % 3) * 0.8;
    mesh.userData = { baseX: Math.cos(ang) * rad * (isMobile ? 0.8 : 1.35), baseY: Math.sin(ang) * rad * 0.62, z: TUNNEL_START - i * GAP, spin: (Math.random() - 0.5) * 0.4, ready: false };
    mesh.position.set(mesh.userData.baseX, mesh.userData.baseY, mesh.userData.z);
    mesh.rotation.y = -mesh.userData.baseX * 0.06;
    mesh.rotation.z = mesh.userData.spin * 0.3;
    loader.load(src, function (tex) {
      tex.encoding = THREE.sRGBEncoding; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      mat.uniforms.uTex.value = tex;
      var asp = tex.image.width / tex.image.height;
      var h = asp < 1 ? 4.2 : 3.0; mesh.scale.set(h * asp, h, 1);
      mesh.userData.ready = true;
    });
    scene.add(mesh); panels.push(mesh);
  });
  var TUNNEL_END = TUNNEL_START - mediaList.length * GAP;

  /* ---------- state ---------- */
  var state = { progress: 0, smooth: 0, vel: 0, mx: 0, my: 0, smx: 0, smy: 0, level: 0 };
  window.NQ_SCENE = {
    setProgress: function (p, v) { state.progress = p; state.vel = v || 0; },
    setLevel: function (l) { state.level = l; }
  };
  window.addEventListener("pointermove", function (e) {
    state.mx = (e.clientX / window.innerWidth) * 2 - 1;
    state.my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function layoutEmblem() {
    var wide = window.innerWidth > 1100;
    var mob = window.innerWidth < 760;
    var asp = window.innerWidth / window.innerHeight;
    emblem.userData.heroX = wide ? Math.min(5.8, asp * 3.4) : 0;
    emblem.userData.heroY = mob ? 3.3 : (wide ? -1.4 : 3.0);
    emblem.userData.heroS = mob ? Math.min(0.36, asp * 0.78) : (wide ? 0.5 : 0.5);
  }
  layoutEmblem();

  function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    layoutEmblem();
  }
  window.addEventListener("resize", onResize);

  /* ---------- loop ---------- */
  var clock = new THREE.Clock();
  var oCenterX = ((426 + 995) / 2 - CX) * S; // x of the O centre in emblem space
  var running = true;
  document.addEventListener("visibilitychange", function () { running = !document.hidden; if (running) { clock.getDelta(); tick(); } });

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    if (window.NQ_GL_PAUSE) { clock.getDelta(); return; }
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    state.smooth = reduced ? state.progress : lerp(state.smooth, state.progress, 1 - Math.pow(0.0008, dt));
    state.smx = lerp(state.smx, state.mx, 0.05);
    state.smy = lerp(state.smy, state.my, 0.05);
    var p = state.smooth;
    var v = clamp(state.vel, -3, 3);

    // camera path: hero (z=14) → through the logo → down the tunnel
    var flyIn = clamp(p / 0.085, 0, 1);            // hero → through the O
    var camZ;
    if (MODE !== "home") camZ = lerp(4, TUNNEL_END + 10, p);
    else if (flyIn < 1) camZ = lerp(14, -6, ease(flyIn));
    else camZ = lerp(-6, TUNNEL_END + 10, clamp((p - 0.085) / 0.915, 0, 1));
    camera.position.z = camZ;
    camera.position.x = state.smx * 0.8;
    camera.position.y = -state.smy * 0.5;
    camera.rotation.z = Math.sin(p * 12) * 0.08 + v * 0.01;
    camera.lookAt(state.smx * 0.3, -state.smy * 0.2, camZ - 10);

    // emblem: sits to the side in the hero, aligns its O with the camera as we fly in
    var e = ease(clamp(p / 0.07, 0, 1));
    var s = lerp(emblem.userData.heroS, 2.6, e);
    emblem.scale.setScalar(s);
    emblem.position.x = lerp(emblem.userData.heroX, -oCenterX * s, e);
    emblem.position.y = lerp(emblem.userData.heroY, 0, e);
    emblem.rotation.y = lerp(-0.35 + state.smx * 0.25 + Math.sin(t * 0.5) * 0.08, 0, e);
    emblem.rotation.x = lerp(0.12 + state.smy * 0.15 + Math.cos(t * 0.4) * 0.05, 0, e);
    emblem.position.z = Math.sin(t * 0.8) * 0.15 * (1 - e);
    bar.scale.set(1, lerp(1, 0.0001, clamp((p - 0.03) / 0.04, 0, 1)) , 1);
    bar.visible = bar.scale.y > 0.01;
    barMat.uniforms.uTime.value = t;
    barMat.uniforms.uLevel.value = state.level;
    glows.forEach(function (g, i) { g.material.opacity = (0.45 + state.level * 0.6 + Math.sin(t * 1.5 + i) * 0.08) * (1 - e * 0.8); });
    emblem.visible = MODE === "home" && camZ > -12;

    // particles
    pMat.uniforms.uTime.value = t;
    pMat.uniforms.uLevel.value = state.level;
    pMat.uniforms.uVel.value = v;
    points.rotation.z = t * 0.01;

    // panels
    for (var i = 0; i < panels.length; i++) {
      var m = panels[i], u = m.userData;
      if (!u.ready) continue;
      var d = camZ - u.z;                    // distance in front of camera
      var op = clamp((40 - d) / 20, 0, 1) * clamp((d - 0.5) / 4, 0, 1);
      m.material.uniforms.uOpacity.value = op * (MODE === "home" ? (isMobile ? 0.3 : 0.5) : (isMobile ? 0.18 : 0.26));
      m.material.uniforms.uVel.value = lerp(m.material.uniforms.uVel.value, v * 0.6, 0.1);
      m.position.x = u.baseX + Math.sin(t * 0.3 + i) * 0.15;
      m.position.y = u.baseY + Math.cos(t * 0.35 + i) * 0.15;
      m.rotation.z = u.spin * 0.3 + Math.sin(t * 0.2 + i) * 0.03;
      m.visible = op > 0.001;
    }

    renderer.render(scene, camera);
  }
  tick();
})();
