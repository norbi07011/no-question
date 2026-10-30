/* =========================================================
   NO QUESTION EVENTS — hero logo
   The No Question logo assembles itself from thousands of
   glowing particles, floats in 3D, reacts to the cursor and
   bursts towards the viewer when you scroll into the club.
   ========================================================= */
(function () {
  "use strict";
  var cv = document.getElementById("heroLogo");
  if (!cv || !window.NQ_LOGO) return;
  var hero = cv.closest(".hero") || cv.parentNode;
  var ctx = cv.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, P = [], ready = false, t0 = 0, mouse = { x: -9999, y: -9999, on: false }, exitP = 0, visible = true;
  var img = new Image();
  var logoW = 0, logoH = 0, cx = 0, cy = 0;

  function layout() {
    var r = hero.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + "px"; cv.style.height = H + "px";
    var mobile = W < 900;
    logoW = mobile ? Math.min(W * 0.82, 520) : Math.min(W * 0.4, 660);
    logoH = logoW * 242 / 892;
    cx = mobile ? W / 2 : W * 0.7;
    cy = mobile ? Math.max(130, H * 0.2) : H * 0.47;
    if (img.complete && img.naturalWidth) sample();
  }

  function sample() {
    var sw = Math.round(logoW), sh = Math.round(logoH);
    var off = document.createElement("canvas"); off.width = sw; off.height = sh;
    var o = off.getContext("2d"); o.drawImage(img, 0, 0, sw, sh);
    var data;
    try { data = o.getImageData(0, 0, sw, sh).data; } catch (e) { data = null; }
    var old = P; P = [];
    var step = Math.max(2, Math.round(logoW / 230));
    if (!data) { ready = true; return; }
    for (var y = 0; y < sh; y += step) {
      for (var x = 0; x < sw; x += step) {
        var k = (y * sw + x) * 4;
        if (data[k + 3] < 140) continue;
        var r = data[k], g = data[k + 1], b = data[k + 2];
        var white = r > 225 && g > 225 && b > 225;
        var p = old[P.length] || {};
        p.tx = x - sw / 2; p.ty = y - sh / 2; p.tz = 0;
        p.c = white ? "255,255,255" : r + "," + g + "," + b;
        p.white = white;
        p.s = step * (white ? 0.62 : 0.78);
        if (p.x === undefined) {
          var a = Math.random() * Math.PI * 2, d = 500 + Math.random() * 900;
          p.x = Math.cos(a) * d; p.y = (Math.random() - 0.5) * 900; p.z = -400 - Math.random() * 1400;
          p.delay = Math.random() * 0.9 + (x / sw) * 0.5;
          p.ph = Math.random() * 6.28;
        }
        P.push(p);
      }
    }
    ready = true;
  }

  img.onload = function () { layout(); t0 = performance.now(); };
  img.src = window.NQ_LOGO;
  window.addEventListener("resize", function () { clearTimeout(layout._t); layout._t = setTimeout(layout, 120); });
  hero.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; });
  hero.addEventListener("pointerleave", function () { mouse.on = false; });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(hero);

  function ease(x) { return x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 4); }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!ready || !visible || document.hidden) return;
    var t = (now - t0) / 1000;
    var r = hero.getBoundingClientRect();
    exitP = Math.max(0, Math.min(1, -r.top / (r.height * 0.85)));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // soft halo behind the logo
    var haloA = Math.min(1, t / 2) * (1 - exitP);
    if (haloA > 0) {
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, logoW * 0.75);
      g.addColorStop(0, "rgba(120,80,255," + 0.16 * haloA + ")");
      g.addColorStop(0.5, "rgba(60,200,140," + 0.06 * haloA + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    var rotY = reduced ? 0 : Math.sin(t * 0.45) * 0.32 + (mouse.on ? (mouse.x - cx) / W * 0.5 : 0);
    var rotX = reduced ? 0 : Math.sin(t * 0.33) * 0.1 + (mouse.on ? (mouse.y - cy) / H * 0.35 : 0);
    var cyR = Math.cos(rotY), syR = Math.sin(rotY), cxR = Math.cos(rotX), sxR = Math.sin(rotX);
    var FOV = 900, sweep = ((t * 0.35) % 2.2) - 0.6; // light sweep position (-0.6..1.6)
    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      var k = reduced ? 1 : ease((t - 0.2 - p.delay) / 1.6);
      // idle breathing
      var bz = Math.sin(t * 1.6 + p.ph) * 4 * k;
      var lx = p.x + (p.tx - p.x) * k, ly = p.y + (p.ty - p.y) * k, lz = p.z + (p.tz + bz - p.z) * k;
      // exit burst: fly towards viewer and outward
      if (exitP > 0) {
        var e = exitP * exitP;
        lx += p.tx * e * 2.2 + Math.cos(p.ph) * 300 * e; ly += p.ty * e * 2.2 + Math.sin(p.ph) * 300 * e; lz += 700 * e;
      }
      // rotate in 3D
      var x1 = lx * cyR + lz * syR, z1 = -lx * syR + lz * cyR;
      var y1 = ly * cxR - z1 * sxR, z2 = ly * sxR + z1 * cxR;
      var sc = FOV / (FOV - z2);
      if (sc <= 0) continue;
      var sx = cx + x1 * sc, sy = cy + y1 * sc;
      // cursor repulsion
      if (mouse.on && k > 0.9) {
        var dx = sx - mouse.x, dy = sy - mouse.y, d2 = dx * dx + dy * dy, R = 90;
        if (d2 < R * R) { var f = (1 - Math.sqrt(d2) / R) * 26; var dd = Math.sqrt(d2) || 1; sx += dx / dd * f; sy += dy / dd * f; }
      }
      var a = (0.25 + 0.75 * k) * (1 - exitP * 0.9);
      // light sweep makes a band of particles flare
      var u = (p.tx / logoW + 0.5) - sweep, flare = Math.max(0, 1 - Math.abs(u) * 7);
      var s = p.s * sc * (1 + flare * 0.6);
      ctx.fillStyle = "rgba(" + (p.white && flare > 0 ? "255,255,255" : p.c) + "," + Math.min(1, a + flare * 0.5).toFixed(3) + ")";
      ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
      if (flare > 0.3 || (!p.white && k > 0.95 && (i % 5 === 0))) {
        ctx.fillStyle = "rgba(" + p.c + "," + (0.08 * a + flare * 0.12).toFixed(3) + ")";
        ctx.fillRect(sx - s * 1.6, sy - s * 1.6, s * 3.2, s * 3.2);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }
  requestAnimationFrame(frame);
})();
