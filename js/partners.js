/* =========================================================
   NO QUESTION EVENTS — partners page
   1) Logo showcase: logos assemble into a glass grid, then a
      spotlight introduces every partner one by one.
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

  /* ---------- logo showcase ----------
     Scroll 1: the logos fly in from depth and lock into a precise
     glass grid. Scroll 2: a spotlight moves tile by tile while the
     name, role and city of each partner slide in on the left.     */
  var sec = document.getElementById("pShow");
  if (!sec) return;
  var grid = sec.querySelector(".pshow__grid"), glow = sec.querySelector(".pshow__glow"), bar = sec.querySelector(".pshow__bar i");
  var intro = sec.querySelector(".pshow__intro"), now = sec.querySelector(".pshow__now"), nIdx = now.querySelector(".pshow__idx"), nName = now.querySelector(".pshow__name"), nRole = now.querySelector(".pshow__role"), nLinks = now.querySelector(".pshow__links");
  var fin = sec.querySelector(".pshow__final");
  var N = P.length, tiles = [];
  var COL = ["242,230,58", "53,199,89", "120,110,255", "255,120,60", "70,170,255", "235,80,140", "242,230,58", "53,199,89", "120,110,255"];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  P.forEach(function (p, i) {
    var el = document.createElement("a");
    el.className = "ptile"; el.href = "#p-" + p.id; el.setAttribute("aria-label", p.name);
    el.innerHTML = '<span class="ptile__in">' + logoHTML(p) + '<i class="ptile__shine" aria-hidden="true"></i></span>';
    grid.appendChild(el);
    tiles.push({ el: el, p: p, sx: rnd(-1, 1), sy: rnd(-1, 1), sz: rnd(-1800, -700), rx: rnd(-55, 55), ry: rnd(-70, 70), rz: rnd(-25, 25), focus: 0, a: 0 });
  });
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 4); }
  function sm(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }

  var W = 0, H = 0, T = 160, GAP = 14, cx = 0, cy = 0, mob = false;
  function layout() {
    W = sec.clientWidth; H = window.innerHeight; mob = W < 860;
    T = mob ? Math.min((W - 32 - GAP * 2) / 3, H * 0.15) : Math.min(H * 0.22, W * 0.13, 210);
    cx = mob ? W / 2 : W * 0.68; cy = mob ? H * 0.64 : H * 0.53;
    grid.style.setProperty("--t", T.toFixed(1) + "px");
  }
  layout(); window.addEventListener("resize", layout);

  var prog = 0, s = 0, mx = 0, my = 0, smx = 0, smy = 0, lastActive = -2, visible = false;
  sec.addEventListener("pointermove", function (e) { mx = e.clientX / W - 0.5; my = e.clientY / H - 0.5; });
  function measure() {
    var r = sec.getBoundingClientRect(), tot = r.height - innerHeight;
    prog = clamp(-r.top / Math.max(1, tot), 0, 1); visible = r.top < innerHeight && r.bottom > 0;
  }
  window.addEventListener("scroll", measure, { passive: true }); measure();

  function setNow(i) {
    var p = P[i];
    nIdx.textContent = pad(i + 1) + " / " + pad(N);
    nName.textContent = p.name;
    nRole.setAttribute("data-i18n", p.role); nRole.textContent = t(p.role) + (p.city ? " · " + p.city : "");
    nLinks.innerHTML = window.NQ_SOCIAL_LINKS ? window.NQ_SOCIAL_LINKS(p.links, true) : "";
    now.classList.remove("is-swap"); void now.offsetWidth; now.classList.add("is-swap");
    sec.style.setProperty("--pc", COL[i % COL.length]);
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    measure();
    s += (prog - s) * (reduced ? 1 : 0.1);
    smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
    var assemble = s, spot = sm(0.42, 0.92, s), ending = sm(0.93, 0.99, s);
    // grid tilt follows the cursor, flattens while a partner is in focus
    var tilt = 1 - spot * 0.6 + ending * 0.6;
    grid.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0) rotateX(" + (-smy * 10 * tilt).toFixed(2) + "deg) rotateY(" + (smx * 14 * tilt).toFixed(2) + "deg)";
    var active = spot > 0 && spot < 1 && s < 0.925 ? Math.min(N - 1, Math.floor(spot * N)) : -1;
    var fpos = spot * N - 0.5;
    tiles.forEach(function (o, i) {
      var col = i % 3, row = Math.floor(i / 3);
      var gx = (col - 1) * (T + GAP), gy = (row - 1) * (T + GAP);
      var a = ease((assemble - 0.02 - i * 0.022) / 0.3);
      o.a = a;
      var x = gx + o.sx * W * 0.7 * (1 - a), y = gy + o.sy * H * 0.75 * (1 - a), z = o.sz * (1 - a);
      var foc = active < 0 ? 0 : Math.max(0, 1 - Math.abs(i - fpos) * 1.15);
      o.focus += (foc - o.focus) * 0.18;
      var f = o.focus, lift = f * 70, sc = 1 + f * 0.14;
      o.el.style.transform = "translate(-50%,-50%) translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + (z + lift).toFixed(1) + "px) rotateX(" + (o.rx * (1 - a)).toFixed(2) + "deg) rotateY(" + (o.ry * (1 - a)).toFixed(2) + "deg) rotateZ(" + (o.rz * (1 - a)).toFixed(2) + "deg) scale(" + sc.toFixed(3) + ")";
      var dim = active < 0 ? 1 : 0.32 + f * 0.68;
      o.el.style.opacity = (Math.min(1, a * 1.4) * dim).toFixed(3);
      o.el.style.filter = a < 0.98 ? "blur(" + ((1 - a) * 14).toFixed(1) + "px)" : "none";
      o.el.classList.toggle("is-focus", f > 0.6);
    });
    intro.style.opacity = (1 - sm(0.34, 0.44, s)).toFixed(3);
    intro.style.transform = "translate3d(0," + (-sm(0.34, 0.44, s) * 40).toFixed(1) + "px,0)";
    now.style.opacity = (sm(0.42, 0.47, s) * (1 - sm(0.895, 0.925, s))).toFixed(3);
    fin.style.opacity = ending.toFixed(3); fin.style.transform = "translate3d(0," + ((1 - ending) * 30).toFixed(1) + "px,0)";
    sec.classList.toggle("is-spot", active >= 0);
    if (active !== lastActive) { lastActive = active; if (active >= 0) setNow(active); }
    if (active >= 0) {
      var c = tiles[active], ccol = active % 3, crow = Math.floor(active / 3);
      glow.style.transform = "translate(" + (cx + (ccol - 1) * (T + GAP)).toFixed(0) + "px," + (cy + (crow - 1) * (T + GAP)).toFixed(0) + "px)";
    } else glow.style.transform = "translate(" + cx.toFixed(0) + "px," + cy.toFixed(0) + "px)";
    glow.style.opacity = (0.35 + 0.65 * Math.max(spot > 0 ? 1 : assemble * 0.6, ending)).toFixed(3);
    if (bar) bar.style.transform = "scaleX(" + s.toFixed(4) + ")";
  }
  requestAnimationFrame(frame);
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-lang]")) setTimeout(function () { if (lastActive >= 0) setNow(lastActive); }, 30); });
})();
