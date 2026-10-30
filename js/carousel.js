/* =========================================================
   NO QUESTION EVENTS — 3D carousels
   data-carousel="reels"   → videos (data-set="home" = highlights,
                             data-filter-for links category chips)
   data-carousel="posters" → every poster / graphic we made
   Items sit on a curved arc; the centre one is lifted onto a
   glowing pedestal and tints the whole section with its colour.
   Drag / swipe, arrows, dots, keyboard, horizontal wheel.
   ========================================================= */
(function () {
  "use strict";
  var CFG = window.NQ_CONFIG || {}, I18N = window.NQ_I18N || {};
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function t(k) { var l = document.documentElement.lang || "nl"; return ((I18N[l] || {})[k]) || ((I18N.nl || {})[k]) || k; }
  function vivid(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, d = mx - mn;
    if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } else h = 270;
    var s = d < 0.04 ? 0.75 : 0.85, l = 0.56, c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, o;
    o = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return o.map(function (v) { return Math.round((v + m) * 255); });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function itemsFor(root, filter) {
    var kind = root.dataset.carousel || "reels";
    if (kind === "posters") return (CFG.posters || []).map(function (p) { return { img: p.src, k: p.k, cat: p.cat, poster: true }; });
    var set = root.dataset.set, list = CFG.reels || [];
    if (set) list = list.filter(function (r) { return (r.sets || []).indexOf(set) > -1; });
    if (filter && filter !== "all") list = list.filter(function (r) { return r.cat === filter; });
    return list.map(function (r) { return { img: "assets/img/" + r.f + ".jpg", video: "assets/video/" + r.f + ".mp4", k: r.k, cat: r.cat }; });
  }

  function Carousel(root) {
    var ring = root.querySelector(".rc__ring"), dotsBox = root.querySelector(".rc__dots"), stage = root.querySelector(".rc__stage");
    var elNum = root.querySelector(".rc__num"), elTitle = root.querySelector(".rc__title"), elCat = root.querySelector(".rc__cat"), btn = root.querySelector(".rc__play");
    var isPoster = root.dataset.carousel === "posters";
    var data = [], items = [], dots = [], N = 0;
    var pos = 0, target = 0, dragging = false, startX = 0, startPos = 0, moved = 0, lastInteract = 0, current = -1, hovering = false, inView = false, lastAuto = 0;
    var W = 260, STEP = 22, R = 700, AR = isPoster ? 1.25 : 1.78;

    function build(list) {
      ring.innerHTML = ""; dotsBox.innerHTML = ""; items = []; dots = []; data = list; N = list.length;
      pos = target = 0; current = -1;
      list.forEach(function (r, i) {
        var it = document.createElement("div");
        it.className = "rc__item"; it.dataset.i = i;
        it.innerHTML = '<div class="rc__card">' +
          (isPoster ? '<img class="rc__blur" src="' + r.img + '" alt="" draggable="false">' : "") +
          '<img class="rc__img" src="' + r.img + '" alt="" draggable="false" loading="' + (i < 6 ? "eager" : "lazy") + '">' +
          (r.video ? '<video muted loop playsinline preload="none" src="' + r.video + '"></video>' : "") +
          '<span class="rc__shine" aria-hidden="true"></span></div>';
        ring.appendChild(it);
        var d = document.createElement("button");
        d.className = "rc__dot"; d.setAttribute("aria-label", pad(i + 1)); d.addEventListener("click", function () { go(i); });
        dotsBox.appendChild(d); dots.push(d);
        var o = { el: it, card: it.firstChild, img: it.querySelector(".rc__img"), video: it.querySelector("video"), color: [138, 60, 255] };
        items.push(o);
        function sample() {
          try {
            var c = document.createElement("canvas"); c.width = c.height = 12; var g = c.getContext("2d"); g.drawImage(o.img, 0, 0, 12, 12);
            var px = g.getImageData(0, 0, 12, 12).data, r0 = 0, g0 = 0, b0 = 0, w = 0;
            for (var k = 0; k < px.length; k += 4) { var R_ = px[k], G = px[k + 1], B = px[k + 2], sat = Math.max(R_, G, B) - Math.min(R_, G, B), wt = sat * sat + 1; r0 += R_ * wt; g0 += G * wt; b0 += B * wt; w += wt; }
            o.color = vivid(r0 / w, g0 / w, b0 / w);
            if (current === i) paintColor();
          } catch (e) {}
        }
        if (o.img.complete && o.img.naturalWidth) sample(); else o.img.addEventListener("load", sample);
      });
      dotsBox.hidden = N < 2;
      render(); if (N) setInfo(0); current = N ? 0 : -1;
    }

    function layout() {
      var vw = window.innerWidth;
      if (isPoster) { W = Math.max(200, Math.min(380, vw * (vw < 700 ? 0.62 : 0.24))); STEP = vw < 700 ? 34 : 24; R = W * (vw < 700 ? 1.9 : 3.0); }
      else { W = Math.max(170, Math.min(300, vw * (vw < 700 ? 0.5 : 0.19))); STEP = vw < 700 ? 30 : 19; R = W * (vw < 700 ? 2.1 : 3.9); }
      root.style.setProperty("--rcw", W + "px"); root.style.setProperty("--rcar", AR);
    }
    layout(); window.addEventListener("resize", layout);
    function wrap(d) { d = ((d % N) + N) % N; return d > N / 2 ? d - N : d; }
    function go(i) { if (!N) return; target = pos + wrap(i - pos); lastInteract = Date.now(); }
    function step(k) { target = Math.round(target) + k; lastInteract = Date.now(); }
    function paintColor() { if (current < 0 || !items[current]) return; root.style.setProperty("--rc", items[current].color.join(",")); }
    function setInfo(i) {
      var r = data[i]; if (!r) return;
      elNum.textContent = pad(i + 1) + " / " + pad(N);
      elTitle.setAttribute("data-i18n", r.k); elTitle.textContent = t(r.k);
      var ck = (isPoster ? "pc." : "mf.") + r.cat; elCat.setAttribute("data-i18n", ck); elCat.textContent = t(ck);
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === i); });
      btn.dataset.lb = r.video ? "video" : "img";
      btn.dataset.src = r.video || r.img; btn.dataset.poster = r.img; btn.dataset.titleKey = r.k;
      current = i; paintColor();
    }
    function render() {
      var deg = Math.PI / 180, vis = isPoster ? 4.2 : 5.2;
      items.forEach(function (o, i) {
        var d = wrap(i - pos), ad = Math.abs(d), th = d * STEP * deg;
        if (N <= 3 && ad > 1.5) { o.el.style.visibility = "hidden"; return; }
        var x = Math.sin(th) * R, z = (Math.cos(th) - 1) * R, s = 1 + Math.max(0, 1 - ad) * 0.16;
        o.el.style.transform = "translate(-50%,-50%) translate3d(" + x.toFixed(1) + "px,0," + z.toFixed(1) + "px) rotateY(" + (d * STEP * 0.85).toFixed(2) + "deg) scale(" + s.toFixed(3) + ")";
        o.el.style.zIndex = String(100 - Math.round(ad * 10));
        var v = ad < vis;
        o.el.style.opacity = v ? String(Math.max(0, Math.min(1, 1.6 - ad * 0.3))) : "0";
        o.el.style.visibility = v ? "visible" : "hidden";
        o.card.style.filter = "brightness(" + (0.42 + 0.58 * Math.max(0, 1 - ad * 0.9)).toFixed(3) + ") saturate(" + (0.6 + 0.4 * Math.max(0, 1 - ad)).toFixed(3) + ")";
        o.el.classList.toggle("is-center", ad < 0.5);
      });
    }
    function tick() {
      requestAnimationFrame(tick);
      if (!inView || !N) return;
      if (!dragging) {
        var now = Date.now();
        if (!reduced && !hovering && N > 1 && now - lastInteract > 9000 && Math.abs(target - pos) < 0.001 && now - lastAuto > 6500) { target = Math.round(target) + 1; lastAuto = now; }
        pos += (target - pos) * (reduced ? 1 : 0.11);
        if (Math.abs(target - pos) < 0.0005) pos = target;
      }
      render();
      var ci = ((Math.round(pos) % N) + N) % N;
      if (ci !== current) {
        if (current >= 0 && items[current] && items[current].video) { items[current].video.pause(); items[current].el.classList.remove("is-playing"); }
        setInfo(ci); lastAuto = Date.now();
      }
      var cv = items[ci].video;
      if (cv && Math.abs(target - pos) < 0.05 && cv.paused) { cv.preload = "auto"; var pr = cv.play(); if (pr) pr.then(function () { items[ci].el.classList.add("is-playing"); }).catch(function () {}); }
    }

    stage.addEventListener("pointerdown", function (e) {
      dragging = true; moved = 0; startX = e.clientX; startPos = pos; lastInteract = Date.now();
      if (stage.setPointerCapture) stage.setPointerCapture(e.pointerId); stage.classList.add("is-drag");
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return; var dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      pos = startPos - dx / (W * 1.05); target = pos;
    });
    function end() { if (!dragging) return; dragging = false; stage.classList.remove("is-drag"); target = Math.round(pos); lastInteract = Date.now(); }
    stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end); stage.addEventListener("lostpointercapture", end);
    stage.addEventListener("click", function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); return; }
      var it = e.target.closest(".rc__item"); if (!it) return;
      e.stopPropagation();
      if (it.classList.contains("is-center")) btn.click(); else go(+it.dataset.i);
    }, true);
    stage.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) { e.preventDefault(); target += e.deltaX / 300; lastInteract = Date.now(); clearTimeout(root._wt); root._wt = setTimeout(function () { target = Math.round(target); }, 140); }
    }, { passive: false });
    root.querySelector(".rc__prev").addEventListener("click", function () { step(-1); });
    root.querySelector(".rc__next").addEventListener("click", function () { step(1); });
    root.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { step(1); e.preventDefault(); } if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); } });
    stage.addEventListener("mouseenter", function () { hovering = true; });
    stage.addEventListener("mouseleave", function () { hovering = false; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (!inView && current >= 0 && items[current] && items[current].video) items[current].video.pause(); }, { threshold: 0.15 }).observe(root);
    else inView = true;
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-lang]")) setTimeout(function () { if (current >= 0) setInfo(current); }, 30); });

    // category chips (media page)
    var chips = root.id ? document.querySelector('[data-filter-for="' + root.id + '"]') : null;
    if (chips) Array.prototype.forEach.call(chips.querySelectorAll("button[data-filter]"), function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(chips.querySelectorAll("button[data-filter]"), function (x) { x.classList.toggle("is-active", x === b); x.setAttribute("aria-selected", x === b); });
        if (current >= 0 && items[current] && items[current].video) items[current].video.pause();
        build(itemsFor(root, b.dataset.filter));
      });
    });

    build(itemsFor(root, "all"));
    tick();
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-carousel]"), Carousel);
})();
