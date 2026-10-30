/* =========================================================
   NO QUESTION EVENTS — scroll film (home)
   Real frames from our shows, scrubbed by scroll like an
   Apple product page. Frames blend into each other, so even
   a slow scroll stays buttery; every frame we already have
   is used while the rest streams in (never a black screen).
   ========================================================= */
(function () {
  "use strict";
  var sec = document.getElementById("nqFilm");
  if (!sec) return;
  var cv = document.getElementById("nqfCanvas"), g = cv.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOBILE = Math.min(window.innerWidth, window.innerHeight) < 700 || window.matchMedia("(pointer: coarse)").matches;
  var CH = 4, PER = 48, N = CH * PER, KIND = MOBILE ? "m" : "d";
  var frames = new Array(N), loaded = new Uint8Array(N), nLoaded = 0;
  function pad(n) { return n < 10 ? "00" + n : n < 100 ? "0" + n : "" + n; }
  function src(i) { return "assets/film/" + KIND + "/c" + (Math.floor(i / PER) + 1) + "_" + pad(i % PER + 1) + ".webp"; }

  /* ---------- progressive loading: coarse → fine ---------- */
  var order = [], seen = new Uint8Array(N);
  var STEP = MOBILE ? 2 : 1;   // phones: every 2nd frame (blending keeps it smooth, half the memory)
  [24, 12, 6, 4, 2, 1].forEach(function (s) { if (s < STEP) return; for (var i = 0; i < N; i += s) if (!seen[i] && (i % PER) % STEP === 0) { seen[i] = 1; order.push(i); } });
  var qi = 0, active = 0, MAXC = 6;
  function pump() {
    while (active < MAXC && qi < order.length) {
      (function (i) {
        var im = new Image(); active++;
        im.decoding = "async";
        im.onload = function () { frames[i] = im; loaded[i] = 1; nLoaded++; active--; need = true; pump(); };
        im.onerror = function () { active--; pump(); };
        im.src = src(i);
      })(order[qi++]);
    }
  }
  pump();
  function nearest(i) {
    if (loaded[i]) return i;
    for (var d = 1; d < N; d++) { if (i - d >= 0 && loaded[i - d]) return i - d; if (i + d < N && loaded[i + d]) return i + d; }
    return -1;
  }

  /* ---------- sizing ---------- */
  var W = 0, H = 0, DPR = 1, blur = document.createElement("canvas"), bg = blur.getContext("2d");
  blur.width = 27; blur.height = 48;
  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 2 : 1.75);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); need = true;
  }
  window.addEventListener("resize", size);

  /* ---------- scroll ---------- */
  var p = 0, sp = 0, need = true, visible = true;
  function measure() {
    var r = sec.getBoundingClientRect(), total = r.height - innerHeight;
    p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
    visible = r.top < innerHeight && r.bottom > 0;
    window.NQ_GL_PAUSE = visible && r.bottom > innerHeight * 0.5;
  }
  window.addEventListener("scroll", measure, { passive: true });

  /* ---------- chapters / HUD ---------- */
  var chs = Array.prototype.slice.call(sec.querySelectorAll(".nqf__ch")), bar = document.getElementById("nqfBar"), hud = Array.prototype.slice.call(sec.querySelectorAll(".nqf__hud button"));
  var loadEl = sec.querySelector(".nqf__load i"), loadBox = sec.querySelector(".nqf__load");
  hud.forEach(function (b) { b.addEventListener("click", function () { go(+b.dataset.go); }); });
  function go(t) {
    var top = sec.offsetTop + t * (sec.offsetHeight - innerHeight);
    if (window.NQ_LENIS) window.NQ_LENIS.scrollTo(top, { duration: 1.6 }); else window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
  }
  var skip = document.getElementById("nqfSkip");
  if (skip) skip.addEventListener("click", function () { go(1); setTimeout(function () { window.scrollBy(0, 2); }, 1700); });
  function chapters(t) {
    chs.forEach(function (c) {
      var a = +c.dataset.from, b = +c.dataset.to, on = t >= a && t <= b;
      var k = on ? Math.min(1, (t - a) / 0.03, (b - t) / 0.03) : 0;
      c.style.opacity = Math.max(0, Math.min(1, k)).toFixed(3);
      c.style.transform = "translate3d(0," + ((1 - Math.min(1, k)) * 40).toFixed(1) + "px,0)";
      c.classList.toggle("is-on", k > 0.5);
    });
    var ci = Math.min(CH - 1, Math.floor(t * CH));
    hud.forEach(function (b, i) { b.classList.toggle("is-on", i === ci); });
    if (bar) bar.style.transform = "scaleY(" + t.toFixed(4) + ")";
  }

  /* ---------- drawing ---------- */
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function drawCover(im, x, y, w, h, zoom, alpha) {
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, s = Math.max(w / iw, h / ih) * zoom;
    var dw = iw * s, dh = ih * s;
    g.globalAlpha = alpha; g.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  var lastKey = "";
  function draw(f, t) {
    var i0 = Math.floor(f / STEP) * STEP, fr = (f - i0) / STEP, a = nearest(i0), b = nearest(Math.min(N - STEP, i0 + STEP));
    if (a < 0) return;
    var key = a + "|" + b + "|" + fr.toFixed(3) + "|" + W + "|" + H;
    if (key === lastKey) return; lastKey = key;
    var A = frames[a], B = b >= 0 ? frames[b] : null;
    var local = (f % PER) / PER, zoom = 1.02 + local * 0.07;            // slow push-in inside every chapter
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.globalAlpha = 1; g.fillStyle = "#06060a"; g.fillRect(0, 0, W, H);
    var land = W / H > 0.8;
    // ambient background: the same frame, blurred & dimmed (cheap blur via tiny canvas)
    bg.globalAlpha = 1; bg.drawImage(A, 0, 0, 27, 48);
    if (B && fr > 0.01) { bg.globalAlpha = fr; bg.drawImage(B, 0, 0, 27, 48); }
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.globalAlpha = land ? 0.55 : 1; drawCover(blur, 0, 0, W, H, 1.15, land ? 0.55 : 1);
    if (land) {
      // portrait "screen" with the sharp frame, slightly right of centre
      var fh = H * 0.84, fw = fh * 9 / 16, fx = W * 0.62 - fw / 2, fy = (H - fh) / 2 + 10;
      fx = Math.min(fx, W - fw - Math.max(90, W * 0.08));
      g.save(); g.globalAlpha = 1;
      g.shadowColor = "rgba(0,0,0,.7)"; g.shadowBlur = 60; g.shadowOffsetY = 30;
      rr(fx, fy, fw, fh, 28); g.fillStyle = "#000"; g.fill();
      g.shadowColor = "transparent";
      rr(fx, fy, fw, fh, 28); g.clip();
      drawCover(A, fx, fy, fw, fh, zoom, 1);
      if (B && fr > 0.01) drawCover(B, fx, fy, fw, fh, zoom, fr);
      g.restore();
      g.globalAlpha = 1; g.strokeStyle = "rgba(255,255,255,.16)"; g.lineWidth = 1; rr(fx + 0.5, fy + 0.5, fw - 1, fh - 1, 28); g.stroke();
    } else {
      drawCover(A, 0, 0, W, H, zoom, 1);
      if (B && fr > 0.01) drawCover(B, 0, 0, W, H, zoom, fr);
    }
    g.globalAlpha = 1;
  }

  function tick() {
    requestAnimationFrame(tick);
    measure();
    if (!visible && !need) return;
    sp += (p - sp) * (reduced ? 1 : 0.14);
    if (Math.abs(p - sp) < 0.00005) sp = p;
    var f = sp * (N - 1);
    draw(f, sp); need = false;
    chapters(sp);
    if (loadEl) { var k = nLoaded / order.length; loadEl.style.transform = "scaleX(" + k.toFixed(3) + ")"; if (k >= 1 && loadBox && !loadBox.classList.contains("is-done")) loadBox.classList.add("is-done"); }
  }
  size(); measure(); tick();
})();
