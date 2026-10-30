/* =========================================================
   NO QUESTION EVENTS — partners page
   1) "Logo warp": scroll pulls you through a 3D tunnel of
      partner logos with hyperspace light streaks.
   2) Partner / collab cards with links.
   3) Endless logo belt.
   ========================================================= */
(function () {
  "use strict";
  var CFG = window.NQ_CONFIG || {}, I18N = window.NQ_I18N || {};
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var P = CFG.partners || [];
  function t(k) { var l = document.documentElement.lang || "nl"; return ((I18N[l] || {})[k]) || ((I18N.nl || {})[k]) || ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function logoHTML(p, cls) {
    return p.logo ? '<img class="' + (cls || "") + '" src="' + p.logo + '" alt="' + esc(p.name) + '" draggable="false">'
      : '<span class="pmark ' + (cls || "") + '">' + p.mark + "</span>";
  }

  /* ---------- cards ---------- */
  function cards(type, box) {
    if (!box) return;
    var list = P.filter(function (p) { return p.type === type; });
    box.style.setProperty("--cols", list.length);
    box.innerHTML = list.map(function (p, i) {
      return '<article class="pcard tilt" id="p-' + p.id + '" style="--i:' + i + '">' +
        '<div class="pcard__logo">' + logoHTML(p) + '<span class="pcard__glow" aria-hidden="true"></span></div>' +
        '<div class="pcard__body"><p class="pcard__role"><span data-i18n="' + p.role + '">' + t(p.role) + "</span>" + (p.city ? " · " + esc(p.city) : "") + "</p>" +
        "<h3>" + esc(p.name) + "</h3>" + (window.NQ_SOCIAL_LINKS ? window.NQ_SOCIAL_LINKS(p.links) : "") + "</div></article>";
    }).join("");
  }
  cards("partner", document.getElementById("pPartners"));
  cards("collab", document.getElementById("pCollabs"));

  /* ---------- belt ---------- */
  var belt = document.getElementById("pBelt");
  if (belt) {
    var row = P.map(function (p) { return '<span class="pbelt__item">' + logoHTML(p) + "</span>"; }).join("");
    belt.innerHTML = '<div class="pbelt__track">' + row + row + "</div>";
  }

  /* ---------- logo warp ---------- */
  var sec = document.getElementById("pWarp");
  if (!sec) return;
  var stage = sec.querySelector(".pwarp__stage"), cap = sec.querySelector(".pwarp__cap"), capName = cap.querySelector("strong"), capRole = cap.querySelector("span");
  var intro = sec.querySelector(".pwarp__intro"), bar = sec.querySelector(".pwarp__bar i");
  var N = P.length, GAP = 1100, items = [];
  var GOLD = 2.39996;
  P.forEach(function (p, i) {
    var el = document.createElement("div");
    el.className = "pwarp__logo";
    el.innerHTML = '<div class="pwarp__card">' + logoHTML(p) + "</div>";
    stage.appendChild(el);
    var a = i * GOLD + 0.6;
    items.push({ el: el, p: p, a: a, z: -(i + 1) * GAP - 900 });
  });
  // closing logo: No Question
  var end = document.createElement("div");
  end.className = "pwarp__logo pwarp__logo--nq";
  end.innerHTML = '<div class="pwarp__card"><img src="assets/img/logo-white.svg" alt="No Question Events"></div>';
  stage.appendChild(end);
  items.push({ el: end, p: null, a: 0, z: -(N + 1.4) * GAP - 900, nq: true });
  var TOTAL = (N + 1.4) * GAP + 900;

  // hyperspace streaks
  var cv = sec.querySelector("canvas"), g = cv.getContext("2d"), DPR = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
  var stars = [];
  for (var s = 0; s < 420; s++) stars.push({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random(), h: Math.random() });
  function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; }
  size(); window.addEventListener("resize", size);

  var prog = 0, sm = 0, last = 0, vel = 0, visible = false, lastName = "";
  function measure() {
    var r = sec.getBoundingClientRect(), total = r.height - innerHeight;
    prog = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
    visible = r.top < innerHeight && r.bottom > 0;
  }
  window.addEventListener("scroll", measure, { passive: true }); measure();

  function frame(time) {
    requestAnimationFrame(frame);
    if (!visible) return;
    measure();
    var prev = sm; sm += (prog - sm) * (reduced ? 1 : 0.09); vel = vel * 0.85 + Math.abs(sm - prev) * 60 * 0.15;
    var cam = sm * (TOTAL + 300), vw = innerWidth, vh = innerHeight, rad = Math.min(vw, vh) * (vw < 700 ? 0.22 : 0.3);
    var nearest = null, nd = 1e9;
    items.forEach(function (o, i) {
      var z = o.z + cam;                      // 0 = at the screen plane
      var x = o.nq ? 0 : Math.cos(o.a) * rad * (1 + 0.15 * Math.sin(i)), y = o.nq ? 0 : Math.sin(o.a) * rad * 0.62;
      if (o.nq) { z = Math.min(z, -260); }
      var op = z > 380 ? 0 : z > 120 ? 1 - (z - 120) / 260 : z < -GAP * 3.2 ? 0 : Math.min(1, (z + GAP * 3.2) / (GAP * 1.4));
      var spin = o.nq ? 0 : Math.sin(time / 1600 + i) * 6 + z * 0.006;
      o.el.style.transform = "translate(-50%,-50%) translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + z.toFixed(1) + "px) rotateY(" + spin.toFixed(2) + "deg)";
      o.el.style.opacity = op.toFixed(3);
      o.el.style.visibility = op > 0.01 ? "visible" : "hidden";
      o.el.classList.toggle("is-near", z > -700 && z < 200);
      if (!o.nq && op > 0.2 && Math.abs(z + 300) < nd) { nd = Math.abs(z + 300); nearest = o; }
    });
    var nqZ = items[items.length - 1].z + cam;
    sec.classList.toggle("is-end", nqZ > -1500);
    intro.style.opacity = Math.max(0, 1 - sm * 9).toFixed(3);
    intro.style.transform = "translate(-50%,-50%) scale(" + (1 + sm * 3).toFixed(3) + ")";
    if (nearest && nd < 900 && nqZ < -1500 && sm > 0.06) {
      var k = nearest.p.id;
      if (k !== lastName) { lastName = k; capName.textContent = nearest.p.name; capRole.setAttribute("data-i18n", nearest.p.role); capRole.textContent = t(nearest.p.role) + (nearest.p.city ? " · " + nearest.p.city : ""); cap.classList.remove("is-in"); void cap.offsetWidth; cap.classList.add("is-in"); }
      cap.style.opacity = 1;
    } else { cap.style.opacity = 0; lastName = ""; }
    if (bar) bar.style.transform = "scaleX(" + sm.toFixed(4) + ")";

    // streaks
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.fillStyle = "rgba(7,7,10,0.34)"; g.fillRect(0, 0, W, H);
    var sp = 0.0025 + vel * 0.9, cx = W / 2, cy = H / 2, F = Math.max(W, H) * 0.5;
    for (var j = 0; j < stars.length; j++) {
      var st = stars[j], z0 = st.z;
      st.z -= sp; if (st.z <= 0.02) { st.z = 1; st.x = (Math.random() - 0.5) * 2; st.y = (Math.random() - 0.5) * 2; continue; }
      var x0 = cx + st.x / z0 * F * 0.5, y0 = cy + st.y / z0 * F * 0.5, x1 = cx + st.x / st.z * F * 0.5, y1 = cy + st.y / st.z * F * 0.5;
      var a = Math.min(1, (1 - st.z) * 1.4);
      var hue = st.h < 0.33 ? "242,230,58" : st.h < 0.66 ? "53,199,89" : "120,110,255";
      g.strokeStyle = "rgba(" + hue + "," + (a * 0.85).toFixed(3) + ")"; g.lineWidth = 1 + (1 - st.z) * 1.6;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
  }
  requestAnimationFrame(frame);
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-lang]")) setTimeout(function () { lastName = ""; }, 30); });
})();
