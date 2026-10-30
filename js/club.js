/* =========================================================
   NO QUESTION EVENTS — "Enter the club" (real-time 3D)
   A fully procedural night-club scene driven by scroll:
   wet street & queue → bouncer & neon entrance → corridor
   with logos → interview at the press wall → the main hall:
   crowd, LED wall, truss, moving heads, haze and pyro.
   No external models — people are built from anatomical
   primitives, instanced and animated to the beat.
   ========================================================= */
(function () {
  "use strict";
  var section = document.getElementById("nqClub");
  if (!section) return;
  var canvas = document.getElementById("nqcCanvas");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var MOBILE = window.innerWidth < 760 || coarse;
  var FILE = location.protocol === "file:";
  var st = { p: 0, sp: 0, level: 0, visible: true, mx: 0, my: 0, smx: 0, smy: 0 };

  /* ---------- scroll measuring (works with Lenis + native) ---------- */
  function measure() {
    var r = section.getBoundingClientRect(), total = r.height - innerHeight;
    st.p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
    st.visible = r.top < innerHeight && r.bottom > 0;
    var fixed = r.top <= 0 && r.bottom >= innerHeight, after = r.bottom < innerHeight;
    if (section.classList.contains("is-fixed") !== fixed) section.classList.toggle("is-fixed", fixed);
    if (section.classList.contains("is-after") !== after) section.classList.toggle("is-after", after);
    window.NQ_GL_PAUSE = st.visible && r.bottom > innerHeight * 0.5;
    if (st.p !== measure.last) { measure.last = st.p; section.dispatchEvent(new CustomEvent("clubprogress", { detail: st.p })); }
  }
  window.addEventListener("scroll", measure, { passive: true });

  var gl = null;
  try { gl = window.THREE && canvas && (canvas.getContext("webgl2") || canvas.getContext("webgl")); } catch (e) { gl = null; }
  if (!gl) { section.classList.add("nqc--nogl"); window.addEventListener("resize", measure); measure(); return; }

  var THREE = window.THREE;
  var vw = window.innerWidth, vh = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, antialias: !MOBILE, powerPreference: "high-performance", stencil: false });
  var PR = window.NQ_PR || Math.min(window.devicePixelRatio || 1, MOBILE ? 1.0 : 1.25);
  renderer.setPixelRatio(PR);
  renderer.setSize(vw, vh, false);
  renderer.setClearColor(0x05040a, 1);

  var scene = new THREE.Scene();
  var fog = new THREE.FogExp2(0x0b0a14, 0.02);
  scene.fog = fog;
  var cam = new THREE.PerspectiveCamera(vw / vh < 1 ? 70 : 52, vw / vh, 0.05, 260);

  /* ---------- helpers ---------- */
  function C(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  function T(x, y, z) { return new THREE.Matrix4().makeTranslation(x, y, z); }
  function Rx(a) { return new THREE.Matrix4().makeRotationX(a); }
  function Ry(a) { return new THREE.Matrix4().makeRotationY(a); }
  function Rz(a) { return new THREE.Matrix4().makeRotationZ(a); }
  function S(x, y, z) { return new THREE.Matrix4().makeScale(x, y == null ? x : y, z == null ? x : z); }
  function mul() { var m = new THREE.Matrix4(); for (var i = 0; i < arguments.length; i++) m.multiply(arguments[i]); return m; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function canvasTex(w, h, draw, srgb) {
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var g = c.getContext("2d"); draw(g, w, h);
    var tx = new THREE.CanvasTexture(c); if (srgb !== false) tx.encoding = THREE.sRGBEncoding;
    tx.anisotropy = 4; tx._ctx = g; tx._c = c; return tx;
  }
  function noise(g, w, h, amt, alpha) {
    var id = g.getImageData(0, 0, w, h), d = id.data;
    for (var i = 0; i < d.length; i += 4) { var n = (Math.random() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; if (alpha) d[i + 3] = 255; }
    g.putImageData(id, 0, 0);
  }

  /* ---------- logo image (embedded data URL — never taints canvas) ---------- */
  var logoImg = new Image(), logoReady = false, onLogo = [];
  logoImg.onload = function () { logoReady = true; onLogo.forEach(function (f) { f(); }); };
  if (window.NQ_LOGO) logoImg.src = window.NQ_LOGO;
  function whenLogo(f) { if (logoReady) f(); else onLogo.push(f); }

  /* =========================================================
     TEXTURES
     ========================================================= */
  function brickTex(base, var1, mortar, grime, windows) {
    var map = canvasTex(512, 512, function (g, w, h) {
      g.fillStyle = mortar; g.fillRect(0, 0, w, h);
      var bw = 64, bh = 22, m = 3;
      for (var y = 0, row = 0; y < h; y += bh, row++) {
        for (var x = -(row % 2) * bw / 2; x < w; x += bw) {
          var c = new THREE.Color(base).lerp(new THREE.Color(var1), Math.random() * 0.8);
          c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.06);
          g.fillStyle = "#" + c.getHexString(); g.fillRect(x + m / 2, y + m / 2, bw - m, bh - m);
          if (Math.random() < 0.3) { g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x + m / 2, y + bh - m - 4, bw - m, 4); }
        }
      }
      noise(g, w, h, 34);
      var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, grime);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    var bump = canvasTex(512, 512, function (g, w, h) {
      g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
      var bw = 64, bh = 22, m = 3;
      for (var y = 0, row = 0; y < h; y += bh, row++) for (var x = -(row % 2) * bw / 2; x < w; x += bw) { g.fillStyle = "rgb(" + (170 + Math.random() * 60 | 0) + ",0,0)"; g.fillRect(x + m / 2, y + m / 2, bw - m, bh - m); }
      noise(g, w, h, 60);
    }, false);
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    return { map: map, bump: bump };
  }
  function windowsTex(cols, rows, litChance) {
    var t = canvasTex(512, 512, function (g, w, h) {
      g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
      var cw = w / cols, rh = h / rows;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        if (r === rows - 1) continue;
        var x = c * cw + cw * 0.22, y = r * rh + rh * 0.18, ww = cw * 0.56, hh = rh * 0.6;
        if (Math.random() < litChance) {
          var warm = Math.random() < 0.75;
          var gr = g.createLinearGradient(0, y, 0, y + hh);
          gr.addColorStop(0, warm ? "#ffb066" : "#8fb4ff"); gr.addColorStop(1, warm ? "#a8541e" : "#2f4c9c");
          g.fillStyle = gr; g.fillRect(x, y, ww, hh);
          if (Math.random() < 0.5) { g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(x, y, ww * rnd(0.2, 0.45), hh); }
          g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(x + ww / 2 - 1, y, 2, hh); g.fillRect(x, y + hh * 0.45, ww, 2);
        } else { g.fillStyle = "#07080c"; g.fillRect(x, y, ww, hh); }
      }
    });
    return t;
  }
  var asphalt = canvasTex(512, 512, function (g, w, h) {
    g.fillStyle = "#1a1a1e"; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 9000; i++) { g.fillStyle = "rgba(" + (Math.random() < 0.5 ? "255,255,255" : "0,0,0") + "," + rnd(0.03, 0.12) + ")"; g.fillRect(Math.random() * w, Math.random() * h, rnd(1, 3), rnd(1, 3)); }
    for (var k = 0; k < 14; k++) { var x = Math.random() * w, y = Math.random() * h, r = rnd(20, 80); var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(0,0,0,.45)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  });
  asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
  var asphaltRough = canvasTex(512, 512, function (g, w, h) {
    g.fillStyle = "rgb(150,150,150)"; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 18; k++) { var x = Math.random() * w, y = Math.random() * h, r = rnd(30, 110); var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgb(25,25,25)"); gr.addColorStop(0.7, "rgba(25,25,25,.6)"); gr.addColorStop(1, "rgba(25,25,25,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    noise(g, w, h, 30);
  }, false);
  asphaltRough.wrapS = asphaltRough.wrapT = THREE.RepeatWrapping;
  var tiles = canvasTex(512, 512, function (g, w, h) {
    g.fillStyle = "#2b2b30"; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y += 128) for (var x = 0; x < w; x += 128) { var v = 40 + Math.random() * 10 | 0; g.fillStyle = "rgb(" + v + "," + v + "," + (v + 3) + ")"; g.fillRect(x + 2, y + 2, 124, 124); }
    noise(g, w, h, 26);
  });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
  var clubFloor = canvasTex(512, 512, function (g, w, h) {
    g.fillStyle = "#151419"; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 40; i++) { var x = Math.random() * w, y = Math.random() * h, r = rnd(30, 120); var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.035)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    noise(g, w, h, 18);
  });
  clubFloor.wrapS = clubFloor.wrapT = THREE.RepeatWrapping;
  var acoustic = canvasTex(256, 256, function (g, w, h) {
    g.fillStyle = "#0d0c11"; g.fillRect(0, 0, w, h);
    for (var x = 0; x < w; x += 16) { g.fillStyle = x % 32 ? "#16141c" : "#111016"; g.fillRect(x, 0, 12, h); }
    noise(g, w, h, 14);
  });
  acoustic.wrapS = acoustic.wrapT = THREE.RepeatWrapping;
  var softDot = canvasTex(128, 128, function (g, w, h) {
    var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var shadowTex = canvasTex(128, 128, function (g) {
    var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(0,0,0,.85)"); gr.addColorStop(0.5, "rgba(0,0,0,.4)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  var hazeTex = canvasTex(256, 256, function (g, w, h) {
    for (var i = 0; i < 60; i++) {
      var x = rnd(40, 216), y = rnd(40, 216), r = rnd(30, 90);
      var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.08)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    var m = g.createRadialGradient(128, 128, 40, 128, 128, 128); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = m; g.fillRect(0, 0, w, h);
  });
  var streakTex = canvasTex(64, 512, function (g, w, h) {
    for (var i = 0; i < 26; i++) {
      var x = rnd(8, 56), ww = rnd(1, 6);
      var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(0.35, "rgba(255,255,255,.25)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.globalAlpha = rnd(0.2, 0.7); g.fillRect(x, 0, ww, h * rnd(0.5, 1));
    }
    g.globalAlpha = 1;
    var side = g.createLinearGradient(0, 0, w, 0); side.addColorStop(0, "rgba(0,0,0,1)"); side.addColorStop(0.3, "rgba(0,0,0,0)"); side.addColorStop(0.7, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = side; g.fillRect(0, 0, w, h);
  });

  // neon logo (logo + coloured glow), redrawn once the logo has loaded
  function neonLogoTex(glow) {
    var t = canvasTex(1024, 320, function () {});
    whenLogo(function () {
      var g = t._ctx; g.clearRect(0, 0, 1024, 320);
      var w = 900, h = w * 242 / 892, x = 62, y = (320 - h) / 2;
      g.shadowColor = glow; g.shadowBlur = 40; g.drawImage(logoImg, x, y, w, h);
      g.shadowBlur = 18; g.drawImage(logoImg, x, y, w, h);
      g.shadowBlur = 0; g.drawImage(logoImg, x, y, w, h);
      t.needsUpdate = true;
    });
    return t;
  }
  function textTex(w, h, txt, font, color, glow, bg) {
    return canvasTex(w, h, function (g) {
      if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
      g.font = font; g.textAlign = "center"; g.textBaseline = "middle";
      g.shadowColor = glow || color; g.shadowBlur = glow ? 24 : 0; g.fillStyle = color;
      g.fillText(txt, w / 2, h / 2); g.shadowBlur = 0; g.fillText(txt, w / 2, h / 2);
    });
  }
  // press wall: tiled logos
  var pressTex = canvasTex(1024, 512, function (g, w, h) { g.fillStyle = "#0c0c10"; g.fillRect(0, 0, w, h); });
  whenLogo(function () {
    var g = pressTex._ctx, w = 1024, h = 512, lw = 170, lh = lw * 242 / 892;
    for (var r = 0; r < 7; r++) for (var c = 0; c < 6; c++) {
      var x = c * 180 + (r % 2) * 90 - 40, y = r * 76 + 14;
      if ((r + c) % 2 === 0) g.drawImage(logoImg, x, y, lw, lh);
      else { g.fillStyle = "rgba(255,255,255,.75)"; g.font = "700 15px Arial, sans-serif"; g.textAlign = "center"; g.fillText("NO QUESTION EVENTS", x + lw / 2, y + lh / 2 + 6); }
    }
    pressTex.needsUpdate = true;
  });
  // posters: real artwork when served over http(s), designed fallback on file://
  function posterTex(src, title, sub, hue) {
    var t = canvasTex(512, 720, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "hsl(" + hue + ",90%,45%)"); gr.addColorStop(1, "hsl(" + (hue + 60) + ",85%,18%)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(0,0,0,.35)"; for (var i = 0; i < 18; i++) g.fillRect(0, i * 40, w, 2);
      g.fillStyle = "#fff"; g.textAlign = "left"; g.font = "900 78px Arial Black, Arial, sans-serif";
      title.split("\n").forEach(function (l, i) { g.fillText(l, 34, 260 + i * 82); });
      g.font = "700 28px Arial, sans-serif"; g.fillStyle = "rgba(255,255,255,.85)"; g.fillText(sub, 36, h - 70);
    });
    whenLogo(function () { t._ctx.drawImage(logoImg, 34, 40, 300, 300 * 242 / 892); t.needsUpdate = true; });
    if (!FILE && src) {
      var im = new Image();
      im.onload = function () {
        var g = t._ctx, w = 512, h = 720, r = Math.max(w / im.width, h / im.height);
        g.drawImage(im, (w - im.width * r) / 2, (h - im.height * r) / 2, im.width * r, im.height * r); t.needsUpdate = true;
      };
      im.src = src;
    }
    return t;
  }
  var POSTERS = [
    posterTex("assets/img/poster-sarius.jpg", "SARIUS\nBONSON\nEPIS", "13.02 · EFFENAAR", 35),
    posterTex("assets/img/tickets-sale.jpg", "TICKETS\nON SALE", "NO QUESTION EVENTS", 280),
    posterTex("assets/img/koncert-effenaar.jpg", "LIVE\nIN NL", "CONCERTS · CLUBNIGHTS", 200),
    posterTex("assets/img/promo-sarius-bonson-epis.jpg", "NO\nQUESTION", "FESTIVALS · NL", 140)
  ];

  /* ---------- LED wall (animated canvas, live footage when allowed) ---------- */
  var ledTex = canvasTex(1024, 448, function (g, w, h) { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); });
  var ledGrid = document.createElement("canvas"); ledGrid.width = 1024; ledGrid.height = 448;
  (function () { var g = ledGrid.getContext("2d"); g.fillStyle = "rgba(0,0,0,.42)"; for (var x = 0; x < 1024; x += 4) g.fillRect(x, 0, 1, 448); for (var y = 0; y < 448; y += 4) g.fillRect(0, y, 1024, 1); })();
  var ledVideo = null;
  if (!FILE) {
    ledVideo = document.createElement("video");
    ledVideo.muted = true; ledVideo.loop = true; ledVideo.playsInline = true; ledVideo.preload = "auto";
    ledVideo.setAttribute("muted", ""); ledVideo.setAttribute("playsinline", "");
    ledVideo.src = "assets/video/live-purple.mp4";
  }
  function drawLED(t, kick, mode) {
    var g = ledTex._ctx, w = 1024, h = 448;
    g.globalCompositeOperation = "source-over";
    var hue = (t * 18) % 360;
    var useVid = ledVideo && ledVideo.readyState >= 2 && mode === 1;
    if (useVid) {
      var vr = Math.max(w / ledVideo.videoWidth, h / ledVideo.videoHeight);
      g.drawImage(ledVideo, (w - ledVideo.videoWidth * vr) / 2, (h - ledVideo.videoHeight * vr) / 2, ledVideo.videoWidth * vr, ledVideo.videoHeight * vr);
      g.fillStyle = "rgba(20,0,40,.35)"; g.fillRect(0, 0, w, h);
    } else {
      var gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, "hsl(" + hue + ",90%,12%)"); gr.addColorStop(1, "hsl(" + ((hue + 120) % 360) + ",90%,8%)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // light bars
      for (var i = 0; i < 9; i++) {
        var x = ((i * 137 + t * 220 * (i % 2 ? 1 : -1)) % (w + 200) + w + 200) % (w + 200) - 100;
        var bg = g.createLinearGradient(x - 60, 0, x + 60, 0);
        bg.addColorStop(0, "rgba(0,0,0,0)"); bg.addColorStop(0.5, "hsla(" + ((hue + i * 40) % 360) + ",100%,60%," + (0.25 + kick * 0.4) + ")"); bg.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = bg; g.fillRect(x - 60, 0, 120, h);
      }
      // equalizer
      for (var b = 0; b < 48; b++) {
        var v = (0.25 + 0.75 * Math.abs(Math.sin(t * 3.1 + b * 0.55) * Math.sin(t * 1.7 + b * 0.21))) * (0.6 + kick * 0.6);
        g.fillStyle = "hsla(" + ((hue + b * 4) % 360) + ",100%,60%,.55)";
        g.fillRect(b * (w / 48) + 3, h - v * h * 0.42, w / 48 - 6, v * h * 0.42);
      }
    }
    if (logoReady) {
      var s = 1 + kick * 0.05, lw = w * (useVid ? 0.42 : 0.62) * s, lh = lw * 242 / 892;
      g.shadowColor = "hsl(" + hue + ",100%,60%)"; g.shadowBlur = 30;
      g.drawImage(logoImg, (w - lw) / 2, useVid ? h - lh - 30 : (h - lh) / 2 - 20, lw, lh);
      g.shadowBlur = 0;
    }
    if (kick > 0.85 && mode === 2) { g.fillStyle = "rgba(255,255,255," + (kick - 0.85) * 3 + ")"; g.fillRect(0, 0, w, h); }
    g.drawImage(ledGrid, 0, 0);
    ledTex.needsUpdate = true;
  }

  /* =========================================================
     MATERIALS
     ========================================================= */
  var U = { uTime: { value: 0 }, uBeat: { value: 0 }, uEnergy: { value: 0 } };
  function emissive(color, k) { var m = new THREE.MeshBasicMaterial({ color: C(color) }); m.color.multiplyScalar(k || 1); m.toneMapped = false; return m; }
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  var M = {
    personStatic: std({ vertexColors: true, roughness: 0.82, metalness: 0 }),
    person: std({ vertexColors: true, roughness: 0.82, metalness: 0 }),
    metal: std({ color: C("#9aa0aa"), roughness: 0.35, metalness: 0.9 }),
    black: std({ color: C("#0b0b0e"), roughness: 0.6, metalness: 0.2 }),
    wallDark: std({ color: C("#16141b"), roughness: 0.9 }),
    truss: std({ color: C("#b9bcc4"), roughness: 0.3, metalness: 0.95 }),
    stage: std({ color: C("#0e0e12"), roughness: 0.45, metalness: 0.1 }),
    rope: std({ color: C("#8a0f22"), roughness: 0.6 }),
    glass: std({ color: C("#0a0d14"), roughness: 0.08, metalness: 0.6 })
  };
  // people shading: fabric grain, rim light (backlit silhouettes like concert photos), crowd groove
  U.uRim = { value: new THREE.Color(0.5, 0.2, 0.6) };
  function patchPerson(mat, wave) {
    mat.onBeforeCompile = function (sh) {
      sh.uniforms.uTime = U.uTime; sh.uniforms.uEnergy = U.uEnergy; sh.uniforms.uRim = U.uRim;
      sh.vertexShader = "uniform float uTime; uniform float uEnergy; varying vec3 vObj;\n" + sh.vertexShader.replace("#include <begin_vertex>",
        "#include <begin_vertex>\n vObj = position;\n" + (wave ? "#ifdef USE_INSTANCING\n float ph = instanceMatrix[3].x*1.73 + instanceMatrix[3].z*0.91;\n float up = clamp((position.y-1.42)/0.45,0.,1.);\n transformed.x += sin(uTime*(2.6+fract(ph)*1.6)+ph)*0.12*up*(0.4+uEnergy);\n transformed.z += cos(uTime*1.9+ph)*0.05*up;\n float hd = smoothstep(1.5,1.62,position.y);\n transformed.z += sin(uTime*4.2+ph*2.)*0.022*hd*uEnergy;\n#endif\n" : ""));
      sh.fragmentShader = "uniform vec3 uRim; varying vec3 vObj;\nfloat nqh(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }\nfloat nqn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(nqh(i),nqh(i+vec3(1,0,0)),f.x),mix(nqh(i+vec3(0,1,0)),nqh(i+vec3(1,1,0)),f.x),f.y),mix(mix(nqh(i+vec3(0,0,1)),nqh(i+vec3(1,0,1)),f.x),mix(nqh(i+vec3(0,1,1)),nqh(i+vec3(1,1,1)),f.x),f.y),f.z); }\n" +
        sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n float fab = nqn(vObj*55.)*.6 + nqn(vObj*9.)*.4; diffuseColor.rgb *= .82 + .3*fab;")
          .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n float nqRim = pow(1. - clamp(dot(normal, normalize(vViewPosition)), 0., 1.), 3.2);\n reflectedLight.directDiffuse += uRim * nqRim;");
    };
  }
  patchPerson(M.person, true); patchPerson(M.personStatic, false);
  var beamMat = function (color, k) {
    return new THREE.ShaderMaterial({
      uniforms: { uColor: { value: C(color) }, uInt: { value: k || 1 }, uLen: { value: 10 }, uTime: U.uTime },
      vertexShader: "uniform float uLen; varying vec3 vW; varying vec3 vN; varying float vY;\nvoid main(){ vY=clamp(-position.y/uLen,0.,1.); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }",
      fragmentShader: "uniform vec3 uColor; uniform float uInt; uniform float uTime; varying vec3 vW; varying vec3 vN; varying float vY;\nvoid main(){ vec3 V=normalize(cameraPosition-vW); float f=pow(abs(dot(normalize(vN),V)),1.7); float fall=pow(1.-vY,1.5)*smoothstep(0.,.03,vY); float n=.72+.28*sin(vW.x*1.3+uTime*.6)*sin(vW.z*1.1-uTime*.45)*sin(vW.y*1.7+uTime*.3); gl_FragColor=vec4(uColor*uInt*f*fall*n,1.); }",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false
    });
  };
  function beamGeo(len, r0, r1) { var g = new THREE.CylinderGeometry(r0, r1, len, 28, 1, true); g.translate(0, -len / 2, 0); return g; }
  function additiveMat(tex, color, op) { var m = new THREE.MeshBasicMaterial({ map: tex, color: C(color), transparent: true, opacity: op == null ? 1 : op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }); m.toneMapped = false; return m; }

  /* =========================================================
     PEOPLE — sculpted, organic bodies.
     Each figure is described as a skeleton of soft primitives
     (tapered limbs, ellipsoid muscles, skull, jaw, nose, lips,
     eye sockets, hair shells, clothing with folds) that are
     smooth-blended into one signed-distance field and meshed
     with surface-nets in background workers.
     ========================================================= */
  var F_CLOTH = 1, F_HEAD = 2, F_CUT = 4, F_BODY = 16;
  var STRIDE = 28;
  function PB() { this.a = []; }
  PB.prototype.push = function (type, k, col, flags, a, b, r0, r1, rot, cut, prio) {
    var A = this.a;
    A.push(type, k, col.r, col.g, col.b, flags, a[0], a[1], a[2], b[0], b[1], b[2], r0 || 0, r1 || 0);
    rot = rot || [1, 0, 0, 0, 1, 0, 0, 0, 1]; for (var i = 0; i < 9; i++) A.push(rot[i]);
    cut = cut || [0, 0, 0, 0]; A.push(cut[0], cut[1], cut[2], cut[3]); A.push(prio || 0);
  };
  function pos(m) { var e = m.elements; return [e[12], e[13], e[14]]; }
  function invRot(m) { var e = m.elements; return [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]]; }
  // ellipsoid from a frame matrix (rotation+translation only)
  function ell(P, m, rad, col, flags, k, cut, prio) { P.push(1, k == null ? 0.04 : k, col, flags | (cut ? F_CUT : 0), pos(m), rad, 0, 0, invRot(m), cut, prio); }
  function cone(P, a, b, r0, r1, col, flags, k, prio) { P.push(0, k == null ? 0.04 : k, col, flags, a, b, r0, r1, null, null, prio); }
  function rbox(P, m, half, r, col, flags, k, prio) { P.push(2, k == null ? 0.01 : k, col, flags, pos(m), half, r, 0, invRot(m), null, prio); }
  function hole(P, c, r, k) { P.push(3, k, { r: 0, g: 0, b: 0 }, F_HEAD, c, [0, 0, 0], r, 0); }
  function limbP(P, Mp, len, r0, r1, col, flags, k) { var end = mul(Mp, T(0, -len, 0)); cone(P, pos(Mp), pos(end), r0, r1, col, flags, k); return end; }

  var POSE = {
    down: { abd: 0.14, flex: 0.08, elbow: 0.3 }, pocket: { abd: 0.1, flex: -0.06, elbow: 0.55, tw: -0.25 },
    up: { abd: -0.2, flex: 2.8, elbow: 0.28 }, upV: { abd: -0.5, flex: 2.55, elbow: 0.2 },
    phone: { abd: -0.1, flex: 2.2, elbow: 0.85, tw: 0.25 }, fist: { abd: -0.15, flex: 2.4, elbow: 1.0 },
    clap: { abd: 0.06, flex: 0.75, elbow: 1.45, tw: 0.75 }, cross: { abd: 0.04, flex: 0.4, elbow: 1.8, tw: 1.05 },
    mic: { abd: 0.08, flex: 0.85, elbow: 1.0, tw: 0.35 }, micMouth: { abd: 0.18, flex: 1.0, elbow: 2.25, tw: 0.55 },
    cam: { abd: 0.55, flex: 0.85, elbow: 2.45, tw: 0.6 }, drink: { abd: 0.1, flex: 0.45, elbow: 1.65, tw: 0.35 },
    point: { abd: -0.05, flex: 1.55, elbow: 0.15 }
  };
  var SKIN = ["#f1c7a5", "#e0ac86", "#c98e66", "#a8714c", "#7c4f33", "#5a3a26", "#ecc0a0", "#d49c78"];
  var HAIR = ["#141012", "#1d1612", "#2c1f17", "#4a3424", "#6e5034", "#a07a4e", "#d2b680", "#0d0d0d"];
  var TOPS = ["#111114", "#18181c", "#202026", "#2a2c33", "#0f1218", "#e9e9ec", "#3b3f46", "#4a1f24", "#1c2a3d", "#2f3b2b", "#6b6f78", "#7a1f2b", "#c9a227", "#1f5c99", "#d9d4c8"];
  var BOTS = ["#1b2333", "#232a3b", "#15171c", "#2a2f38", "#3c4454", "#0f0f12", "#4b4237", "#2b3446"];
  var SHOES = ["#ececec", "#141414", "#1c1c1c", "#262626", "#8b8b8b", "#e2ddd2"];

  function figurePrims(o) {
    var P = new PB(), fem = o.sex === "f", sw = fem ? 0.9 : 1.0;
    var skin = C(o.skin), top = C(o.top), bot = C(o.bottom), shoe = C(o.shoe), hair = C(o.hair);
    var lip = skin.clone().multiplyScalar(0.6); lip.r *= 1.12;
    var white = C("#b9aea6"), iris = C("#1a120e"), sole = C(o.shoe === "#141414" || o.shoe === "#1c1c1c" || o.shoe === "#262626" ? "#e8e8e8" : "#f6f6f6");
    var tt = o.topType, th = (tt === "hoodie" || tt === "jacket") ? 1.1 : 1.0;
    var B = F_BODY, BC = F_BODY | F_CLOTH, H = F_HEAD;
    var out = { hand: null };
    // ---- legs & sneakers
    [-1, 1].forEach(function (side) {
      var lf = (o.legF || 0) * (side < 0 ? 1 : -0.7);
      var Mh = mul(T(0.094 * side * (fem ? 1.05 : 1), 0.95, 0), Rz(0.03 * side), Rx(-lf));
      var knee = limbP(P, Mh, 0.45, fem ? 0.09 : 0.098, 0.064, bot, BC, 0.05);
      var bare = fem && o.skirt;
      var ank = limbP(P, mul(knee, Rx(Math.max(0, lf) * 0.9 + 0.05)), 0.42, bare ? 0.054 : 0.066, bare ? 0.034 : 0.05, bare ? skin : bot, bare ? B : BC, 0.04);
      if (!bare) ell(P, mul(knee, T(0, -0.13, -0.02)), [0.06, 0.1, 0.06], bot, BC, 0.05); // calf volume
      var ap = pos(ank);
      rbox(P, T(ap[0], 0.058, ap[2] + 0.045), [0.048, 0.04, 0.12], 0.035, shoe, B, 0.02);
      rbox(P, T(ap[0], 0.016, ap[2] + 0.045), [0.052, 0.014, 0.13], 0.012, sole, B, 0.004, 0.002);
    });
    // ---- pelvis, torso, shoulders
    ell(P, T(0, 0.97, 0), [fem ? 0.19 : 0.175, 0.13, 0.125], bot, BC, 0.05);
    if (fem && o.skirt) cone(P, [0, 1.0, 0], [0, 0.66, 0], 0.17, 0.25, bot, BC, 0.02);
    ell(P, T(0, 1.1, 0.0), [0.155 * sw * th, 0.16, 0.112 * th], top, BC, 0.07);
    ell(P, T(0, 1.3, 0.008), [0.176 * sw * th, 0.17, 0.122 * th], top, BC, 0.07);
    cone(P, [-0.165 * sw, 1.415, -0.012], [0.165 * sw, 1.415, -0.012], 0.074 * th, 0.074 * th, top, BC, 0.07);
    if (fem) [-1, 1].forEach(function (s) { ell(P, T(0.066 * s, 1.3, 0.082 * th), [0.07, 0.066, 0.056], top, BC, 0.05); });
    else [-1, 1].forEach(function (s) { ell(P, T(0.075 * s, 1.33, 0.07 * th), [0.085, 0.07, 0.05], top, BC, 0.05); });
    if (tt === "hoodie") { ell(P, mul(T(0, 1.48, -0.105), Rx(-0.5)), [0.15, 0.075, 0.085], top, BC, 0.04); ell(P, T(0, 1.08, 0.115), [0.12, 0.07, 0.02], top, BC, 0.02); }
    if (tt === "jacket") { ell(P, T(0, 1.505, -0.005), [0.105, 0.055, 0.1], top, BC, 0.03); rbox(P, T(0, 1.2, 0.128 * th), [0.006, 0.26, 0.006], 0.004, C("#060606"), B, 0.003, 0.004); }
    // neck (head pass) + slightly thinner copy for the body pass (no z-fighting)
    cone(P, [0, 1.47, -0.005], [0, 1.6, 0.012], 0.058, 0.05, skin, H, 0.03);
    cone(P, [0, 1.45, -0.005], [0, 1.56, 0.008], 0.053, 0.046, skin, B, 0.03);
    // ---- head & face
    var HY = 1.665;
    ell(P, T(0, HY + 0.012, -0.008), [0.082, 0.104, 0.097], skin, H, 0.02);
    ell(P, T(0, HY - 0.042, 0.03), [0.066, 0.068, 0.07], skin, H, 0.035);
    ell(P, T(0, HY - 0.087, 0.056), [0.03, 0.022, 0.026], skin, H, 0.02);
    [-1, 1].forEach(function (s) {
      ell(P, T(0.046 * s, HY - 0.006, 0.062), [0.03, 0.024, 0.03], skin, H, 0.02);
      ell(P, mul(T(0.084 * s, HY - 0.002, -0.006), Ry(0.25 * s)), [0.013, 0.031, 0.022], skin, H, 0.008);
    });
    ell(P, T(0, HY + 0.032, 0.073), [0.064, 0.018, 0.026], skin, H, 0.016);
    cone(P, [0, HY + 0.018, 0.088], [0, HY - 0.028, 0.111], 0.01, 0.016, skin, H, 0.012);
    ell(P, T(0, HY - 0.032, 0.1), [0.022, 0.012, 0.015], skin, H, 0.01);
    [-1, 1].forEach(function (s) { hole(P, [0.032 * s, HY + 0.008, 0.094], 0.016, 0.014); });
    [-1, 1].forEach(function (s) {
      ell(P, T(0.032 * s, HY + 0.006, 0.08), [0.0105, 0.0068, 0.009], white, H, 0.002, null, 0.004);
      ell(P, T(0.032 * s, HY + 0.006, 0.0885), [0.0048, 0.0048, 0.002], iris, H, 0.001, null, 0.01);
      rbox(P, mul(T(0.033 * s, HY + 0.036, 0.093), Rz(-0.14 * s)), [0.017, 0.0035, 0.006], 0.002, hair, H, 0.003, 0.006);
    });
    ell(P, T(0, HY - 0.05, 0.093), [0.023, 0.0075, 0.011], lip, H, 0.006, null, 0.004);
    ell(P, T(0, HY - 0.062, 0.09), [0.02, 0.0085, 0.011], lip, H, 0.006, null, 0.004);
    var hs = o.hairStyle, front = new THREE.Vector3(0, -0.5, 1).normalize();
    var hcut = [front.x, front.y, front.z, front.x * 0 + front.y * (HY + 0.05) + front.z * 0.068];
    if (hs !== "bald") {
      if (hs === "cap") {
        ell(P, T(0, HY + 0.03, -0.004), [0.094, 0.09, 0.104], C(o.cap), H, 0.006, [0, -1, 0, -(HY + 0.012)]);
        rbox(P, mul(T(0, HY + 0.026, 0.1), Rx(0.14)), [0.074, 0.005, 0.058], 0.004, C(o.cap), H, 0.004);
        ell(P, T(0, HY - 0.01, -0.02), [0.088, 0.06, 0.09], hair, H, 0.006, [0, 0.5, 0.86, 0.86 * 0.04 + 0.5 * HY]);
      } else if (hs === "beanie") {
        ell(P, T(0, HY + 0.03, -0.006), [0.098, 0.12, 0.108], C(o.cap), H | F_CLOTH, 0.006, [0, -1, 0, -(HY + 0.0)]);
      } else {
        var cu = hs === "curly";
        ell(P, T(0, HY + 0.02, -0.012), [cu ? 0.1 : 0.089, cu ? 0.122 : 0.11, cu ? 0.114 : 0.104], hair, H | (cu ? F_CLOTH : 0), 0.006, hcut);
        if (hs === "long") {
          ell(P, T(0, HY - 0.13, -0.065), [0.1, 0.2, 0.065], hair, H, 0.02);
          [-1, 1].forEach(function (s) { ell(P, T(0.076 * s, HY - 0.07, -0.004), [0.026, 0.13, 0.05], hair, H, 0.012); });
        }
        if (hs === "bun") ell(P, T(0, HY + 0.105, -0.05), [0.048, 0.044, 0.048], hair, H, 0.01);
        if (hs === "pony") cone(P, [0, HY + 0.02, -0.1], [0, HY - 0.15, -0.14], 0.03, 0.014, hair, H, 0.01);
      }
    }
    if (o.beard) ell(P, T(0, HY - 0.06, 0.045), [0.072, 0.058, 0.064], hair, H, 0.01, [0, 1, 0, HY - 0.035], 0.002);
    // ---- arms & hands
    function arm(side, a) {
      var sleeveFull = tt === "hoodie" || tt === "jacket";
      var Ms = mul(T(0.198 * side * sw, 1.42, -0.01), Rz(a.abd * side), Rx(-a.flex), Ry(-(a.tw || 0) * side));
      var up;
      if (tt === "tank") up = limbP(P, Ms, 0.29, 0.058, 0.046, skin, B, 0.04);
      else if (sleeveFull) up = limbP(P, Ms, 0.29, 0.068 * th, 0.054 * th, top, BC, 0.05);
      else { var mid = limbP(P, Ms, 0.15, 0.068, 0.06, top, BC, 0.05); up = limbP(P, mid, 0.14, 0.052, 0.045, skin, B, 0.04); }
      var Me = mul(up, Rx(-a.elbow));
      var fa = limbP(P, Me, 0.255, sleeveFull ? 0.054 * th : 0.046, sleeveFull ? 0.045 : 0.034, sleeveFull ? top : skin, sleeveFull ? BC : B, 0.04);
      if (sleeveFull) fa = limbP(P, mul(fa, T(0, 0.02, 0)), 0.03, 0.034, 0.032, skin, B, 0.02);
      var hand = mul(fa, T(0, -0.06, 0));
      ell(P, hand, [0.04, 0.07, 0.022], skin, B, 0.025);
      cone(P, pos(mul(hand, T(0.028 * -side, 0.03, 0.014))), pos(mul(hand, T(0.04 * -side, -0.02, 0.03))), 0.012, 0.01, skin, B, 0.012);
      return hand;
    }
    var rh = arm(-1, POSE[o.ra] || POSE.down);
    arm(1, POSE[o.la] || POSE.down);
    if (o.prop === "phone") {
      rbox(P, mul(rh, T(0, -0.045, 0.03)), [0.022, 0.044, 0.005], 0.004, C("#1a1a1a"), B, 0.004, 0.003);
      out.hand = new THREE.Vector3().fromArray(pos(mul(rh, T(0, -0.045, 0.04))));
    }
    if (o.prop === "mic") {
      var mm = mul(rh, T(0, -0.03, 0.03), Rx(-1.2));
      cone(P, pos(mul(mm, T(0, -0.03, 0))), pos(mul(mm, T(0, 0.14, 0))), 0.013, 0.017, C("#121212"), B, 0.004, 0.003);
      ell(P, mul(mm, T(0, 0.17, 0)), [0.03, 0.03, 0.03], C("#3a3a3a"), B, 0.004, null, 0.003);
      rbox(P, mul(mm, T(0, 0.095, 0)), [0.032, 0.022, 0.032], 0.004, C("#f4f4f4"), B, 0.003, 0.004);
    }
    if (o.prop === "cam") {
      rbox(P, T(-0.2, 1.6, 0.12), [0.07, 0.065, 0.15], 0.012, C("#141416"), B, 0.004, 0.004);
      cone(P, [-0.2, 1.6, 0.27], [-0.2, 1.6, 0.4], 0.05, 0.052, C("#0a0a0a"), B, 0.004, 0.004);
    }
    if (o.prop === "drink") cone(P, pos(mul(rh, T(0, -0.0, 0.03))), pos(mul(rh, T(0, -0.12, 0.03))), 0.03, 0.026, C("#d8a23a"), B, 0.004, 0.004);
    out.prims = new Float32Array(P.a);
    out.headC = [0, HY, 0.0];
    return out;
  }
  function randomLook(pose) {
    var f = Math.random() < 0.42, hsF = ["long", "long", "bun", "pony", "long", "curly"], hsM = ["short", "short", "short", "cap", "cap", "beanie", "curly", "bald"];
    var hs = pick(f ? hsF : hsM);
    return {
      sex: f ? "f" : "m", skin: pick(SKIN), hair: pick(HAIR), top: pick(TOPS), bottom: pick(BOTS), shoe: pick(SHOES), cap: pick(["#0b0b0b", "#1d1d22", "#7a1f2b", "#e5e5e5", "#2a3550"]),
      topType: pick(["tee", "tee", "hoodie", "hoodie", "jacket", f ? "tank" : "tee"]), hairStyle: hs, beard: !f && Math.random() < 0.3, skirt: f && Math.random() < 0.15,
      ra: pose[0], la: pose[1], prop: pose[2] || null, legF: rnd(-0.05, 0.12)
    };
  }

  /* ---------- mesher (runs inside workers) ---------- */
  function MESHER() {
    var STRIDE = 28;
    function len3(x, y, z) { return Math.sqrt(x * x + y * y + z * z); }
    function smin(a, b, k) { if (k <= 0) return Math.min(a, b); var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
    function smax(a, b, k) { return -smin(-a, -b, k); }
    function primD(P, o, x, y, z) {
      var t = P[o], d;
      if (t === 0 || t === 3) {
        if (t === 3) { return len3(x - P[o + 6], y - P[o + 7], z - P[o + 8]) - P[o + 12]; }
        var ax = P[o + 6], ay = P[o + 7], az = P[o + 8], bx = P[o + 9] - ax, by = P[o + 10] - ay, bz = P[o + 11] - az, r1 = P[o + 12], r2 = P[o + 13];
        var l2 = bx * bx + by * by + bz * bz, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
        var px = x - ax, py = y - ay, pz = z - az, yy = px * bx + py * by + pz * bz, zz = yy - l2;
        var qx = px * l2 - bx * yy, qy = py * l2 - by * yy, qz = pz * l2 - bz * yy, x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = zz * zz * l2;
        var k = (rr > 0 ? 1 : rr < 0 ? -1 : 0) * rr * rr * x2;
        if ((zz > 0 ? 1 : -1) * a2 * z2 > k) d = Math.sqrt(x2 + z2) * il2 - r2;
        else if ((yy > 0 ? 1 : -1) * a2 * y2 < k) d = Math.sqrt(x2 + y2) * il2 - r1;
        else d = (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
      } else {
        var cx = x - P[o + 6], cy = y - P[o + 7], cz = z - P[o + 8];
        var lx = P[o + 14] * cx + P[o + 15] * cy + P[o + 16] * cz, ly = P[o + 17] * cx + P[o + 18] * cy + P[o + 19] * cz, lz = P[o + 20] * cx + P[o + 21] * cy + P[o + 22] * cz;
        if (t === 1) {
          var rx = P[o + 9], ry = P[o + 10], rz = P[o + 11];
          var k0 = len3(lx / rx, ly / ry, lz / rz), k1 = len3(lx / (rx * rx), ly / (ry * ry), lz / (rz * rz));
          d = k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
        } else {
          var r = P[o + 12], qx2 = Math.abs(lx) - P[o + 9] + r, qy2 = Math.abs(ly) - P[o + 10] + r, qz2 = Math.abs(lz) - P[o + 11] + r;
          d = len3(Math.max(qx2, 0), Math.max(qy2, 0), Math.max(qz2, 0)) + Math.min(Math.max(qx2, Math.max(qy2, qz2)), 0) - r;
        }
      }
      if (P[o + 5] & 4) d = Math.max(d, P[o + 23] * x + P[o + 24] * y + P[o + 25] * z - P[o + 26]);
      if (P[o + 5] & 1) d += 0.0032 * (Math.sin(y * 95 + 2.2 * Math.sin(x * 31 + z * 27)) * 0.6 + Math.sin(x * 53 + z * 61 + y * 17) * 0.4);
      return d;
    }
    function aabb(P, o) {
      var t = P[o], m = P[o + 1] + 0.02, b;
      if (t === 0) { var r = Math.max(P[o + 12], P[o + 13]) + m; b = [Math.min(P[o + 6], P[o + 9]) - r, Math.min(P[o + 7], P[o + 10]) - r, Math.min(P[o + 8], P[o + 11]) - r, Math.max(P[o + 6], P[o + 9]) + r, Math.max(P[o + 7], P[o + 10]) + r, Math.max(P[o + 8], P[o + 11]) + r]; }
      else { var e = t === 1 ? Math.max(P[o + 9], P[o + 10], P[o + 11]) : t === 3 ? P[o + 12] : len3(P[o + 9], P[o + 10], P[o + 11]) + P[o + 12]; e += m; b = [P[o + 6] - e, P[o + 7] - e, P[o + 8] - e, P[o + 6] + e, P[o + 7] + e, P[o + 8] + e]; }
      return b;
    }
    function mesh(P, pass, h, lo, hi) {
      var n = P.length / STRIDE, list = [], boxes = [];
      for (var i = 0; i < n; i++) if (P[i * STRIDE + 5] & pass) { list.push(i * STRIDE); boxes.push(aabb(P, i * STRIDE)); }
      if (!lo) { lo = [1e9, 1e9, 1e9]; hi = [-1e9, -1e9, -1e9]; boxes.forEach(function (b) { for (var a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], b[a]); hi[a] = Math.max(hi[a], b[a + 3]); } }); }
      lo = [lo[0] - h * 2, lo[1] - h * 2, lo[2] - h * 2]; hi = [hi[0] + h * 2, hi[1] + h * 2, hi[2] + h * 2];
      var nx = Math.ceil((hi[0] - lo[0]) / h) + 1, ny = Math.ceil((hi[1] - lo[1]) / h) + 1, nz = Math.ceil((hi[2] - lo[2]) / h) + 1;
      var F = new Float32Array(nx * ny * nz);
      function sdf(x, y, z, cand) {
        var d = 1e3, ci = -1, best = 1e9, L = cand || list;
        for (var q = 0; q < L.length; q++) {
          var o = L[q], bb = cand ? null : boxes[q];
          if (bb && (x < bb[0] || y < bb[1] || z < bb[2] || x > bb[3] || y > bb[4] || z > bb[5])) continue;
          var di = primD(P, o, x, y, z);
          if (P[o] === 3) d = smax(d, -di, P[o + 1]);
          else { d = smin(d, di, P[o + 1]); var sc = di - P[o + 27]; if (sc < best) { best = sc; ci = o; } }
        }
        sdf.ci = ci; return d;
      }
      // field, with per-row candidate culling
      for (var k = 0; k < nz; k++) {
        var z = lo[2] + k * h;
        for (var j = 0; j < ny; j++) {
          var y = lo[1] + j * h, row = [], rb = [];
          for (var q = 0; q < list.length; q++) { var b = boxes[q]; if (y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5]) { row.push(list[q]); rb.push(b); } }
          var base = nx * (j + ny * k);
          for (var i2 = 0; i2 < nx; i2++) {
            var x = lo[0] + i2 * h, d = 1e3;
            if (row.length) {
              var cand = [];
              for (var r = 0; r < row.length; r++) if (x >= rb[r][0] && x <= rb[r][3]) cand.push(row[r]);
              if (cand.length) d = sdf(x, y, z, cand);
            }
            F[base + i2] = d > 1e2 ? h * 3 : d;
          }
        }
      }
      // surface nets
      var cnx = nx - 1, cny = ny - 1, cnz = nz - 1, CV = new Int32Array(cnx * cny * cnz).fill(-1);
      var V = [], E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
      var OFF = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], val = new Float32Array(8);
      for (var ck = 0; ck < cnz; ck++) for (var cj = 0; cj < cny; cj++) for (var cii = 0; cii < cnx; cii++) {
        var mask = 0;
        for (var c = 0; c < 8; c++) { var v = F[(cii + OFF[c][0]) + nx * ((cj + OFF[c][1]) + ny * (ck + OFF[c][2]))]; val[c] = v; if (v < 0) mask |= 1 << c; }
        if (mask === 0 || mask === 255) continue;
        var sx = 0, sy = 0, sz = 0, cnt = 0;
        for (var e = 0; e < 12; e++) {
          var a0 = E[e][0], a1 = E[e][1];
          if ((val[a0] < 0) === (val[a1] < 0)) continue;
          var tt = val[a0] / (val[a0] - val[a1]);
          sx += OFF[a0][0] + (OFF[a1][0] - OFF[a0][0]) * tt; sy += OFF[a0][1] + (OFF[a1][1] - OFF[a0][1]) * tt; sz += OFF[a0][2] + (OFF[a1][2] - OFF[a0][2]) * tt; cnt++;
        }
        CV[cii + cnx * (cj + cny * ck)] = V.length / 3;
        V.push(lo[0] + (cii + sx / cnt) * h, lo[1] + (cj + sy / cnt) * h, lo[2] + (ck + sz / cnt) * h);
      }
      var I = [];
      function cell(i, j, k) { return CV[i + cnx * (j + cny * k)]; }
      function quad(a, b, c2, d2) { if (a < 0 || b < 0 || c2 < 0 || d2 < 0) return; I.push(a, b, c2, a, c2, d2); }
      for (var pk = 0; pk < nz; pk++) for (var pj = 0; pj < ny; pj++) for (var pi = 0; pi < nx; pi++) {
        var f0 = F[pi + nx * (pj + ny * pk)] < 0;
        if (pi < nx - 1 && pj > 0 && pk > 0 && pj < cny && pk < cnz && pi < cnx && (F[(pi + 1) + nx * (pj + ny * pk)] < 0) !== f0) quad(cell(pi, pj - 1, pk - 1), cell(pi, pj, pk - 1), cell(pi, pj, pk), cell(pi, pj - 1, pk));
        if (pj < ny - 1 && pi > 0 && pk > 0 && pi < cnx && pk < cnz && pj < cny && (F[pi + nx * ((pj + 1) + ny * pk)] < 0) !== f0) quad(cell(pi - 1, pj, pk - 1), cell(pi, pj, pk - 1), cell(pi, pj, pk), cell(pi - 1, pj, pk));
        if (pk < nz - 1 && pi > 0 && pj > 0 && pi < cnx && pj < cny && pk < cnz && (F[pi + nx * (pj + ny * (pk + 1))] < 0) !== f0) quad(cell(pi - 1, pj - 1, pk), cell(pi, pj - 1, pk), cell(pi, pj, pk), cell(pi - 1, pj, pk));
      }
      // normals from the field gradient, colours from the nearest primitive
      var nv = V.length / 3, N = new Float32Array(nv * 3), Cc = new Float32Array(nv * 3), eps = h * 0.5;
      for (var vi = 0; vi < nv; vi++) {
        var X = V[vi * 3], Y = V[vi * 3 + 1], Z = V[vi * 3 + 2];
        var gx = sdf(X + eps, Y, Z) - sdf(X - eps, Y, Z), gy = sdf(X, Y + eps, Z) - sdf(X, Y - eps, Z), gz = sdf(X, Y, Z + eps) - sdf(X, Y, Z - eps);
        var gl = len3(gx, gy, gz) || 1; N[vi * 3] = gx / gl; N[vi * 3 + 1] = gy / gl; N[vi * 3 + 2] = gz / gl;
        sdf(X, Y, Z); var co = sdf.ci;
        if (co >= 0) { Cc[vi * 3] = P[co + 2]; Cc[vi * 3 + 1] = P[co + 3]; Cc[vi * 3 + 2] = P[co + 4]; }
      }
      // consistent winding (face normal agrees with gradient)
      for (var ti = 0; ti < I.length; ti += 3) {
        var ia = I[ti] * 3, ib = I[ti + 1] * 3, ic = I[ti + 2] * 3;
        var ux = V[ib] - V[ia], uy = V[ib + 1] - V[ia + 1], uz = V[ib + 2] - V[ia + 2], wx = V[ic] - V[ia], wy = V[ic + 1] - V[ia + 1], wz = V[ic + 2] - V[ia + 2];
        var fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx;
        if (fx * (N[ia] + N[ib] + N[ic]) + fy * (N[ia + 1] + N[ib + 1] + N[ic + 1]) + fz * (N[ia + 2] + N[ib + 2] + N[ic + 2]) < 0) { var tmp = I[ti + 1]; I[ti + 1] = I[ti + 2]; I[ti + 2] = tmp; }
      }
      return { V: new Float32Array(V), N: N, C: Cc, I: I };
    }
    self.onmessage = function (ev) {
      var m = ev.data, P = m.prims;
      var body = mesh(P, 16, m.hb), head = mesh(P, 2, m.hh, [m.hc[0] - 0.15, m.hc[1] - 0.17, m.hc[2] - 0.16], [m.hc[0] + 0.15, m.hc[1] + 0.2, m.hc[2] + 0.17]);
      var nb = body.V.length / 3, V = new Float32Array(body.V.length + head.V.length), N = new Float32Array(V.length), Cc = new Float32Array(V.length);
      V.set(body.V); V.set(head.V, body.V.length); N.set(body.N); N.set(head.N, body.N.length); Cc.set(body.C); Cc.set(head.C, body.C.length);
      var I = new Uint32Array(body.I.length + head.I.length); I.set(body.I); for (var i = 0; i < head.I.length; i++) I[body.I.length + i] = head.I[i] + nb;
      self.postMessage({ id: m.id, V: V, N: N, C: Cc, I: I }, [V.buffer, N.buffer, Cc.buffer, I.buffer]);
    };
  }
  var workers = [], wq = [], wcb = {}, wid = 0, wbusy = [];
  (function () {
    var nW = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
    var src = "(" + MESHER.toString() + ")();";
    var url = null;
    try { url = URL.createObjectURL(new Blob([src], { type: "application/javascript" })); } catch (e) {}
    for (var i = 0; i < nW && url; i++) {
      try {
        var w = new Worker(url); w._i = i; wbusy.push(false);
        w.onmessage = function (ev) { var d = ev.data; wbusy[this._i] = false; var cb = wcb[d.id]; delete wcb[d.id]; if (cb) cb(d); pump(); };
        workers.push(w);
      } catch (e) { break; }
    }
    if (!workers.length) {   // no workers (very old browser): mesh on the main thread, one per frame
      var local = {}; (new Function("self", src.replace("();", "();")))(local);
      workers.push({ postMessage: function (m) { var self = this; setTimeout(function () { local.postMessage = function (d) { wbusy[0] = false; var cb = wcb[d.id]; delete wcb[d.id]; if (cb) cb(d); pump(); }; local.onmessage({ data: m }); }, 16); } }); wbusy.push(false);
    }
  })();
  function pump() {
    for (var i = 0; i < workers.length && wq.length; i++) if (!wbusy[i]) { wbusy[i] = true; workers[i].postMessage(wq.shift()); }
  }
  // quality: 0 crowd, 1 guests, 2 hero characters
  var QUAL = [[MOBILE ? 0.04 : 0.034, MOBILE ? 0.02 : 0.016], [0.028, 0.012], [MOBILE ? 0.026 : 0.021, MOBILE ? 0.011 : 0.0085]];
  function requestFigure(look, q, cb, front) {
    var f = figurePrims(look), id = ++wid;
    wcb[id] = function (d) {
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(d.V, 3)); g.setAttribute("normal", new THREE.BufferAttribute(d.N, 3)); g.setAttribute("color", new THREE.BufferAttribute(d.C, 3));
      g.setIndex(new THREE.BufferAttribute(d.I, 1)); g.computeBoundingSphere();
      cb(g, f);
    };
    var job = { id: id, prims: f.prims, hb: QUAL[q][0], hh: QUAL[q][1], hc: f.headC };
    if (front) wq.unshift(job); else wq.push(job);
    pump();
    return f;
  }

  // person(look, q): returns immediately (geometry fills in when its worker finishes)
  var pendingFig = 0;
  function person(o, q) {
    var geo = new THREE.BufferGeometry();
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 1.1);
    pendingFig++;
    var f = requestFigure(o, q == null ? 1 : q, function (g) {
      ["position", "normal", "color"].forEach(function (k) { geo.setAttribute(k, g.attributes[k]); });
      geo.setIndex(g.index); geo.computeBoundingSphere(); pendingFig--;
    }, q === 2);
    return { geo: geo, hand: f.hand };
  }

  /* =========================================================
     WORLD
     ========================================================= */
  var G = { street: new THREE.Group(), corr: new THREE.Group(), lobby: new THREE.Group(), hall: new THREE.Group() };
  Object.keys(G).forEach(function (k) { scene.add(G[k]); });
  function box(w, h, d, mat, x, y, z, grp, ry) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; (grp || scene).add(m); return m; }
  function plane(w, h, mat, x, y, z, rx, ry, grp) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); (grp || scene).add(m); return m; }
  function placePerson(look, x, z, ry, grp, sc, y) {
    var pr = person(look, look.q != null ? look.q : (look.ra && !look.legF && look.legF !== 0 ? 2 : 1)), m = new THREE.Mesh(pr.geo, M.personStatic);
    m.position.set(x, y || 0, z); m.rotation.y = ry; m.scale.setScalar(sc || 1); grp.add(m);
    var sh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(x, (y || 0) + 0.012, z); grp.add(sh);
    return m;
  }

  /* ---------- lights (kept at scene root: no shader recompiles) ---------- */
  var hemi = new THREE.HemisphereLight(C("#3a3560"), C("#0a0810"), 0.5); scene.add(hemi);
  function pl(color, i, d, x, y, z) { var l = new THREE.PointLight(C(color), i, d, 2); l.position.set(x, y, z); scene.add(l); return l; }
  var L = {
    lamp1: pl("#ffb46a", 2.4, 18, -10, 5.6, 3.8), lamp2: pl("#ffb46a", 2.4, 18, 9, 5.6, 3.8), lamp3: pl("#ffb46a", 2.0, 18, 25, 5.6, 3.8),
    neon: pl("#ff3fd2", 3.2, 11, 0, 4.2, 1.4), door: pl("#38d6ff", 2.4, 9, 0, 2.2, -1.2),
    corr1: pl("#ff2fb4", 2.2, 8, 0, 2.6, -4.5), corr2: pl("#5b5bff", 2.2, 8, 0, 2.6, -9.5),
    press: pl("#fff2e0", 3.0, 7, 4.6, 2.4, -14.6), lobby: pl("#9a6bff", 1.6, 10, 1, 3, -17),
    stage: pl("#7d3cff", 6.0, 46, 0, 7, -60), back: pl("#ff2f7a", 4.0, 40, 0, 3, -66), bar: pl("#ffae4a", 2.2, 10, -15.5, 2.8, -33),
    wash: pl("#27c8ff", 2.6, 34, 0, 9, -40)
  };
  var spot1 = new THREE.SpotLight(C("#ff4fd8"), 4, 60, 0.32, 0.6, 1.2), spot2 = new THREE.SpotLight(C("#3fe0ff"), 4, 60, 0.32, 0.6, 1.2);
  spot1.position.set(-8, 11.4, -63); spot2.position.set(8, 11.4, -63); scene.add(spot1, spot2, spot1.target, spot2.target);

  /* ---------- STREET ---------- */
  (function street() {
    var g = G.street;
    var asphaltMat = std({ map: asphalt, roughnessMap: asphaltRough, roughness: 1, metalness: 0.15, color: C("#5a5a62") });
    asphalt.repeat.set(12, 5); asphaltRough.repeat.set(12, 5);
    plane(140, 40, asphaltMat, 0, 0, 22, -Math.PI / 2, 0, g);
    var tileMat = std({ map: tiles, roughness: 0.55, metalness: 0.05, color: C("#77777f") }); tiles.repeat.set(40, 2);
    box(140, 0.14, 4.2, tileMat, 0, 0.07, 2.1, g);
    box(140, 0.16, 0.22, std({ color: C("#4a4a50"), roughness: 0.7 }), 0, 0.08, 4.25, g);
    // club building (dark painted brick) + neighbours (red brick with windows)
    var dark = brickTex("#24222a", "#302c36", "#141318", "rgba(0,0,0,.6)");
    dark.map.repeat.set(5, 4); dark.bump.repeat.set(5, 4);
    var clubMat = std({ map: dark.map, bumpMap: dark.bump, bumpScale: 0.03, roughness: 0.92 });
    var fT = 0.5;
    box(7.7, 12, fT, clubMat, -5.15, 6, -fT / 2, g);   // left of door
    box(7.7, 12, fT, clubMat, 5.15, 6, -fT / 2, g);    // right of door
    box(2.6, 9.1, fT, clubMat, 0, 7.45, -fT / 2, g);   // above door
    var red = brickTex("#6b2e22", "#8a4632", "#3a2420", "rgba(10,5,5,.55)");
    red.map.repeat.set(6, 6); red.bump.repeat.set(6, 6);
    [[-19, 16, 20], [19, 14, 20], [-38, 18, 18], [38, 13, 18]].forEach(function (b, i) {
      var win = windowsTex(6, b[1] / 2.6 | 0, 0.45);
      var m = std({ map: red.map, bumpMap: red.bump, bumpScale: 0.03, roughness: 0.9, emissiveMap: win, emissive: C("#ffffff"), emissiveIntensity: 0.9, color: C(i % 2 ? "#a98e86" : "#ffffff") });
      box(b[2], b[1], 0.6, m, b[0], b[1] / 2, -0.6 - (i > 1 ? 0.8 : 0), g);
      box(b[2], 0.3, 0.8, std({ color: C("#1a1a1e"), roughness: 0.8 }), b[0], b[1] + 0.15, -0.5, g);
    });
    box(18, 0.4, 0.9, std({ color: C("#111014"), roughness: 0.8 }), 0, 12.2, -0.3, g);
    // door frame, open doors, glowing interior
    var frame = std({ color: C("#08080a"), roughness: 0.3, metalness: 0.8 });
    box(0.14, 3.0, 0.6, frame, -1.32, 1.5, -0.2, g); box(0.14, 3.0, 0.6, frame, 1.32, 1.5, -0.2, g); box(2.78, 0.16, 0.6, frame, 0, 3.0, -0.2, g);
    var doorL = box(1.25, 2.86, 0.06, M.glass, -1.25, 1.43, -0.9, g); doorL.rotation.y = -1.2; doorL.position.set(-1.62, 1.43, -0.75);
    var doorR = box(1.25, 2.86, 0.06, M.glass, 1.25, 1.43, -0.9, g); doorR.rotation.y = 1.2; doorR.position.set(1.62, 1.43, -0.75);
    // canopy with LED edge
    box(5.2, 0.22, 1.8, std({ color: C("#0d0d10"), roughness: 0.5, metalness: 0.6 }), 0, 3.55, 0.9, g);
    box(5.2, 0.05, 0.05, emissive("#ff3fd2", 3), 0, 3.43, 1.8, g);
    box(0.05, 0.05, 1.8, emissive("#ff3fd2", 3), -2.6, 3.43, 0.9, g); box(0.05, 0.05, 1.8, emissive("#ff3fd2", 3), 2.6, 3.43, 0.9, g);
    for (var i = 0; i < 4; i++) { var dl = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), emissive("#fff3dc", 4)); dl.rotation.x = Math.PI / 2; dl.position.set(-1.8 + i * 1.2, 3.43, 0.6); g.add(dl); }
    // NEON logo sign above the canopy + blade sign
    var neonMat = new THREE.MeshBasicMaterial({ map: neonLogoTex("#ff4fd8"), transparent: true, depthWrite: false, toneMapped: false });
    neonMat.color.setScalar(2.6);
    plane(5.6, 1.75, neonMat, 0, 5.15, 0.06, 0, 0, g);
    box(5.0, 1.5, 0.08, std({ color: C("#050507"), roughness: 0.4, metalness: 0.5 }), 0, 5.15, 0.0, g);
    var bladeMat = new THREE.MeshBasicMaterial({ map: neonLogoTex("#3fd0ff"), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    bladeMat.color.setScalar(2.2);
    var blade = plane(3.6, 1.12, bladeMat, 7.6, 7.2, 0.95, 0, 0, g); blade.rotation.set(0, Math.PI / 2, Math.PI / 2);
    box(0.16, 3.9, 1.3, std({ color: C("#0b0b0e"), roughness: 0.4, metalness: 0.6 }), 7.6, 7.2, 0.8, g);
    // lightbox posters on the facade
    [[-4.2, 0], [-6.6, 1], [4.4, 2]].forEach(function (pp) {
      box(1.5, 2.1, 0.12, M.black, pp[0], 1.75, 0.05, g);
      var pm = new THREE.MeshBasicMaterial({ map: POSTERS[pp[1]], toneMapped: false }); pm.color.setScalar(1.25);
      plane(1.32, 1.9, pm, pp[0], 1.75, 0.12, 0, 0, g);
    });
    // stanchions + velvet rope
    var posts = [];
    for (var x = 2.1; x <= 12.5; x += 2.08) { posts.push(x); box(0.06, 1.0, 0.06, M.metal, x, 0.62, 2.3, g); var top = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), M.metal); top.position.set(x, 1.15, 2.3); g.add(top); var base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16), M.metal); base.position.set(x, 0.16, 2.3); g.add(base); }
    for (var k = 0; k < posts.length - 1; k++) {
      var a = new THREE.Vector3(posts[k], 1.08, 2.3), b = new THREE.Vector3(posts[k + 1], 1.08, 2.3), mid = a.clone().lerp(b, 0.5); mid.y -= 0.28;
      var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.025, 6), M.rope));
    }
    // street lamps
    [-10, 9, 25].forEach(function (x) {
      box(0.16, 6, 0.16, std({ color: C("#202024"), roughness: 0.5, metalness: 0.7 }), x, 3, 3.8, g);
      box(0.1, 0.1, 1.4, std({ color: C("#202024"), roughness: 0.5, metalness: 0.7 }), x, 5.95, 3.3, g);
      box(0.5, 0.12, 0.3, emissive("#ffd29a", 6), x, 5.85, 2.75, g);
      var bm = new THREE.Mesh(beamGeo(5.8, 0.18, 2.4), beamMat("#ffb26a", 0.22)); bm.material.uniforms.uLen.value = 5.8; bm.position.set(x, 5.8, 2.75); g.add(bm);
      var str = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 9), additiveMat(streakTex, "#ffb46a", 0.55)); str.rotation.x = -Math.PI / 2; str.position.set(x, 0.02, 7.6); g.add(str);
    });
    var ns = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 12), additiveMat(streakTex, "#ff3fd2", 0.45)); ns.rotation.x = -Math.PI / 2; ns.position.set(0, 0.02, 9.6); g.add(ns);
    var ds = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 6), additiveMat(streakTex, "#38d6ff", 0.35)); ds.rotation.x = -Math.PI / 2; ds.position.set(0, 0.16, 3.2); g.add(ds);
    // bouncers
    placePerson({ sex: "m", skin: "#6a442c", hair: "#111", top: "#0b0b0d", bottom: "#111114", shoe: "#0e0e0e", topType: "jacket", hairStyle: "bald", beard: true, ra: "cross", la: "cross" }, -1.95, 0.75, 0.2, g, 1.08, 0.14);
    placePerson({ sex: "m", skin: "#e2b08c", hair: "#2a1d14", top: "#0b0b0d", bottom: "#111114", shoe: "#0e0e0e", topType: "jacket", hairStyle: "short", ra: "clap", la: "down", prop: "phone" }, 1.85, 0.9, -0.5, g, 1.04, 0.14);
    // queue
    var poses = [["pocket", "down"], ["phone", "down", "phone"], ["down", "drink", "drink"], ["pocket", "pocket"], ["clap", "down"], ["down", "down"]];
    for (var q = 0; q < 15; q++) {
      var qx = 2.6 + q * 0.72 + rnd(-0.12, 0.12), qz = 1.45 + rnd(-0.25, 0.3);
      var look = randomLook(pick(poses)); look.topType = pick(["jacket", "hoodie", "jacket", "hoodie", "tee"]);
      var ry = -Math.PI / 2 + rnd(-0.45, 0.45); if (q % 4 === 1) ry = rnd(-0.3, 0.6);
      placePerson(look, qx, qz, ry, g, rnd(0.93, 1.06), 0.14);
    }
    // a couple walking on the street
    placePerson(randomLook(["down", "down"]), -6, 6.5, 0.9, g, 1.0);
    placePerson(randomLook(["phone", "down", "phone"]), -5.3, 6.9, 0.9, g, 0.96);
    // parked car silhouette
    var car = new THREE.Group(); car.position.set(-14, 0, 8.2); g.add(car);
    box(4.4, 0.75, 1.8, std({ color: C("#0e1018"), roughness: 0.25, metalness: 0.8 }), 0, 0.62, 0, car);
    box(2.4, 0.6, 1.6, M.glass, -0.2, 1.25, 0, car);
    [[-1.4, 0.9], [1.4, 0.9], [-1.4, -0.9], [1.4, -0.9]].forEach(function (w) { var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 16), M.black); wh.rotation.x = Math.PI / 2; wh.position.set(w[0], 0.34, w[1]); car.add(wh); });
    box(0.05, 0.12, 0.35, emissive("#ff2a2a", 3), 2.21, 0.82, 0.6, car); box(0.05, 0.12, 0.35, emissive("#ff2a2a", 3), 2.21, 0.82, -0.6, car);
  })();

  // rain
  var RAIN_N = MOBILE ? 500 : 1100;
  var rainPos = new Float32Array(RAIN_N * 6), rainSeed = [];
  for (var ri = 0; ri < RAIN_N; ri++) rainSeed.push({ x: rnd(-14, 18), y: rnd(0, 12), z: rnd(-0.5, 22), v: rnd(9, 13) });
  var rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  var rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: C("#9fb4d8"), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  rain.frustumCulled = false; G.street.add(rain);

  /* ---------- CORRIDOR ---------- */
  (function corridor() {
    var g = G.corr, wall = std({ color: C("#121117"), roughness: 0.75 });
    var floor = std({ map: clubFloor, roughness: 0.28, metalness: 0.2 }); clubFloor.repeat.set(2, 6);
    plane(3.4, 12, floor, 0, 0.005, -6.3, -Math.PI / 2, 0, g);
    plane(3.4, 12, M.wallDark, 0, 3.2, -6.3, Math.PI / 2, 0, g);
    plane(12, 3.2, wall, -1.65, 1.6, -6.3, 0, Math.PI / 2, g);
    plane(12, 3.2, wall, 1.65, 1.6, -6.3, 0, -Math.PI / 2, g);
    // LED strips along floor and ceiling edges
    [-1.62, 1.62].forEach(function (x, i) {
      box(0.04, 0.04, 11.6, emissive(i ? "#4f6bff" : "#ff2fb4", 3.5), x, 0.06, -6.3, g);
      box(0.04, 0.04, 11.6, emissive(i ? "#ff2fb4" : "#4f6bff", 3.5), x, 3.14, -6.3, g);
    });
    // neon logos on the left wall, lightbox posters on the right
    [-3.2, -8.6].forEach(function (z, i) {
      var nm = new THREE.MeshBasicMaterial({ map: neonLogoTex(i ? "#46a8ff" : "#ff3fd2"), transparent: true, depthWrite: false, toneMapped: false }); nm.color.setScalar(2.3);
      plane(2.6, 0.81, nm, -1.6, 2.0, z, 0, Math.PI / 2, g);
    });
    [-2.6, -5.6, -8.6].forEach(function (z, i) {
      box(0.08, 1.9, 1.35, M.black, 1.6, 1.6, z, g);
      var pm = new THREE.MeshBasicMaterial({ map: POSTERS[(i + 1) % 4], toneMapped: false }); pm.color.setScalar(1.2);
      plane(1.2, 1.72, pm, 1.55, 1.6, z, 0, -Math.PI / 2, g);
    });
    for (var z = -1.5; z > -12; z -= 1.5) { var d = new THREE.Mesh(new THREE.CircleGeometry(0.06, 14), emissive("#ffe7cf", 3.5)); d.rotation.x = Math.PI / 2; d.position.set(0, 3.18, z); g.add(d); }
    // two guests walking in ahead
    placePerson(randomLook(["down", "pocket"]), -0.5, -7.2, Math.PI + 0.1, g, 1.0);
    placePerson(randomLook(["down", "phone", "phone"]), 0.45, -7.9, Math.PI - 0.1, g, 0.96);
  })();

  /* ---------- LOBBY / PRESS WALL ---------- */
  (function lobby() {
    var g = G.lobby, wall = std({ color: C("#141218"), roughness: 0.8 });
    var floor = std({ map: clubFloor, roughness: 0.3, metalness: 0.2 });
    plane(12, 7, floor, 2, 0.004, -15.5, -Math.PI / 2, 0, g);
    plane(12, 7, M.wallDark, 2, 3.6, -15.5, Math.PI / 2, 0, g);
    box(2.4, 3.6, 0.2, wall, -2.8, 1.8, -12.1, g); box(6.3, 3.6, 0.2, wall, 4.8, 1.8, -12.1, g);       // front wall around corridor opening
    box(1.0, 3.6, 0.2, wall, -3.5, 1.8, -19, g); box(5.0, 3.6, 0.2, wall, 5.5, 1.8, -19, g); box(6, 0.4, 0.2, wall, 0, 3.4, -19, g); // back wall with hall opening
    box(0.2, 3.6, 7, wall, -4, 1.8, -15.5, g); box(0.2, 3.6, 7, wall, 8.05, 1.8, -15.5, g);
    // press wall
    var pw = std({ map: pressTex, roughness: 0.55, emissiveMap: pressTex, emissive: C("#ffffff"), emissiveIntensity: 0.18 });
    plane(5.6, 2.8, pw, 7.92, 1.55, -15.6, 0, -Math.PI / 2, g);
    // softbox lights
    [[5.0, -13.2], [5.2, -18.1]].forEach(function (s) {
      box(0.04, 2.2, 0.04, M.metal, s[0], 1.1, s[1], g);
      var sb = box(0.62, 0.62, 0.3, emissive("#fff6ea", 2.2), s[0], 2.25, s[1], g); sb.lookAt(7, 1.6, -15.6);
    });
    // the interview: reporter, artist, camera operator with ring light
    placePerson({ sex: "f", skin: "#e8b896", hair: "#1a1310", top: "#ececf0", bottom: "#141418", shoe: "#f4f4f4", topType: "jacket", hairStyle: "long", ra: "mic", la: "down", prop: "mic" }, 6.0, -14.75, 2.25, g, 1.0);
    placePerson({ sex: "m", skin: "#d6a37f", hair: "#151010", top: "#e9e6df", bottom: "#d9d6cf", shoe: "#f2f2f2", topType: "hoodie", hairStyle: "cap", cap: "#0c0c0c", beard: true, ra: "clap", la: "down" }, 7.05, -15.65, -1.25, g, 1.04);
    var camOp = placePerson({ sex: "m", skin: "#b07a55", hair: "#111", top: "#121214", bottom: "#202430", shoe: "#1a1a1a", topType: "hoodie", hairStyle: "beanie", cap: "#151515", ra: "cam", la: "clap", prop: "cam" }, 5.15, -16.7, 1.05, g, 1.0);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 32), emissive("#ffffff", 3)); ring.position.set(5.45, 1.75, -16.35); ring.lookAt(7.05, 1.6, -15.65); g.add(ring);
    // a few guests chatting
    placePerson(randomLook(["drink", "down", "drink"]), 1.5, -17.6, 0.6, g, 1.0);
    placePerson(randomLook(["down", "pocket"]), 2.2, -17.9, -1.8, g, 0.95);
    placePerson(randomLook(["phone", "down", "phone"]), -2.4, -15.2, 1.3, g, 1.0);
    // neon "MAIN STAGE" over the hall entrance
    var ms = new THREE.MeshBasicMaterial({ map: textTex(1024, 192, "MAIN STAGE  →", "900 110px Arial Black, Arial, sans-serif", "#ffffff", "#ff3fd2"), transparent: true, depthWrite: false, toneMapped: false }); ms.color.setScalar(2);
    plane(3.6, 0.68, ms, 0, 3.0, -18.85, 0, 0, g);
  })();

  /* ---------- MAIN HALL ---------- */
  var heads = [], blinders = [], flames = [], crowdMeshes = [], phones = null, ledMesh;
  (function hall() {
    var g = G.hall;
    var floor = std({ map: clubFloor, roughness: 0.22, metalness: 0.25 }); clubFloor.repeat.set(8, 12);
    plane(38, 56, floor, 0, 0.003, -47, -Math.PI / 2, 0, g);
    acoustic.repeat.set(14, 3);
    var wall = std({ map: acoustic, roughness: 0.9 });
    plane(56, 14, wall, -18.2, 7, -47, 0, Math.PI / 2, g); plane(56, 14, wall, 18.2, 7, -47, 0, -Math.PI / 2, g);
    plane(38, 14, M.wallDark, 0, 7, -75, 0, 0, g);
    plane(38, 56, std({ color: C("#08070b"), roughness: 1 }), 0, 14, -47, Math.PI / 2, 0, g);
    box(15, 14, 0.3, M.wallDark, -10.7, 7, -19.2, g); box(15, 14, 0.3, M.wallDark, 10.7, 7, -19.2, g); box(6.4, 10.4, 0.3, M.wallDark, 0, 8.8, -19.2, g);
    // stage
    box(24, 1.4, 11, M.stage, 0, 0.7, -69.5, g);
    box(24, 0.05, 0.05, emissive("#ff3fd2", 4), 0, 1.38, -64.0, g);
    box(23.5, 1.3, 0.05, std({ color: C("#050506"), roughness: 0.5 }), 0, 0.68, -63.98, g);
    // LED wall + side screens
    ledMesh = plane(18, 7.9, new THREE.MeshBasicMaterial({ map: ledTex, toneMapped: false }), 0, 6.2, -73.6, 0, 0, g);
    ledMesh.material.color.setScalar(1.6);
    box(18.6, 8.5, 0.3, M.black, 0, 6.2, -73.85, g);
    [-11.6, 11.6].forEach(function (x) { var sm = plane(3.2, 5.6, new THREE.MeshBasicMaterial({ map: ledTex, toneMapped: false }), x, 5.4, -68, 0, x < 0 ? 0.35 : -0.35, g); sm.material.color.setScalar(1.2); });
    // line arrays
    [-12.6, 12.6].forEach(function (x) { for (var i = 0; i < 7; i++) box(1.1, 0.42, 0.9, M.black, x, 10.4 - i * 0.44, -63.5, g, x < 0 ? 0.25 : -0.25); });
    // subwoofers & DJ booth
    [-9, -7.6, 7.6, 9].forEach(function (x) { box(1.2, 1.0, 1.0, M.black, x, 1.9, -65.2, g); });
    box(3.2, 1.15, 1.0, std({ color: C("#0c0c10"), roughness: 0.4, metalness: 0.4 }), 4.2, 1.98, -68.6, g);
    box(3.2, 0.06, 1.0, emissive("#3fe0ff", 2.5), 4.2, 2.56, -68.6, g);
    var boothFront = new THREE.MeshBasicMaterial({ map: neonLogoTex("#ff3fd2"), transparent: true, toneMapped: false }); boothFront.color.setScalar(1.6);
    plane(2.8, 0.87, boothFront, 4.2, 1.98, -68.08, 0, 0, g);
    // truss (front) + towers
    var tm = M.truss;
    function trussBeam(x1, x2, y, z) {
      var len = x2 - x1, cx = (x1 + x2) / 2;
      [[0.2, 0.2], [0.2, -0.2], [-0.2, 0.2], [-0.2, -0.2]].forEach(function (o) { box(len, 0.05, 0.05, tm, cx, y + o[0], z + o[1], g); });
      for (var x = x1; x < x2; x += 0.6) { var d = box(0.03, 0.56, 0.03, tm, x + 0.3, y, z + 0.2, g); d.rotation.z = 0.78; var d2 = box(0.03, 0.56, 0.03, tm, x + 0.3, y, z - 0.2, g); d2.rotation.z = -0.78; }
    }
    trussBeam(-12.5, 12.5, 11.5, -63.4); trussBeam(-12.5, 12.5, 12.2, -71);
    [-12.3, 12.3].forEach(function (x) { [[0.2, 0.2], [0.2, -0.2], [-0.2, 0.2], [-0.2, -0.2]].forEach(function (o) { box(0.05, 11.5, 0.05, tm, x + o[0], 5.75, -63.4 + o[1], g); }); });
    // moving heads with volumetric beams
    var palette = ["#ff3fd2", "#3fe0ff", "#7b5bff", "#ffffff", "#ff2a6a", "#2aff9c"];
    function movingHead(x, y, z, hang, len) {
      var root = new THREE.Group(); root.position.set(x, y, z); g.add(root);
      var yoke = new THREE.Group(); root.add(yoke);
      var headM = new THREE.Group(); yoke.add(headM);
      box(0.34, 0.42, 0.34, M.black, 0, 0, 0, headM);
      var lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), emissive("#ffffff", 5)); lens.rotation.x = Math.PI / 2; lens.position.y = -0.215; headM.add(lens);
      var bm = new THREE.Mesh(beamGeo(len, 0.1, len * 0.11), beamMat("#ffffff", 0.5)); bm.material.uniforms.uLen.value = len; bm.position.y = -0.2; headM.add(bm);
      if (!hang) root.rotation.x = Math.PI;
      var h = { root: root, yoke: yoke, head: headM, beam: bm, lens: lens, ph: Math.random() * 6.28, x: x, hang: hang };
      heads.push(h); return h;
    }
    for (var i = 0; i < (MOBILE ? 6 : 10); i++) movingHead(-10.8 + i * (21.6 / ((MOBILE ? 6 : 10) - 1)), 11.05, -63.4, true, 30);
    for (var j = 0; j < (MOBILE ? 4 : 6); j++) movingHead(-8 + j * (16 / ((MOBILE ? 4 : 6) - 1)), 1.62, -72.2, false, 34);
    heads.forEach(function (h, i) { h.color = palette[i % palette.length]; });
    // blinders
    [-6, -2, 2, 6].forEach(function (x) { var b = box(0.9, 0.45, 0.12, emissive("#ffe2b0", 0.1), x, 10.9, -63.1, g); blinders.push(b); });
    // flame jets
    [-10, -6, 6, 10].forEach(function (x) {
      var fm = new THREE.Mesh(beamGeo(4.5, 0.08, 0.9), beamMat("#ff8a2a", 0)); fm.material.uniforms.uLen.value = 4.5; fm.rotation.x = Math.PI; fm.position.set(x, 1.45, -64.6); g.add(fm); flames.push(fm);
      box(0.4, 0.3, 0.4, M.black, x, 1.55, -64.6, g);
    });
    // side neon logos + exit signs
    [-1, 1].forEach(function (s) {
      var nm = new THREE.MeshBasicMaterial({ map: neonLogoTex(s < 0 ? "#ff3fd2" : "#3fe0ff"), transparent: true, depthWrite: false, toneMapped: false }); nm.color.setScalar(2.4);
      plane(9, 2.8, nm, 18.1 * s, 8, -42, 0, -s * Math.PI / 2, g);
      var ex = new THREE.MeshBasicMaterial({ map: textTex(256, 96, "EXIT", "900 64px Arial, sans-serif", "#ffffff", null, "#0a8a3a"), toneMapped: false }); ex.color.setScalar(1.4);
      plane(0.8, 0.3, ex, 18.1 * s, 3.2, -24, 0, -s * Math.PI / 2, g);
    });
    // bar
    var barM = std({ color: C("#120f14"), roughness: 0.25, metalness: 0.5 });
    box(1.6, 1.1, 15, barM, -16.4, 0.55, -33, g);
    box(1.8, 0.06, 15.2, std({ color: C("#2a2630"), roughness: 0.15, metalness: 0.6 }), -16.4, 1.13, -33, g);
    box(0.05, 0.05, 15, emissive("#ffae4a", 4), -15.58, 0.1, -33, g);
    box(0.3, 2.6, 15, M.black, -18.0, 2.4, -33, g);
    for (var sh = 0; sh < 3; sh++) {
      box(0.32, 0.03, 14.6, emissive("#ffb86a", 1.4), -17.84, 1.6 + sh * 0.7, -33, g);
      for (var bt = 0; bt < 30; bt++) { var bo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.26, 8), emissive(pick(["#7a3b0d", "#2c5e1a", "#3d1a5e", "#8a6a1a", "#1d4a6e"]), 1.4)); bo.position.set(-17.84, 1.75 + sh * 0.7, -40 + bt * 0.47 + rnd(-0.1, 0.1)); g.add(bo); }
    }
    placePerson({ sex: "m", skin: "#c48a64", hair: "#141010", top: "#0d0d0f", bottom: "#141418", shoe: "#111", topType: "tee", hairStyle: "short", beard: true, ra: "drink", la: "clap", prop: "drink" }, -17.3, -31, Math.PI / 2, g, 1.0);
    placePerson({ sex: "f", skin: "#efc3a2", hair: "#d8bf8a", top: "#0d0d0f", bottom: "#141418", shoe: "#111", topType: "tank", hairStyle: "pony", ra: "clap", la: "down" }, -17.3, -36, Math.PI / 2 - 0.3, g, 0.97);
    // barrier + security
    for (var bx = -13; bx <= 13; bx += 1.3) box(1.25, 1.15, 0.08, M.metal, bx, 0.58, -61.6, g);
    [-6, 5].forEach(function (x) { placePerson({ sex: "m", skin: pick(SKIN), hair: "#111", top: "#f2c400", bottom: "#121216", shoe: "#111", topType: "jacket", hairStyle: "short", ra: "cross", la: "cross" }, x, -62.4, 0, g, 1.06); });
    // performers
    placePerson({ sex: "m", skin: "#e3b08f", hair: "#0f0f0f", top: "#0d0d0d", bottom: "#151515", shoe: "#f5f5f5", topType: "hoodie", hairStyle: "cap", cap: "#0a0a0a", ra: "micMouth", la: "up", prop: "mic", legF: 0.25 }, 0, -66, 0.15, g, 1.05, 1.4);
    placePerson({ sex: "m", skin: "#cf9a76", hair: "#141010", top: "#e9e6df", bottom: "#1d2230", shoe: "#f5f5f5", topType: "tee", hairStyle: "short", beard: true, ra: "point", la: "fist" }, -3.6, -65.6, 0.35, g, 1.02, 1.4);
    placePerson({ sex: "m", skin: "#9a6a48", hair: "#0d0d0d", top: "#141414", bottom: "#151515", shoe: "#111", topType: "tee", hairStyle: "cap", cap: "#7a1f2b", ra: "clap", la: "up" }, 4.2, -69.4, 0, g, 1.0, 1.4);

    /* ---- the crowd: instanced variants ---- */
    var poseSets = [["up", "down"], ["upV", "upV"], ["phone", "down", "phone"], ["fist", "down"], ["down", "down"], ["clap", "clap"], ["up", "phone", "phone"], ["down", "up"], ["drink", "down", "drink"], ["phone", "fist", "phone"]];
    var VAR = MOBILE ? 12 : 22, variants = [];
    for (var v = 0; v < VAR; v++) variants.push(person(randomLook(poseSets[v % poseSets.length]), 0));
    var spots = [];
    var maxN = MOBILE ? 190 : 470;
    for (var z = -23.5; z > -61; z -= 0.6) {
      var dens = 0.45 + 0.5 * sstep(-26, -52, z);
      for (var x = -16; x <= 16; x += 0.6) {
        if (x < -14.7 && z > -41 && z < -25) continue; // bar
        if (Math.abs(x) < 1.3 && z > -36) continue; // keep the camera's path clear
        if (Math.random() > dens) continue;
        spots.push([x + rnd(-0.22, 0.22), z + rnd(-0.22, 0.22)]);
      }
    }
    // keep the closest-to-stage + a uniform sample if over budget
    spots.sort(function () { return Math.random() - 0.5; });
    spots = spots.slice(0, maxN);
    var per = variants.map(function () { return []; });
    spots.forEach(function (s, i) { per[i % VAR].push(s); });
    var phonePts = [];
    var dummy = new THREE.Object3D();
    var shadowGeo = new THREE.PlaneGeometry(0.85, 0.85); shadowGeo.rotateX(-Math.PI / 2);
    var shadowInst = new THREE.InstancedMesh(shadowGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.85 }), spots.length);
    var si = 0;
    variants.forEach(function (vr, vi) {
      var list = per[vi]; if (!list.length) return;
      var im = new THREE.InstancedMesh(vr.geo, M.person, list.length); im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.userData.base = [];
      list.forEach(function (s, k) {
        var ry = Math.PI + rnd(-0.35, 0.35) + (s[0] * 0.012), sc = rnd(0.92, 1.07);
        dummy.position.set(s[0], 0, s[1]); dummy.rotation.set(0, ry, 0); dummy.scale.setScalar(sc); dummy.updateMatrix();
        im.setMatrixAt(k, dummy.matrix);
        var c = new THREE.Color().setScalar(rnd(0.75, 1.1)); im.setColorAt(k, c);
        im.userData.base.push({ x: s[0], z: s[1], ry: ry, sc: sc, ph: Math.random() * 6.28, jump: Math.random() < 0.55 });
        dummy.position.y = 0.006; dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); shadowInst.setMatrixAt(si++, dummy.matrix);
        if (vr.hand) phonePts.push({ mesh: im, k: k, local: vr.hand.clone() });
      });
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      g.add(im); crowdMeshes.push(im);
    });
    shadowInst.count = si; g.add(shadowInst);
    // phone screens glow
    var pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(phonePts.length * 3), 3));
    phones = new THREE.Points(pg, new THREE.PointsMaterial({ map: softDot, size: 0.32, color: C("#dfe8ff"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    phones.material.toneMapped = false; phones.frustumCulled = false; phones.userData.pts = phonePts; g.add(phones);
  })();

  // haze & dust (hall)
  var hazes = [];
  (function () {
    for (var i = 0; i < (MOBILE ? 8 : 16); i++) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), additiveMat(hazeTex, pick(["#7b5bff", "#ff3fd2", "#3fe0ff", "#9a8cff"]), 0.12));
      m.position.set(rnd(-12, 12), rnd(4, 10), rnd(-64, -26)); m.userData.v = rnd(-0.3, 0.3); G.hall.add(m); hazes.push(m);
    }
    var N = MOBILE ? 600 : 1500, pos = new Float32Array(N * 3);
    for (var k = 0; k < N; k++) { pos[k * 3] = rnd(-16, 16); pos[k * 3 + 1] = rnd(0.5, 12); pos[k * 3 + 2] = rnd(-66, -22); }
    var dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var dust = new THREE.Points(dg, new THREE.PointsMaterial({ map: softDot, size: 0.06, color: C("#cfc6ff"), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    dust.material.toneMapped = false; G.hall.add(dust); hazes.dust = dust;
    // street mist
    for (var s = 0; s < 5; s++) { var mm = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), additiveMat(hazeTex, "#6a5aa8", 0.08)); mm.position.set(rnd(-6, 12), rnd(1, 3), rnd(3, 12)); G.street.add(mm); hazes.push(mm); }
  })();

  // confetti for the finale
  var CONF_N = MOBILE ? 400 : 1000, confPos = new Float32Array(CONF_N * 3), confCol = new Float32Array(CONF_N * 3), confSeed = [];
  for (var ci = 0; ci < CONF_N; ci++) {
    confSeed.push({ x: rnd(-14, 14), y: rnd(0, 16), z: rnd(-62, -30), v: rnd(0.6, 1.4), ph: Math.random() * 6.28 });
    var cc = C(pick(["#f5ef3e", "#35c759", "#3a3fd6", "#ff3fd2", "#ffffff"])); confCol[ci * 3] = cc.r; confCol[ci * 3 + 1] = cc.g; confCol[ci * 3 + 2] = cc.b;
  }
  var confGeo = new THREE.BufferGeometry(); confGeo.setAttribute("position", new THREE.BufferAttribute(confPos, 3)); confGeo.setAttribute("color", new THREE.BufferAttribute(confCol, 3));
  var confetti = new THREE.Points(confGeo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0, depthWrite: false }));
  confetti.frustumCulled = false; G.hall.add(confetti);

  /* =========================================================
     CAMERA PATH (scroll progress → position / target)
     ========================================================= */
  var KEYS = [
    [0.00, [9.5, 2.1, 19], [0.6, 3.4, 0]],
    [0.07, [6.4, 1.8, 9.5], [0.2, 2.6, 0]],
    [0.12, [3.4, 1.72, 4.4], [-0.3, 2.1, 0]],
    [0.17, [0.25, 1.7, 2.6], [0, 1.75, -6]],
    [0.22, [0, 1.68, -1.2], [0, 1.7, -10]],
    [0.29, [0, 1.66, -9.4], [1.8, 1.65, -14]],
    [0.35, [1.15, 1.62, -13.7], [6.8, 1.55, -15.6]],
    [0.44, [2.1, 1.6, -14.5], [6.9, 1.55, -15.8]],
    [0.49, [0.3, 1.8, -17.2], [0, 2.6, -30]],
    [0.56, [0, 2.35, -23], [0, 4.2, -70]],
    [0.66, [-3, 4.4, -36], [0, 4.4, -72]],
    [0.76, [1.6, 3.0, -52], [0, 4.6, -72]],
    [0.84, [0, 2.6, -58.6], [0, 4.8, -72]],
    [0.92, [4.5, 8.2, -45], [0, 4.2, -68]],
    [1.00, [0, 11.5, -30], [0, 3.2, -66]]
  ];
  var posCurve = new THREE.CatmullRomCurve3(KEYS.map(function (k) { return new THREE.Vector3().fromArray(k[1]); }), false, "centripetal");
  var lookCurve = new THREE.CatmullRomCurve3(KEYS.map(function (k) { return new THREE.Vector3().fromArray(k[2]); }), false, "centripetal");
  var _p = new THREE.Vector3(), _l = new THREE.Vector3();
  function camAt(p) {
    var i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    var a = KEYS[i][0], b = KEYS[i + 1][0], u = clamp((p - a) / (b - a), 0, 1);
    u = lerp(u, u * u * (3 - 2 * u), 0.55);
    var t = (i + u) / (KEYS.length - 1);
    posCurve.getPoint(t, _p); lookCurve.getPoint(t, _l);
  }

  /* =========================================================
     POST: bloom + film grade (tone-map, grain, vignette, CA)
     ========================================================= */
  var composer = null, bloom = null, grade = null;
  if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.ShaderPass) {
    var rt = new THREE.WebGLRenderTarget(vw * PR, vh * PR, { type: THREE.HalfFloatType });
    composer = new THREE.EffectComposer(renderer, rt);
    composer.setPixelRatio(PR); composer.setSize(vw, vh);
    composer.addPass(new THREE.RenderPass(scene, cam));
    bloom = new THREE.UnrealBloomPass(new THREE.Vector2(vw / 2, vh / 2), 0.75, 0.55, 0.85);
    composer.addPass(bloom);
    grade = new THREE.ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uExpo: { value: 1.15 }, uRes: { value: new THREE.Vector2(vw, vh) }, uCA: { value: 0.0015 }, uFlash: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
      fragmentShader: [
        "uniform sampler2D tDiffuse; uniform float uTime; uniform float uExpo; uniform vec2 uRes; uniform float uCA; uniform float uFlash; varying vec2 vUv;",
        "vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }",
        "float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }",
        "void main(){ vec2 d=vUv-.5; float r2=dot(d,d);",
        " vec3 c; c.r=texture2D(tDiffuse,vUv+d*uCA*(1.+r2*4.)).r; c.g=texture2D(tDiffuse,vUv).g; c.b=texture2D(tDiffuse,vUv-d*uCA*(1.+r2*4.)).b;",
        " c*=uExpo; c+=uFlash; c=aces(c);",
        " c=pow(c,vec3(1./2.2));",
        " c*=1.-smoothstep(.18,.85,r2*1.25)*.62;",
        " c+= (h(vUv*uRes+fract(uTime)*91.7)-.5)*.045;",
        " c=mix(c, c*vec3(1.02,.98,1.06), .5);",
        " gl_FragColor=vec4(c,1.); }"
      ].join("\n")
    });
    composer.addPass(grade);
    renderer.toneMapping = THREE.NoToneMapping;
  } else {
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputEncoding = THREE.sRGBEncoding;
  }

  /* =========================================================
     LOOP
     ========================================================= */
  window.NQ_CLUB = { setLevel: function (l) { st.level = l; }, progress: function () { return st.sp; } };
  window.addEventListener("pointermove", function (e) { st.mx = e.clientX / innerWidth * 2 - 1; st.my = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    if (w !== vw || Math.abs(h - vh) > 120) {
      vw = w; vh = h; renderer.setSize(vw, vh, false); cam.aspect = vw / vh; cam.fov = vw / vh < 1 ? 70 : 52; cam.updateProjectionMatrix();
      if (composer) { composer.setSize(vw, vh); grade.uniforms.uRes.value.set(vw, vh); }
    }
    measure();
  }
  window.addEventListener("resize", resize);
  measure();

  var clock = new THREE.Clock(), BPM = 128, ledT = 0, dummy = new THREE.Object3D(), tmpV = new THREE.Vector3(), tmpM = new THREE.Matrix4();
  var fpsAcc = 0, fpsN = 0, quality = 2;
  var col = new THREE.Color();
  function zoneVis(p) {
    G.street.visible = p < 0.3; G.corr.visible = p > 0.1 && p < 0.52; G.lobby.visible = p > 0.22 && p < 0.62; G.hall.visible = p > 0.4;
  }
  function tick() {
    requestAnimationFrame(tick);
    measure();
    if (!st.visible || document.hidden) { clock.getDelta(); return; }
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    // adaptive quality
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 2) { var fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (fps < 32 && quality > 0) { quality--; if (quality === 1) { PR = Math.max(0.7, PR * 0.75); renderer.setPixelRatio(PR); if (composer) composer.setPixelRatio(PR); resize(); } else if (bloom) { bloom.enabled = false; } } }
    st.sp += (st.p - st.sp) * (reduced ? 1 : 1 - Math.pow(0.002, dt));
    st.smx += (st.mx - st.smx) * 0.04; st.smy += (st.my - st.smy) * 0.04;
    var p = st.sp;
    zoneVis(p);
    var beat = t * BPM / 60, kick = Math.pow(1 - (beat % 1), 3), lvl = st.level > 0.04 ? st.level : 0;
    kick = Math.max(kick * (0.65 + lvl), lvl);
    var hallE = sstep(0.5, 0.6, p), stageE = sstep(0.7, 0.8, p) * (1 - sstep(0.97, 1, p) * 0.3), finale = sstep(0.88, 0.96, p);
    var energy = 0.35 + hallE * 0.45 + stageE * 0.35 + lvl * 0.4;
    U.uTime.value = t; U.uEnergy.value = energy;

    // camera
    camAt(p);
    if (window.NQ_CAM) { _p.fromArray(window.NQ_CAM[0]); _l.fromArray(window.NQ_CAM[1]); }
    var sway = MOBILE ? 0 : 1;
    cam.position.copy(_p);
    cam.position.x += Math.sin(t * 0.5) * 0.03 + st.smx * 0.25 * sway;
    cam.position.y += Math.sin(t * 0.7) * 0.025 - st.smy * 0.12 * sway + (hallE * kick * 0.012);
    _l.x += st.smx * 0.6 * sway; _l.y -= st.smy * 0.35 * sway;
    cam.lookAt(_l);
    // keep the subject clear of the chapter copy (copy sits left on desktop)
    if (vw / vh > 1.1 && !window.NQ_CAM) cam.rotateY(0.13 * (1 - sstep(0.86, 0.95, p)));

    // fog per zone
    var inside = sstep(0.17, 0.24, p), inHall = sstep(0.5, 0.58, p);
    col.set(0x0b0a14).lerp(new THREE.Color(0x120a1e), inside).lerp(new THREE.Color(0x150a26), inHall); fog.color.copy(col);
    fog.density = lerp(lerp(0.024, 0.03, inside), 0.017, inHall);
    hemi.intensity = lerp(0.55, 0.32, inside);
    var lobbyZ = sstep(0.28, 0.34, p) * (1 - sstep(0.48, 0.55, p));
    U.uRim.value.setRGB(0.2, 0.05, 0.18).lerp(new THREE.Color(0.16, 0.08, 0.3), inside).lerp(new THREE.Color(0.1, 0.08, 0.06), lobbyZ).lerp(new THREE.Color(0.3, 0.1, 0.55), inHall);
    if (inHall > 0) U.uRim.value.multiplyScalar(0.75 + kick * 0.5);

    // street
    if (G.street.visible) {
      var rp = rainGeo.attributes.position.array;
      for (var i = 0; i < RAIN_N; i++) {
        var r = rainSeed[i]; r.y -= r.v * dt; if (r.y < 0) { r.y = 12; r.x = rnd(-14, 18); r.z = rnd(-0.3, 22); }
        rp[i * 6] = r.x; rp[i * 6 + 1] = r.y; rp[i * 6 + 2] = r.z; rp[i * 6 + 3] = r.x - 0.02; rp[i * 6 + 4] = r.y + 0.32; rp[i * 6 + 5] = r.z + 0.03;
      }
      rainGeo.attributes.position.needsUpdate = true;
      L.neon.intensity = 3.0 + Math.sin(t * 40) * 0.08 + (Math.random() < 0.004 ? -2 : 0);
    }
    var streetOn = 1 - inside;
    L.lamp1.intensity = 2.4 * streetOn; L.lamp2.intensity = 2.4 * streetOn; L.lamp3.intensity = 2.0 * streetOn;
    L.neon.intensity *= (0.3 + 0.7 * streetOn);
    var corrOn = sstep(0.12, 0.2, p) * (1 - sstep(0.4, 0.5, p));
    L.corr1.intensity = 2.2 * corrOn * (0.85 + kick * 0.3); L.corr2.intensity = 2.2 * corrOn;
    var lobbyOn = sstep(0.25, 0.32, p) * (1 - sstep(0.55, 0.62, p));
    L.press.intensity = 3.0 * lobbyOn; L.lobby.intensity = 1.6 * lobbyOn;
    L.door.intensity = 2.4 * (1 - sstep(0.3, 0.4, p));

    // hall
    var hallOn = sstep(0.42, 0.52, p);
    if (G.hall.visible) {
      L.stage.intensity = (4 + kick * 3 * energy) * hallOn; L.back.intensity = (3 + kick * 2.5) * hallOn;
      L.wash.intensity = (1.6 + Math.sin(t * 0.7) * 0.8) * hallOn; L.bar.intensity = 2.2 * hallOn;
      L.stage.color.setHSL((t * 0.05) % 1, 0.85, 0.5);
      spot1.intensity = spot2.intensity = 4 * hallOn * (0.7 + kick * 0.6);
      spot1.target.position.set(Math.sin(t * 0.6) * 10, 0, -40 + Math.cos(t * 0.4) * 12);
      spot2.target.position.set(Math.sin(t * 0.5 + 2) * 10, 0, -40 + Math.cos(t * 0.45 + 1) * 12);
      // moving heads
      var mode = Math.floor(beat / 16) % 4;
      heads.forEach(function (h, k) {
        var ph = h.ph, pan, tilt;
        if (mode === 0) { pan = Math.sin(t * 0.8 + k * 0.5) * 0.9; tilt = 0.5 + Math.sin(t * 0.6 + k) * 0.35; }
        else if (mode === 1) { pan = (k % 2 ? 1 : -1) * (0.3 + Math.sin(t * 1.2) * 0.5); tilt = 0.75 + Math.sin(t * 2.4 + k * 0.3) * 0.2; }
        else if (mode === 2) { pan = Math.sin(t * 1.6 + k * 0.9) * 0.4; tilt = 0.25 + 0.15 * Math.sin(t * 3 + k); }
        else { pan = h.x * -0.05 + Math.sin(t * 0.5) * 0.3; tilt = 0.6 + Math.sin(t + ph) * 0.3; }
        h.yoke.rotation.y = pan; h.head.rotation.x = h.hang ? -tilt : 0.1 + Math.sin(t * 0.9 + k) * 0.38;
        var hue = ((t * 0.04 + (mode === 2 ? 0 : k * 0.08)) % 1);
        h.beam.material.uniforms.uColor.value.setHSL(mode === 3 ? 0.83 : hue, mode === 1 ? 0.2 : 0.9, 0.55).convertSRGBToLinear();
        var strobe = mode === 2 && stageE > 0.5 ? (Math.sin(t * 30 + k) > 0.6 ? 1.6 : 0.15) : 1;
        h.beam.material.uniforms.uInt.value = (0.35 + kick * 0.5 * energy) * hallOn * strobe * (h.hang ? 1 : 0.8);
        h.lens.material.color.copy(h.beam.material.uniforms.uColor.value).multiplyScalar(6 * strobe);
      });
      blinders.forEach(function (b, k) { b.material.color.setRGB(1, 0.85, 0.6).multiplyScalar(0.1 + (stageE > 0.3 && beat % 8 > 7 ? 9 * kick : 0)); });
      flames.forEach(function (f, k) {
        var fire = stageE > 0.4 && (Math.floor(beat / 4) % 4 === 3) ? Math.pow(1 - (beat % 1), 1.5) : 0;
        f.material.uniforms.uInt.value = fire * 2.2; f.scale.set(1, 0.6 + fire * 0.6, 1);
      });
      // crowd groove
      var jumpAmp = 0.04 + 0.16 * energy;
      crowdMeshes.forEach(function (im) {
        var base = im.userData.base;
        for (var k = 0; k < base.length; k++) {
          var b = base[k], bt = beat * Math.PI + b.ph;
          var y = b.jump ? Math.max(0, Math.sin(bt)) * jumpAmp : Math.abs(Math.sin(bt)) * 0.03;
          dummy.position.set(b.x, y, b.z); dummy.rotation.set(Math.sin(bt * 0.5) * 0.03, b.ry + Math.sin(t * 0.4 + b.ph) * 0.12, Math.sin(bt) * 0.035);
          dummy.scale.setScalar(b.sc); dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
      });
      var pts = phones.userData.pts, pa = phones.geometry.attributes.position.array;
      for (var q = 0; q < pts.length; q++) { pts[q].mesh.getMatrixAt(pts[q].k, tmpM); tmpV.copy(pts[q].local).applyMatrix4(tmpM); pa[q * 3] = tmpV.x; pa[q * 3 + 1] = tmpV.y; pa[q * 3 + 2] = tmpV.z; }
      phones.geometry.attributes.position.needsUpdate = true;
      phones.material.opacity = 0.6 + 0.4 * Math.sin(t * 2);
      hazes.forEach(function (h) { if (h.userData.v != null) { h.position.x += h.userData.v * dt; if (Math.abs(h.position.x) > 14) h.userData.v *= -1; } h.lookAt(cam.position); });
      if (hazes.dust) hazes.dust.rotation.y = Math.sin(t * 0.05) * 0.02;
      // LED at ~30fps
      ledT += dt;
      if (ledT > 1 / 30) { ledT = 0; if (ledVideo && ledVideo.paused) { var pr = ledVideo.play(); if (pr && pr.catch) pr.catch(function () {}); } drawLED(t, kick * energy, mode === 2 ? 2 : 1); }
      // confetti finale
      confetti.material.opacity = finale;
      if (finale > 0.01) {
        var ca = confGeo.attributes.position.array;
        for (var c2 = 0; c2 < CONF_N; c2++) { var s = confSeed[c2]; s.y -= s.v * dt; if (s.y < 0) s.y = 16; ca[c2 * 3] = s.x + Math.sin(t * 1.3 + s.ph) * 0.4; ca[c2 * 3 + 1] = s.y; ca[c2 * 3 + 2] = s.z + Math.cos(t + s.ph) * 0.3; }
        confGeo.attributes.position.needsUpdate = true;
      }
    } else if (ledVideo && !ledVideo.paused) ledVideo.pause();

    if (grade) {
      grade.uniforms.uTime.value = t;
      grade.uniforms.uExpo.value = 1.1 + hallE * 0.1;
      grade.uniforms.uFlash.value = (stageE > 0.5 && Math.floor(beat / 8) % 2 === 1 ? Math.pow(1 - (beat % 1), 8) * 0.06 : 0);
      grade.uniforms.uCA.value = 0.0004 + Math.min(0.004, Math.abs(st.p - st.sp) * 0.03);
    }
    if (bloom) bloom.strength = 0.62 + kick * 0.18 * energy + stageE * 0.15;
    if (composer) composer.render(); else renderer.render(scene, cam);
  }
  camAt(0); cam.position.copy(_p); cam.lookAt(_l);
  tick();
})();
