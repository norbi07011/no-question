/* =========================================================
   NO QUESTION EVENTS — home: exploded microphone
   A photoreal Cycles render (frame sequence) scrubbed by scroll.
   Callouts follow the parts using per-frame anchors exported
   from the 3D scene (js/mic-data.js).
   ========================================================= */
(function () {
  "use strict";
  var sec = document.getElementById("nqMic");
  if (!sec) return;
  var D = window.NQ_MIC || { n: 0, anchors: [] };
  var I18N = window.NQ_I18N || {};
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cv = sec.querySelector(".mic__canvas"), ctx = cv.getContext("2d");
  var stage = sec.querySelector(".mic__stage"), lab = sec.querySelector(".mic__labels");
  var chs = [].slice.call(sec.querySelectorAll(".mic__ch"));
  var bar = sec.querySelector(".mic__bar i"), load = sec.querySelector(".mic__load");
  var N = D.n, KEYS = ["grille", "foam", "capsule", "shock", "body", "trafo", "xlr"];
  function t(k) { var l = document.documentElement.lang || "nl"; return ((I18N[l] || {})[k]) || ((I18N.nl || {})[k]) || ""; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sm(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- callouts ---------- */
  var labels = KEYS.map(function (k, i) {
    var el = document.createElement("div");
    el.className = "mlab";
    el.innerHTML = '<i class="mlab__dot"><b>' + (i + 1) + '</b></i><i class="mlab__line"></i>' +
      '<div class="mlab__card"><span class="mlab__n">' + pad(i + 1) + '</span><strong data-i18n="mic.p' + (i + 1) + '">' + t("mic.p" + (i + 1)) +
      '</strong><small data-i18n="mic.p' + (i + 1) + 's">' + t("mic.p" + (i + 1) + "s") + "</small></div>";
    lab.appendChild(el);
    return { el: el, line: el.querySelector(".mlab__line"), card: el.querySelector(".mlab__card"), a: 0 };
  });
  var legend = sec.querySelector(".mic__legend");
  if (legend) legend.innerHTML = KEYS.map(function (k, i) {
    return '<li><b>' + pad(i + 1) + '</b><span data-i18n="mic.p' + (i + 1) + '">' + t("mic.p" + (i + 1)) + "</span></li>";
  }).join("");

  /* ---------- frames: progressive preload (keyframes first) ---------- */
  var mob = false, dir = "", imgs = [], ready = [], loaded = 0, started = false;
  function order() {
    var seen = {}, out = [];
    [16, 8, 4, 2, 1].forEach(function (step) { for (var i = 0; i < N; i += step) if (!seen[i]) { seen[i] = 1; out.push(i); } });
    if (!seen[N - 1]) out.push(N - 1);
    return out;
  }
  function start() {
    if (started || !N) return; started = true;
    dir = "assets/mic/" + (mob ? "m" : "d") + "/";
    imgs = new Array(N); ready = new Array(N);
    var q = order(), active = 0, MAX = 6;
    function next() {
      while (active < MAX && q.length) {
        (function (i) {
          var im = new Image(); im.decoding = "async"; active++;
          im.onload = function () {
            (im.decode ? im.decode() : Promise.resolve()).catch(function () {}).then(function () {
              ready[i] = true; loaded++; active--; dirty = true;
              if (load) load.style.transform = "scaleX(" + (loaded / N).toFixed(3) + ")";
              if (loaded >= N && load) load.parentNode.classList.add("is-done");
              next();
            });
          };
          im.onerror = function () { active--; next(); };
          im.src = dir + "f" + ("00" + i).slice(-3) + ".webp"; imgs[i] = im;
        })(q.shift());
      }
    }
    next();
  }
  function nearest(f) {
    if (ready[f]) return f;
    for (var d = 1; d < N; d++) { if (ready[f - d]) return f - d; if (ready[f + d]) return f + d; }
    return -1;
  }

  /* ---------- layout ---------- */
  var W = 0, H = 0, S = 0, L = 0, T = 0, dpr = 1, dirty = true;
  function layout() {
    W = sec.clientWidth; H = window.innerHeight; mob = W < 860;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (mob) { S = Math.min(W * 1.06, H * 0.6); L = (W - S) / 2; T = Math.max(56, H * 0.08); }
    else { S = Math.min(H * 1.02, W * 0.6); L = W - S - Math.max(W * 0.04, (W - S) * 0.08); T = (H - S) / 2; }
    stage.style.width = stage.style.height = S + "px";
    stage.style.transform = "translate3d(" + L.toFixed(1) + "px," + T.toFixed(1) + "px,0)";
    cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr);
    sec.classList.toggle("is-mob", mob);
    dirty = true;
  }
  layout();
  window.addEventListener("resize", function () { var was = mob; layout(); if (was !== mob && started) { started = false; loaded = 0; start(); } });

  /* ---------- scroll ---------- */
  var prog = 0, s = 0, visible = false;
  function measure() {
    var r = sec.getBoundingClientRect(), tot = r.height - innerHeight;
    prog = clamp(-r.top / Math.max(1, tot), 0, 1);
    visible = r.top < innerHeight * 1.2 && r.bottom > -innerHeight * 0.2;
    if (r.top < innerHeight * 2.5) start();
  }
  window.addEventListener("scroll", measure, { passive: true }); measure();

  var lastF = -1, lastS = -1;
  function draw(fx) {
    var f0 = Math.floor(fx), f1 = Math.min(N - 1, f0 + 1), k = fx - f0;
    var a = nearest(f0), b = nearest(f1);
    if (a < 0) return;
    ctx.globalAlpha = 1; ctx.drawImage(imgs[a], 0, 0, cv.width, cv.height);
    if (b >= 0 && b !== a && k > 0.02) { ctx.globalAlpha = k; ctx.drawImage(imgs[b], 0, 0, cv.width, cv.height); ctx.globalAlpha = 1; }
  }
  function anchor(fx, key) {
    var f0 = Math.floor(fx), f1 = Math.min(N - 1, f0 + 1), k = fx - f0;
    var A = D.anchors[f0][key], B = D.anchors[f1][key];
    return [L + (A[0] + (B[0] - A[0]) * k) * S, T + (A[1] + (B[1] - A[1]) * k) * S];
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !N) return;
    measure();
    s += (prog - s) * (reduced ? 1 : 0.14);
    if (Math.abs(prog - s) < 0.0004) s = prog;
    var fp = clamp(s / 0.86, 0, 1) * (N - 1);
    if (Math.abs(fp - lastF) > 0.002 || dirty) { draw(fp); lastF = fp; dirty = false; }
    if (Math.abs(s - lastS) < 0.00005 && !labels.some(function (l) { return l.pending; })) return;
    lastS = s;

    // copy phases
    var ph = [1 - sm(0.16, 0.24, s), sm(0.3, 0.38, s) * (1 - sm(0.76, 0.82, s)), sm(0.84, 0.92, s)];
    chs.forEach(function (c, i) {
      var o = ph[i] || 0;
      c.style.opacity = o.toFixed(3);
      c.style.transform = "translate3d(0," + ((1 - o) * 24).toFixed(1) + "px,0)";
      c.classList.toggle("is-on", o > 0.5);
    });
    if (bar) bar.style.transform = "scaleX(" + s.toFixed(4) + ")";

    // callouts: perpendicular to the mic's on-screen axis, alternating sides
    var f0 = Math.floor(fp), e = D.anchors[f0].e;
    var top = anchor(fp, "grille"), bot = anchor(fp, "xlr");
    var ax = top[0] - bot[0], ay = top[1] - bot[1], al = Math.hypot(ax, ay) || 1;
    var nx = ay / al, ny = -ax / al; if (ny > 0) { nx = -nx; ny = -ny; } // n points "up"
    var fade = 1 - sm(0.78, 0.84, s);
    var copyR = 0; chs.forEach(function (c) { if (parseFloat(c.style.opacity) > 0.05) { var r = c.getBoundingClientRect(); copyR = Math.max(copyR, r.left + Math.min(r.width, c.scrollWidth) + 16); } });
    labels.forEach(function (l, i) {
      var vis = sm(0.5 + i * 0.05, 0.62 + i * 0.05, e) * fade;
      l.a = vis;
      l.el.style.opacity = vis.toFixed(3);
      if (vis < 0.01) return;
      var p = anchor(fp, KEYS[i]);
      var side = i % 2 === 0 ? 1 : -1;
      var len = mob ? 0 : (S * 0.13 + (i === 4 ? S * 0.02 : 0)) * (0.7 + 0.3 * vis);
      var ex = nx * side * len, ey = ny * side * len;
      if (!mob) { // keep cards clear of the copy column and the viewport edge
        var cw = l.cw || (l.cw = l.card.offsetWidth || 200), x = p[0] + ex;
        if ((ex < 0 && x - cw - 10 < copyR) || (ex >= 0 && x + cw + 10 > W - 16)) { ex = -ex; ey = -ey; }
      }
      l.el.style.transform = "translate3d(" + p[0].toFixed(1) + "px," + p[1].toFixed(1) + "px,0)";
      l.line.style.width = len.toFixed(1) + "px";
      l.line.style.transform = "rotate(" + (Math.atan2(ey, ex) * 180 / Math.PI).toFixed(2) + "deg)";
      var right = ex >= 0;
      l.card.style.transform = "translate3d(" + ex.toFixed(1) + "px," + ey.toFixed(1) + "px,0) translate(" + (right ? "10px" : "calc(-100% - 10px)") + ",-50%)";
      l.card.style.textAlign = right ? "left" : "right";
    });
  }
  requestAnimationFrame(frame);
  // relabel after language switch
  document.addEventListener("click", function (ev) {
    if (ev.target.closest && ev.target.closest("[data-lang]")) setTimeout(function () { lastS = -1; labels.forEach(function (l) { l.cw = 0; }); }, 40);
  });
})();
