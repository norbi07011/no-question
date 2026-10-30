/* =========================================================
   NO QUESTION EVENTS — interactions (all pages)
   ========================================================= */
(function () {
  "use strict";
  var CFG = window.NQ_CONFIG || {};
  var I18N = window.NQ_I18N || {};
  var PAGE = document.body.getAttribute("data-page") || "home";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (reduced) document.documentElement.classList.add("reduced");
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var SICON = {
    web: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 3 2.5 5 5.5 5"/></svg>'
  };
  var SLABEL = { web: "Website", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };
  function socialLinks(links, iconsOnly) {
    if (!links) return "";
    return '<div class="slinks' + (iconsOnly ? " slinks--icons" : "") + '">' + ["web", "instagram", "tiktok", "facebook"].filter(function (k) { return links[k]; }).map(function (k) {
      return '<a href="' + esc(links[k]) + '" target="_blank" rel="noopener" aria-label="' + SLABEL[k] + '">' + SICON[k] + "<span>" + (k === "web" ? links[k].replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "") : SLABEL[k]) + "</span></a>";
    }).join("") + "</div>";
  }
  window.NQ_SOCIAL_LINKS = socialLinks;
  var ICON = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3"/></svg>'
  };
  var lenis = null;

  /* =================== I18N =================== */
  var LANGS = ["nl", "pl", "en"];
  var LOCALE = { nl: "nl-NL", pl: "pl-PL", en: "en-GB" };
  var lang = (function () {
    var q = new URLSearchParams(location.search).get("lang");
    if (q && LANGS.indexOf(q) > -1) return q;
    var s = store("nq-lang"); if (s && LANGS.indexOf(s) > -1) return s;
    var n = (navigator.language || "nl").slice(0, 2).toLowerCase();
    return LANGS.indexOf(n) > -1 ? n : "nl";
  })();
  function t(key) { var d = I18N[lang] || {}; var v = d[key]; if (v == null) v = (I18N.nl || {})[key]; return v == null ? "" : v; }
  var langHooks = [];
  function onLang(fn) { langHooks.push(fn); }

  function applyLang(l, animate) {
    lang = l; store("nq-lang", l);
    document.documentElement.lang = l;
    document.title = t("meta." + PAGE) || t("meta.home");
    var md = $('meta[name="description"]'); if (md) md.setAttribute("content", t("meta.desc"));
    $$("[data-i18n]").forEach(function (el) { var v = t(el.getAttribute("data-i18n")); if (typeof v === "string") el.textContent = v; });
    $$("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    $$("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
    $$(".hero__title .split").forEach(splitChars);
    $$(".split-words").forEach(function (el) { splitWords(el, true); if (el.classList.contains("is-in") && hasGsap) gsap.set(el._words, { yPercent: 0, rotate: 0 }); });
    $$(".scrub-text").forEach(function (el) { splitWords(el, false); updateScrub(el); });
    langHooks.forEach(function (fn) { fn(l); });
    $$("[data-lang]").forEach(function (b) { var on = b.dataset.lang === l; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on); });
    $$(".lang").forEach(function (g) { var pill = $(".lang__pill", g), btn = $('[data-lang="' + l + '"]', g); if (pill && btn) pill.style.transform = "translateX(" + (btn.offsetLeft - 4) + "px)"; });
    updateSoundLabel();
    if (animate && hasGsap && !reduced) {
      gsap.fromTo("main h1, main .h2", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, stagger: .03, ease: "expo.out", clearProps: "transform,opacity" });
    }
    if (hasGsap) ScrollTrigger.refresh();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-lang]"); if (!b) return;
    store("nq-lang-chosen", "1");
    if (b.closest("#splash")) closeSplash();
    if (b.dataset.lang !== lang) applyLang(b.dataset.lang, true);
  });

  var splash = $("#splash");
  function openSplash() {
    if (!splash || store("nq-lang-chosen")) return; splash.hidden = false;
    requestAnimationFrame(function () { if (!store("nq-lang-chosen")) splash.classList.add("is-open"); });
    var cur = $('[data-lang="' + lang + '"]', splash); if (cur) { cur.classList.add("is-active"); cur.focus({ preventScroll: true }); }
    if (lenis) lenis.stop();
  }
  function closeSplash() {
    if (!splash) return; splash.classList.remove("is-open");
    setTimeout(function () { if (!splash.classList.contains("is-open")) splash.hidden = true; }, 500);
    if (lenis) lenis.start();
  }

  /* =================== TEXT SPLITTING =================== */
  function splitChars(el) {
    var txt = el.textContent; el.setAttribute("aria-label", txt); el.innerHTML = "";
    txt.split(" ").forEach(function (word, wi, arr) {
      var w = document.createElement("span"); w.style.display = "inline-block"; w.style.whiteSpace = "nowrap"; w.setAttribute("aria-hidden", "true");
      Array.from(word).forEach(function (ch) { var c = document.createElement("span"); c.className = "c"; c.textContent = ch; w.appendChild(c); });
      el.appendChild(w); if (wi < arr.length - 1) el.appendChild(document.createTextNode(" "));
    });
    if (el.closest(".line--grad")) {
      var cs = el.querySelectorAll(".c"), n = Math.max(1, cs.length - 1), stops = [[242, 230, 58], [53, 199, 89], [46, 127, 143], [58, 63, 214]];
      Array.prototype.forEach.call(cs, function (c, i) {
        var f = (i / n) * (stops.length - 1), k = Math.min(stops.length - 2, Math.floor(f)), r = f - k, a = stops[k], b = stops[k + 1];
        c.style.color = "rgb(" + [0, 1, 2].map(function (j) { return Math.round(a[j] + (b[j] - a[j]) * r); }).join(",") + ")";
      });
    }
  }
  function splitWords(el, wrapOuter) {
    var txt = el.textContent.trim(); el.setAttribute("aria-label", txt); el.innerHTML = ""; var words = [];
    txt.split(/\s+/).forEach(function (word, i, arr) {
      var w = document.createElement("span"); w.className = "w"; w.textContent = word; w.setAttribute("aria-hidden", "true");
      if (wrapOuter) { var o = document.createElement("span"); o.className = "wo"; o.appendChild(w); el.appendChild(o); } else el.appendChild(w);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(" ")); words.push(w);
    });
    el._words = words;
  }
  var scrubState = new WeakMap();
  function updateScrub(el) {
    var p = scrubState.get(el) || 0, ws = el._words || [];
    ws.forEach(function (w, i) { var k = Math.max(0, Math.min(1, p * ws.length * 1.15 - i)); w.style.opacity = 0.18 + k * 0.82; });
  }

  /* =================== SMOOTH SCROLL =================== */
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.15, easing: function (x) { return Math.min(1, 1.001 - Math.pow(2, -10 * x)); }, smoothWheel: true });
    window.NQ_LENIS = lenis;
    if (hasGsap) { lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add(function (time) { lenis.raf(time * 1000); }); gsap.ticker.lagSmoothing(0); }
    else (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })();
  }
  function scrollToEl(el) { if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.4 }); else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }

  /* =================== PAGE TRANSITIONS =================== */
  var pt = $("#pt");
  function isInternal(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    var href = a.getAttribute("href") || ""; if (!href || href[0] === "#" || /^(mailto|tel|https?):/i.test(href)) return false;
    return /\.html(#.*)?$/.test(href);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a"); if (!a || e.defaultPrevented) return;
    var href = a.getAttribute("href") || "";
    if (href[0] === "#" && href.length > 1) { var el = $(href); if (el) { e.preventDefault(); closeMenu(); scrollToEl(el); } return; }
    if (!isInternal(a) || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var file = href.split("#")[0], here = location.pathname.split("/").pop() || "index.html";
    if (file === here && href.indexOf("#") === -1) { e.preventDefault(); closeMenu(); if (lenis) lenis.scrollTo(0); else scrollTo(0, 0); return; }
    e.preventDefault(); closeMenu();
    if (reduced || !pt) { location.href = href; return; }
    pt.classList.remove("is-reveal", "is-cover"); void pt.offsetWidth; pt.classList.add("is-leave");
    setTimeout(function () { location.href = href; }, 650);
    setTimeout(function () { pt.classList.remove("is-leave"); pt.classList.add("is-reveal"); }, 3000);
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted && pt) { pt.classList.remove("is-leave", "is-cover"); pt.classList.add("is-reveal"); } });

  /* =================== NAV / PROGRESS =================== */
  var nav = $("#nav"), bar = $("#progressBar"), lastY = 0, menuOpen = false;
  var burger = $("#burger"), menu = $("#mobileMenu");
  function closeMenu() { if (!menuOpen) return; menuOpen = false; menu.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); if (lenis) lenis.start(); }
  burger.addEventListener("click", function () {
    menuOpen = !menuOpen; menu.classList.toggle("is-open", menuOpen); burger.setAttribute("aria-expanded", menuOpen); document.body.classList.toggle("menu-open", menuOpen);
    if (lenis) { if (menuOpen) lenis.stop(); else lenis.start(); }
  });
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight, p = max > 0 ? y / max : 0;
    bar.style.transform = "scaleX(" + p + ")";
    nav.classList.toggle("is-scrolled", y > 40);
    if (y > lastY + 6 && y > 500 && !menuOpen) nav.classList.add("is-hidden");
    else if (y < lastY - 6 || y < 500) nav.classList.remove("is-hidden");
    lastY = y;
    if (window.NQ_SCENE) NQ_SCENE.setProgress(p, lenis ? lenis.velocity / 40 : 0);
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* =================== SOUND =================== */
  var audio = $("#bgAudio"), soundBtn = $("#soundBtn"), soundOn = false, actx, analyser, freq, level = 0;
  function updateSoundLabel() { var l = $(".sound__label", soundBtn); if (l) l.textContent = t(soundOn ? "sound.on" : "sound.off"); soundBtn.classList.toggle("is-on", soundOn); soundBtn.setAttribute("aria-pressed", soundOn); }
  function setupAnalyser() {
    if (actx || location.protocol === "file:") return;
    try { var AC = window.AudioContext || window.webkitAudioContext; actx = new AC(); var src = actx.createMediaElementSource(audio); analyser = actx.createAnalyser(); analyser.fftSize = 256; src.connect(analyser); analyser.connect(actx.destination); freq = new Uint8Array(analyser.frequencyBinCount); } catch (e) { analyser = null; }
  }
  soundBtn.addEventListener("click", function () {
    soundOn = !soundOn;
    if (soundOn) { setupAnalyser(); if (actx && actx.state === "suspended") actx.resume(); audio.volume = 0.7; audio.play().catch(function () { soundOn = false; updateSoundLabel(); }); }
    else audio.pause();
    updateSoundLabel();
  });
  function readLevel() {
    var target = 0;
    if (soundOn) {
      if (analyser) { analyser.getByteFrequencyData(freq); var sum = 0; for (var i = 0; i < 24; i++) sum += freq[i]; target = Math.min(1, sum / (24 * 255) * 1.4); }
      else target = 0.25 + Math.sin(performance.now() / 230) * 0.15 + Math.random() * 0.1;
    }
    level += (target - level) * 0.2; if (window.NQ_SCENE) NQ_SCENE.setLevel(level); if (window.NQ_CLUB) NQ_CLUB.setLevel(level);
  }

  /* =================== LINKS / CONTACT INFO =================== */
  function eventById(id) { return (CFG.events || []).filter(function (e) { return e.id === id; })[0]; }
  function ticketUrl(ev) { return (ev && ev.ticketUrl) || CFG.ticketUrl || ""; }
  function fillSocials(root) { $$("[data-social]", root).forEach(function (a) { var u = (CFG.socials || {})[a.dataset.social] || "#"; a.href = u; if (u !== "#") { a.target = "_blank"; a.rel = "noopener"; } }); }
  $$(".js-mail").forEach(function (a) { a.textContent = CFG.email; a.href = "mailto:" + CFG.email; });
  $$(".js-tel").forEach(function (a) { if (!CFG.phone) { a.remove(); return; } a.textContent = CFG.phoneLabel || CFG.phone; a.href = "tel:" + CFG.phone; });
  $$(".js-mailtext").forEach(function (a) { a.textContent = CFG.email; });
  $$(".js-socials").forEach(function (s) { s.innerHTML = window.NQ_SOCIALS_HTML || ""; });
  fillSocials(document);
  $$(".js-year").forEach(function (y) { y.textContent = new Date().getFullYear(); });

  /* =================== DATES / COUNTDOWN =================== */
  function fmtDate(iso, opts) { try { return new Intl.DateTimeFormat(LOCALE[lang], opts).format(new Date(iso)); } catch (e) { return iso; } }
  function fmtTime(iso) { return fmtDate(iso, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }); }
  function fmtLong(iso) { var s = fmtDate(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }); return s.charAt(0).toUpperCase() + s.slice(1); }
  function dateBlock(iso) {
    return '<span class="dblock"><b>' + fmtDate(iso, { day: "2-digit", timeZone: "Europe/Amsterdam" }) + '</b><span class="js-mon" data-iso="' + iso + '">' + fmtDate(iso, { month: "short", timeZone: "Europe/Amsterdam" }).replace(".", "") + "</span><small>" + new Date(iso).getFullYear() + "</small></span>";
  }
  function countdownHTML() {
    return '<div class="countdown">' + ["d", "h", "m", "s"].map(function (u) { return '<div><b data-cd="' + u + '">00</b><small data-i18n="event.cd.' + u + '">' + t("event.cd." + u) + "</small></div>"; }).join("") + "</div>";
  }
  function tickCountdowns() {
    $$("[data-countdown]").forEach(function (box) {
      var diff = Math.max(0, new Date(box.getAttribute("data-countdown")).getTime() - Date.now());
      var v = { d: Math.floor(diff / 864e5), h: pad(Math.floor(diff / 36e5) % 24), m: pad(Math.floor(diff / 6e4) % 60), s: pad(Math.floor(diff / 1e3) % 60) };
      $$("[data-cd]", box).forEach(function (b) { b.textContent = v[b.dataset.cd]; });
    });
  }
  setInterval(tickCountdowns, 1000);

  function icsFor(ev) {
    function f(d) { return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//No Question Events//NL", "BEGIN:VEVENT", "UID:nq-" + ev.id + "@noquestionevents", "DTSTAMP:" + f(Date.now()),
      "DTSTART:" + f(ev.start), "DTEND:" + f(ev.end || ev.start), "SUMMARY:" + ev.title + " — No Question Events", "LOCATION:" + (ev.venue + ", " + ev.address).replace(/,/g, "\\,"), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = ev.id + ".ics";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-ics]"); if (b) { var ev = eventById(b.dataset.ics); if (ev) icsFor(ev); } });

  /* =================== LIGHTBOX (with gallery) =================== */
  var lb = $("#lightbox"), lbBody = $("#lbBody"), lbTitle = $("#lbTitle"), lbList = [], lbIndex = 0, audioWasOn = false;
  function lbRender() {
    var it = lbList[lbIndex], m; lbBody.innerHTML = "";
    if (it.type === "video") { m = document.createElement("video"); m.src = it.src; m.controls = true; m.autoplay = true; m.playsInline = true; m.loop = true; if (it.poster) m.poster = it.poster; }
    else { m = document.createElement("img"); m.src = it.src; m.alt = it.title || ""; }
    lbBody.appendChild(m);
    lbTitle.textContent = (it.titleKey ? t(it.titleKey) : it.title || "") + (lbList.length > 1 ? "  ·  " + (lbIndex + 1) + " / " + lbList.length : "");
    $("#lbPrev").hidden = $("#lbNext").hidden = lbList.length < 2;
  }
  function openLightbox(list, index) {
    lbList = list; lbIndex = Math.max(0, index || 0); lbRender();
    lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); if (lenis) lenis.stop();
    if (soundOn) { audioWasOn = true; audio.pause(); }
    $("#lbClose").focus();
  }
  function closeLightbox() {
    lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true");
    var v = $("video", lbBody); if (v) v.pause(); setTimeout(function () { lbBody.innerHTML = ""; }, 400);
    if (lenis) lenis.start(); if (audioWasOn && soundOn) audio.play(); audioWasOn = false;
  }
  function lbStep(d) { lbIndex = (lbIndex + d + lbList.length) % lbList.length; lbRender(); }
  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", function () { lbStep(-1); });
  $("#lbNext").addEventListener("click", function () { lbStep(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target === lbBody) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (lb.classList.contains("is-open")) { if (e.key === "Escape") closeLightbox(); if (e.key === "ArrowRight") lbStep(1); if (e.key === "ArrowLeft") lbStep(-1); return; }
    if (e.key === "Escape") { closeMenu(); if (splash && !splash.hidden) closeSplash(); }
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-lb]"); if (!el) return;
    e.preventDefault();
    var group = el.closest("[data-lb-group]"), items = group ? $$("[data-lb]", group).filter(function (x) { return x.offsetParent !== null; }) : [el];
    var list = items.map(function (x) { return { type: x.dataset.lb, src: x.dataset.src, poster: x.dataset.poster, titleKey: x.dataset.titleKey, title: x.dataset.title }; });
    openLightbox(list, items.indexOf(el));
  });

  /* =================== REEL CARD =================== */
  function reelCard(r, i, total) {
    return '<article class="reel" data-lb="video" data-src="assets/video/' + r.f + '.mp4" data-poster="assets/img/' + r.f + '.jpg" data-title-key="' + r.k + '" data-cat="' + (r.cat || "") + '" tabindex="0" role="button">' +
      '<img src="assets/img/' + r.f + '.jpg" alt="" loading="lazy">' +
      '<video muted loop playsinline preload="none" src="assets/video/' + r.f + '.mp4"></video>' +
      (total ? '<span class="reel__num">' + pad(i + 1) + " / " + pad(total) + "</span>" : "") +
      '<span class="reel__sound" aria-hidden="true">' + ICON.sound + "</span>" +
      '<div class="reel__meta"><strong data-i18n="' + r.k + '">' + esc(t(r.k)) + '</strong><span class="reel__dur"></span></div></article>';
  }
  function wireReels(root) {
    var els = $$(".reel", root);
    els.forEach(function (el) {
      var v = $("video", el), dur = $(".reel__dur", el);
      v.addEventListener("loadedmetadata", function () { dur.textContent = "0:" + pad(Math.round(v.duration)); });
      el._play = function () { v.preload = "auto"; var p = v.play(); if (p) p.then(function () { el.classList.add("is-playing"); }).catch(function () {}); };
      el._stop = function () { v.pause(); el.classList.remove("is-playing"); };
      if (!isTouch) { el.addEventListener("mouseenter", el._play); el.addEventListener("mouseleave", el._stop); }
      el.addEventListener("click", function () { el._stop(); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
    });
    if (isTouch && "IntersectionObserver" in window) {
      var rio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) en.target._play(); else en.target._stop(); }); }, { threshold: 0.75 });
      els.forEach(function (r) { rio.observe(r); });
    }
  }

  /* =================== BUILDERS =================== */
  function evEnd(e) { return new Date(e.end || (new Date(e.start).getTime() + 6 * 3600e3)); }
  function isPast(e) { return e.status === "past" || evEnd(e) < new Date(); }
  var upcoming = (CFG.events || []).filter(function (e) { return !isPast(e); }).sort(function (a, b) { return new Date(a.start) - new Date(b.start); });
  var pastEvents = (CFG.events || []).filter(isPast).sort(function (a, b) { return new Date(b.start) - new Date(a.start); });
  var nextEv = upcoming[0];
  $$("[data-next-event]").forEach(function (box) {
    if (!nextEv) { box.hidden = true; return; }
    var link = "event.html#" + nextEv.id;
    $$("[data-ne-link]", box).forEach(function (a) { a.href = link; });
    $$("[data-ne-title]", box).forEach(function (el) { el.textContent = nextEv.title; });
    $$("[data-ne-poster]", box).forEach(function (el) { el.src = nextEv.poster; });
    $$("[data-ne-ticket]", box).forEach(function (a) { var u = ticketUrl(nextEv); a.href = u || link; if (u) { a.target = "_blank"; a.rel = "noopener"; } });
    $$("[data-ne-cd]", box).forEach(function (el) { el.setAttribute("data-countdown", nextEv.start); el.innerHTML = countdownHTML(); });
    function fill() {
      $$("[data-ne-date]", box).forEach(function (el) { el.textContent = fmtLong(nextEv.start); });
      $$("[data-ne-short]", box).forEach(function (el) { el.textContent = fmtDate(nextEv.start, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Amsterdam" }) + " · " + nextEv.venue + " " + nextEv.city; });
      $$("[data-ne-time]", box).forEach(function (el) { el.textContent = t("event.start") + " " + fmtTime(nextEv.start); });
      $$("[data-ne-venue]", box).forEach(function (el) { el.textContent = nextEv.venue + " · " + nextEv.address; });
      $$("[data-ne-desc]", box).forEach(function (el) { el.textContent = t("ev." + nextEv.id + ".short"); });
    }
    fill(); onLang(fill);
  });

  // Events page
  var evList = $("#eventsList"), archive = $("#archiveGrid"), curFilter = "all";
  function lineupLine(ev) { return (ev.lineup || []).filter(function (x) { return x.role !== "host"; }).map(function (x) { return x.name; }).join(" · "); }
  function eventCard(ev) {
    var u = ticketUrl(ev), link = "event.html#" + ev.id, past = isPast(ev);
    if (past) return '<article class="evcard evcard--past" data-type="' + ev.type + '">' +
      '<a class="evcard__poster" href="' + link + '"><img src="' + ev.poster + '" alt="' + esc(ev.title) + '" loading="lazy"></a>' +
      '<div class="evcard__body">' +
        '<div class="evcard__top">' + dateBlock(ev.start) + '<div class="evcard__tags"><span class="pill pill--' + ev.type + '" data-i18n="type.' + ev.type + '">' + t("type." + ev.type) + '</span><span class="pill pill--past" data-i18n="event.was">' + t("event.was") + "</span></div></div>" +
        '<h3 class="evcard__title"><a href="' + link + '">' + esc(ev.title) + "</a></h3>" +
        '<p class="evcard__line">' + esc(lineupLine(ev)) + "</p>" +
        '<p class="evcard__desc" data-i18n="ev.' + ev.id + '.short">' + esc(t("ev." + ev.id + ".short")) + "</p>" +
        '<ul class="evcard__meta"><li>' + ICON.clock + '<span class="js-evtime" data-iso="' + ev.start + '"></span></li><li>' + ICON.pin + "<span>" + esc(ev.venue + " · " + ev.city) + "</span></li></ul>" +
        '<div class="evcard__cta"><a class="btn btn--ghost" href="' + link + '"><span data-i18n="cta.recap">' + t("cta.recap") + "</span>" + ICON.arrow + "</a></div>" +
      "</div></article>";
    return '<article class="evcard" data-type="' + ev.type + '">' +
      '<a class="evcard__poster" href="' + link + '"><img src="' + ev.poster + '" alt="' + esc(ev.title) + '"></a>' +
      '<div class="evcard__body">' +
        '<div class="evcard__top">' + dateBlock(ev.start) + '<div class="evcard__tags"><span class="pill pill--' + ev.type + '" data-i18n="type.' + ev.type + '">' + t("type." + ev.type) + '</span><span class="live-dot"><i></i><span data-i18n="event.status">' + t("event.status") + "</span></span></div></div>" +
        '<h3 class="evcard__title"><a href="' + link + '">' + esc(ev.title) + "</a></h3>" +
        '<p class="evcard__desc" data-i18n="ev.' + ev.id + '.short">' + esc(t("ev." + ev.id + ".short")) + "</p>" +
        '<ul class="evcard__meta"><li>' + ICON.clock + '<span class="js-evtime" data-iso="' + ev.start + '"></span></li><li>' + ICON.pin + "<span>" + esc(ev.venue + " · " + ev.city) + "</span></li></ul>" +
        '<div class="evcard__cta"><a class="btn btn--grad magnetic" href="' + (u || link) + '"' + (u ? ' target="_blank" rel="noopener"' : "") + '><span data-i18n="event.buy">' + t("event.buy") + "</span>" + ICON.arrow + '</a><a class="btn btn--ghost magnetic" href="' + link + '"><span data-i18n="cta.details">' + t("cta.details") + "</span></a></div>" +
      "</div></article>";
  }
  function fillEvTimes() {
    $$(".js-evtime").forEach(function (s) { s.textContent = fmtLong(s.dataset.iso) + " · " + fmtTime(s.dataset.iso); });
    $$(".js-mon").forEach(function (s) { s.textContent = fmtDate(s.dataset.iso, { month: "short", timeZone: "Europe/Amsterdam" }).replace(".", ""); });
  }
  function renderEvents() {
    if (!evList) return;
    var items = upcoming.filter(function (e) { return curFilter === "all" || e.type === curFilter; });
    evList.innerHTML = (items.length ? items.map(eventCard).join("") : '<p class="empty" data-i18n="events.empty">' + t("events.empty") + "</p>") +
      '<article class="soon-card"><span class="soon-card__ring" aria-hidden="true"></span><div><h3 data-i18n="events.soon.t">' + t("events.soon.t") + '</h3><p data-i18n="events.soon.d">' + t("events.soon.d") + '</p></div><div class="js-socials2">' + (window.NQ_SOCIALS_HTML || "") + "</div></article>";
    var pl = $("#pastList");
    if (pl) {
      var pitems = pastEvents.filter(function (e) { return curFilter === "all" || e.type === curFilter; });
      pl.innerHTML = pitems.length ? pitems.map(eventCard).join("") : '<p class="empty" data-i18n="events.empty">' + t("events.empty") + "</p>";
    }
    buildTimeline();
    fillSocials(evList); fillEvTimes();
    if (archive) {
      var arch = (CFG.archive || []).filter(function (a) { return curFilter === "all" || a.type === curFilter; });
      archive.innerHTML = arch.length ? arch.map(function (a) {
        return '<article class="arch" data-lb="video" data-src="assets/video/' + a.f + '.mp4" data-poster="assets/img/' + a.f + '.jpg" data-title-key="' + a.k + '" tabindex="0" role="button">' +
          '<img src="assets/img/' + a.f + '.jpg" alt="" loading="lazy"><span class="arch__play">' + ICON.play + '</span>' +
          '<div class="arch__meta"><span class="pill pill--' + a.type + '" data-i18n="type.' + a.type + '">' + t("type." + a.type) + '</span><strong data-i18n="' + a.k + '">' + esc(t(a.k)) + "</strong></div></article>";
      }).join("") : '<p class="empty" data-i18n="events.empty">' + t("events.empty") + "</p>";
    }
    if (hasGsap && !reduced) { gsap.from(".evcard, .soon-card, .arch", { y: 40, opacity: 0, duration: .8, stagger: .06, ease: "expo.out", clearProps: "transform,opacity" }); ScrollTrigger.refresh(); }
  }
  function buildTimeline() {
    var tl = $("#tline"); if (!tl) return;
    var all = (CFG.events || []).slice().sort(function (a, b) { return new Date(a.start) - new Date(b.start); });
    var now = new Date(), html = "", nowDone = false;
    all.forEach(function (e) {
      if (!nowDone && new Date(e.start) > now) { html += '<li class="tline__now"><span class="tline__dot"></span><b data-i18n="events.today">' + t("events.today") + "</b></li>"; nowDone = true; }
      html += '<li class="tline__ev' + (isPast(e) ? " is-past" : " is-next") + '"><a href="event.html#' + e.id + '"><span class="tline__dot"></span><small class="js-tldate" data-iso="' + e.start + '"></small><strong>' + esc(e.title) + "</strong><em>" + esc(e.venue + " · " + e.city) + '</em><i data-i18n="' + (isPast(e) ? "event.was" : "events.upcoming") + '">' + t(isPast(e) ? "event.was" : "events.upcoming") + "</i></a></li>";
    });
    if (!nowDone) html += '<li class="tline__now"><span class="tline__dot"></span><b data-i18n="events.today">' + t("events.today") + "</b></li>";
    html += '<li class="tline__more"><span class="tline__dot"></span><b data-i18n="events.more">' + t("events.more") + "</b></li>";
    tl.innerHTML = "<ol>" + html + "</ol>";
    $$(".js-tldate", tl).forEach(function (s) { s.textContent = fmtDate(s.dataset.iso, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }); });
  }
  if (evList) { renderEvents(); onLang(fillEvTimes); onLang(buildTimeline); }

  $$("[data-filter-group]").forEach(function (g) {
    $$("button[data-filter]", g).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button[data-filter]", g).forEach(function (x) { x.classList.toggle("is-active", x === b); x.setAttribute("aria-selected", x === b); });
        curFilter = b.dataset.filter;
        if (g.dataset.filterGroup === "events") renderEvents(); else renderMedia();
      });
    });
  });

  var mediaGrid = $("#mediaGrid");
  function renderMedia() {
    if (!mediaGrid) return;
    var html = "", n = 0;
    (CFG.reels || []).forEach(function (r, i) {
      if (curFilter !== "all" && curFilter !== r.cat) return; n++;
      html += reelCard(r, i, 0).replace('class="reel"', 'class="reel reel--grid"');
    });
    if (curFilter === "all" || curFilter === "photos") (CFG.photos || []).forEach(function (src) {
      n++; html += '<figure class="ph" data-lb="img" data-src="' + src + '"><img src="' + src + '" alt="No Question Events" loading="lazy"></figure>';
    });
    mediaGrid.innerHTML = html; wireReels(mediaGrid);
    var c = $("#mediaCount"); if (c) c.innerHTML = "<b>" + n + '</b> <span data-i18n="media.items">' + t("media.items") + "</span>";
    if (hasGsap && !reduced) { gsap.from(mediaGrid.children, { y: 50, opacity: 0, duration: .9, stagger: .03, ease: "expo.out", clearProps: "transform,opacity" }); ScrollTrigger.refresh(); }
  }
  if (mediaGrid) renderMedia();

  // Event detail page
  var evPage = $("#eventPage");
  if (evPage) {
    var hid = (location.hash || "").replace("#", "");
    var ev = eventById(hid) || upcoming[0];
    if (!ev) { evPage.innerHTML = '<section class="section"><div class="wrap"><h1 class="h2" data-i18n="event.notfound"></h1><a class="btn btn--ghost" href="events.html" data-i18n="cta.back"></a></div></section>'; }
    else {
      var u = ticketUrl(ev);
      $$("[data-ev]").forEach(function (el) {
        var k = el.dataset.ev;
        if (k === "title") el.textContent = ev.title;
        if (k === "poster") { el.src = ev.poster; el.alt = ev.title; }
        if (k === "bg" && ev.bgVideo) el.src = ev.bgVideo;
        if (k === "venue") el.textContent = ev.venue + " · " + ev.city;
        if (k === "address") el.textContent = ev.address;
        if (k === "venuename") el.textContent = ev.venue;
        if (k === "type") { el.setAttribute("data-i18n", "type." + ev.type); el.classList.add("pill--" + ev.type); }
        if (k === "desc1" || k === "desc2") el.setAttribute("data-i18n", "ev." + ev.id + "." + k);
        if (k === "ticket") { if (u) { el.href = u; el.target = "_blank"; el.rel = "noopener"; } else el.href = "#tickets-info"; }
        if (k === "ics") el.setAttribute("data-ics", ev.id);
        if (k === "route") el.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(ev.venue + ", " + ev.address);
        if (k === "cd") { el.setAttribute("data-countdown", ev.start); el.innerHTML = countdownHTML(); }
        if (k === "tbd") el.hidden = !!u;
        if (k === "host") { var h = (ev.lineup || []).filter(function (x) { return x.role === "host"; })[0]; el.textContent = h ? h.name : "—"; }
      });
      if (isPast(ev)) {
        evPage.classList.add("is-past");
        $$("[data-ev='cd'], [data-ev='ticket'], [data-ev='ics'], [data-ev='tbd']").forEach(function (el) { el.hidden = true; el.style.display = "none"; });
        var cdt = $("[data-i18n='event.cd.title']", evPage); if (cdt) cdt.style.display = "none";
        $$(".ev-tags .live-dot span", evPage).forEach(function (s) { s.setAttribute("data-i18n", "event.past"); s.textContent = t("event.past"); });
      }
      if (!ev.clubId) { var mw = $("#mapWrap", evPage); if (mw) mw.remove(); var vn = $(".venue", evPage); if (vn) vn.classList.add("venue--nomap"); }
      if (!(ev.media || []).length || (ev.media.length === 1 && ev.media[0].src === ev.poster)) { var ems = $("#eventMedia"); if (ems) ems.closest("section").remove(); }
      var lu = $("#lineup");
      if (lu) lu.innerHTML = (ev.lineup || []).map(function (a, i) {
        var vid = a.video ? ' artist--video" data-lb="video" data-src="' + a.video + '" data-poster="' + a.poster + '" data-title="' + esc(a.name) + '" tabindex="0" role="button' : "";
        return '<article class="artist artist--' + a.role + vid + '">' +
          (a.video ? '<video class="artist__vid" src="' + a.video + '" poster="' + a.poster + '" muted loop playsinline preload="metadata"></video><span class="artist__play" aria-hidden="true">' + ICON.play + "</span>" : "") +
          '<span class="artist__idx">' + pad(i + 1) + '</span>' + (a.video ? "" : '<span class="artist__init" aria-hidden="true">' + esc(a.name.replace(/^DJ\s+/, "").charAt(0)) + "</span>") + "<h3>" + esc(a.name) + '</h3><span class="artist__role" data-i18n="role.' + a.role + '">' + t("role." + a.role) + "</span></article>";
      }).join("");
      if (lu && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target; if (e.isIntersecting) { var pr = v.play(); if (pr) pr.catch(function () {}); } else v.pause(); }); }, { threshold: 0.35 });
        $$(".artist__vid", lu).forEach(function (v) { io.observe(v); });
      }
      if (lu) lu.setAttribute("data-lb-group", "");
      var em = $("#eventMedia");
      if (em) em.innerHTML = (ev.media || []).map(function (m) {
        return '<figure class="emedia' + (m.type === "video" ? " emedia--v" : "") + '" data-lb="' + m.type + '" data-src="' + m.src + '"' + (m.poster ? ' data-poster="' + m.poster + '"' : "") + ' data-title="' + esc(ev.title) + '"><img src="' + (m.poster || m.src) + '" alt="" loading="lazy">' + (m.type === "video" ? '<span class="arch__play">' + ICON.play + "</span>" : "") + "</figure>";
      }).join("");
      var fillEv = function () {
        $$("[data-ev='date']").forEach(function (el) { el.textContent = fmtLong(ev.start); });
        $$("[data-ev='time']").forEach(function (el) { el.textContent = fmtTime(ev.start); });
        document.title = ev.title + " — No Question Events";
      };
      onLang(fillEv);
      var shareBtn = $("[data-ev='share']");
      if (shareBtn) shareBtn.addEventListener("click", function () {
        var lbl = $("span", shareBtn);
        function done() { lbl.textContent = t("event.copied"); setTimeout(function () { lbl.textContent = t("event.share"); }, 1800); }
        if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done).catch(done); else done();
      });
      var mapEl = $("#map"); if (mapEl) mapEl.dataset.single = ev.clubId;
    }
  }

  /* =================== CLUBS + MAP =================== */
  function commons(f, w) { return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f.replace(/ /g, "_")) + "?width=" + (w || 1000); }
  function clubPhotos(c) {
    var ph = c.photos || [];
    if (!ph.length) return "";
    var figs = ph.slice(0, 3).map(function (p, k) {
      return '<a class="club__ph" href="https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(p.f.replace(/ /g, "_")) + '" target="_blank" rel="noopener">' +
        '<img src="' + commons(p.f, k ? 700 : 1100) + '" alt="' + esc(c.name) + '" loading="lazy" referrerpolicy="no-referrer"' + (p.pos ? ' style="object-position:' + p.pos + '"' : "") +
        " onerror=\"this.parentNode.classList.add('is-empty')\"></a>";
    }).join("");
    var credit = ph.map(function (p) { return esc(p.by); }).join(", ");
    return '<div class="club__gal">' + figs + '<span class="club__cr">' + credit + " · Wikimedia Commons</span></div>";
  }
  // real Google Maps view of one club (keyless embed), shown over the NL overview map
  function showGmap(c) {
    var wrap = $("#mapWrap"); if (!wrap) return;
    var g = $(".gmap", wrap);
    if (!g) {
      g = document.createElement("div"); g.className = "gmap";
      g.innerHTML = '<iframe title="Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>' +
        '<button type="button" class="gmap__back">← <span data-i18n="clubs.all">' + t("clubs.all") + '</span></button>' +
        '<a class="gmap__open" target="_blank" rel="noopener">Google Maps ↗</a>';
      wrap.appendChild(g);
      $(".gmap__back", g).addEventListener("click", function () {
        g.classList.remove("is-on"); $$(".club").forEach(function (x) { x.classList.remove("is-active"); });
        if (map) { map.invalidateSize(); var pts = (CFG.clubs || []).filter(function (k) { return k.lat != null; }).map(function (k) { return [k.lat, k.lng]; }); if (pts.length > 1) map.flyToBounds(pts, { padding: [70, 70], maxZoom: 12, duration: reduced ? 0 : 1.2 }); }
      });
    }
    var src = gmapsEmbed(c), ifr = $("iframe", g);
    if (ifr.getAttribute("src") !== src) ifr.setAttribute("src", src);
    $(".gmap__open", g).href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.name + ", " + c.address);
    g.classList.add("is-on");
  }
  function gmapsEmbed(c) { return "https://maps.google.com/maps?q=" + encodeURIComponent(c.name + ", " + c.address) + "&hl=" + (lang || "nl") + "&z=16&output=embed"; }
  var map, markers = {};
  function buildClubs() {
    var list = $("#clubsList"); if (!list) return;
    var full = list.dataset.variant === "full";
    list.innerHTML = "";
    (CFG.clubs || []).forEach(function (c, i) {
      var has = c.lat != null && c.lng != null;
      var nextHere = upcoming.filter(function (e) { return e.clubId === c.id; })[0];
      var b = document.createElement("article");
      b.className = "club" + (full ? " club--full" : ""); b.style.setProperty("--c", c.color); b.dataset.id = c.id; b.tabIndex = 0;
      b.innerHTML =
        (full ? clubPhotos(c) : "") +
        '<span class="club__idx">0' + (i + 1) + "</span>" +
        '<div class="club__txt"><span class="club__name">' + esc(c.name) + (c.city ? " · " + esc(c.city) : "") + "</span>" +
        '<span class="club__addr ' + (has ? "" : "is-soon") + '">' + (has ? esc(c.address) : '<span data-i18n="clubs.soon">' + t("clubs.soon") + "</span>") + "</span>" +
        (full ? '<span class="club__next"><small data-i18n="clubs.next">' + t("clubs.next") + "</small>" + (nextHere ? '<a href="event.html#' + nextHere.id + '">' + esc(nextHere.title) + ' — <span class="js-clubdate" data-iso="' + nextHere.start + '"></span></a>' : '<span data-i18n="clubs.none">' + t("clubs.none") + "</span>") + "</span>" : "") +
        (has ? '<a class="club__route" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(c.name + ", " + c.address) + '"><span data-i18n="clubs.route">' + t("clubs.route") + "</span> →</a>" : "") +
        (full ? '<div class="club__links">' + socialLinks(c.links) + "</div>" : "") +
        "</div>" + '<span class="club__go" aria-hidden="true">' + ICON.pin + "</span>";
      var focusClub = function (e) {
        if (e && e.target.closest && e.target.closest("a")) return;
        $$(".club").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        if (has && full) { showGmap(c); if (window.innerWidth < 900) scrollToEl($("#mapWrap")); }
        else if (has && map) {
          map.flyTo([c.lat, c.lng], 15, { duration: reduced ? 0 : 1.8 });
          setTimeout(function () { if (markers[c.id]) markers[c.id].openPopup(); }, reduced ? 0 : 1800);
          if (window.innerWidth < 900) scrollToEl($("#mapWrap"));
        }
      };
      b.addEventListener("click", focusClub);
      b.addEventListener("keydown", function (e) { if (e.key === "Enter") focusClub(); });
      list.appendChild(b);
    });
    var fillDates = function () { $$(".js-clubdate").forEach(function (s) { s.textContent = fmtDate(s.dataset.iso, { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }); }); };
    onLang(fillDates);
  }
  function initMap() {
    var el = $("#map"); if (!window.L || !el) return;
    var single = el.dataset.single;
    map = L.map("map", { zoomControl: true, scrollWheelZoom: false }).setView([52.15, 5.3], 7);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19
    }).addTo(map);
    var pts = [];
    (CFG.clubs || []).forEach(function (c) {
      if (c.lat == null || c.lng == null) return;
      if (single && single !== c.id) return;
      var icon = L.divIcon({ className: "", html: '<div class="pin" style="--c:' + c.color + '"><i></i><b>' + esc(c.name) + "</b></div>", iconSize: [22, 22], iconAnchor: [11, 11] });
      markers[c.id] = L.marker([c.lat, c.lng], { icon: icon }).addTo(map).bindPopup("<strong>" + esc(c.name) + "</strong><br>" + esc(c.address) + '<br><a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(c.name + ", " + c.address) + '">Google Maps →</a>');
      pts.push([c.lat, c.lng]);
    });
    if (single && pts[0]) map.setView(pts[0], 14);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [70, 70], maxZoom: 12 });
    var hud = $("#mapCoords");
    var hudUpd = function () { if (!hud) return; var c = map.getCenter(); hud.textContent = c.lat.toFixed(2) + "° N · " + c.lng.toFixed(2) + "° E"; };
    map.on("move", hudUpd); hudUpd();
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
  }

  /* =================== FORMS =================== */
  function mailto(subject, body) { location.href = "mailto:" + (CFG.email || "") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); }
  $$(".js-news").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var inp = $("input[type=email]", f), note = $(".form__note", f);
      if (!/^\S+@\S+\.\S+$/.test(inp.value)) { inp.classList.add("is-invalid"); note.textContent = t("home.news.bad"); note.classList.add("is-err"); return; }
      inp.classList.remove("is-invalid"); note.classList.remove("is-err"); note.textContent = t("home.news.ok");
      mailto("Newsletter — " + inp.value, "Please add me to the No Question Events mailing list: " + inp.value + " (" + lang.toUpperCase() + ")");
    });
  });
  var cf = $("#contactForm");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault(); var ok = true, note = $("#formNote");
    ["name", "email", "message"].forEach(function (n) {
      var el = cf.elements[n], bad = !el.value.trim() || (n === "email" && !/^\S+@\S+\.\S+$/.test(el.value));
      el.classList.toggle("is-invalid", bad); el.setAttribute("aria-invalid", bad); if (bad) ok = false;
    });
    var consent = cf.elements.consent, cwrap = consent.closest(".consent");
    if (!consent.checked) { ok = false; cwrap.classList.add("is-invalid"); } else cwrap.classList.remove("is-invalid");
    if (!ok) { note.textContent = t("contact.err"); note.classList.add("is-err"); return; }
    note.classList.remove("is-err"); note.textContent = t("contact.sent");
    var type = (cf.querySelector('input[name="type"]:checked') || {}).value || "";
    mailto("[" + type + "] " + cf.elements.name.value, cf.elements.message.value + "\n\n— " + cf.elements.name.value + (cf.elements.company.value ? ", " + cf.elements.company.value : "") + " (" + cf.elements.email.value + ")");
  });
  $$(".js-copy").forEach(function (b) {
    b.addEventListener("click", function () {
      var lbl = $("span", b);
      function done() { lbl.textContent = t("contact.copied"); setTimeout(function () { lbl.textContent = t("contact.copy"); }, 1600); }
      if (navigator.clipboard) navigator.clipboard.writeText(CFG.email).then(done).catch(done); else done();
    });
  });
  $$("[data-pick]").forEach(function (a) {
    a.addEventListener("click", function () { var r = cf && cf.querySelector('input[name="type"][value="' + a.dataset.pick + '"]'); if (r) r.checked = true; });
  });

  /* =================== FAQ =================== */
  $$(".faq details").forEach(function (d) {
    var s = $("summary", d), body = $(".faq__a", d);
    s.addEventListener("click", function (e) {
      if (reduced || !hasGsap) return; e.preventDefault();
      if (d.open) gsap.to(body, { height: 0, opacity: 0, duration: .35, ease: "power2.in", onComplete: function () { d.open = false; gsap.set(body, { clearProps: "all" }); ScrollTrigger.refresh(); } });
      else { d.open = true; gsap.from(body, { height: 0, opacity: 0, duration: .5, ease: "expo.out", onComplete: function () { ScrollTrigger.refresh(); } }); }
    });
  });

  /* =================== TILT (subtle, desktop only) =================== */
  if (!isTouch && !reduced) {
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest(".tilt"); if (!el) return;
      if (el._base == null) { var bs = getComputedStyle(el).transform; el._base = bs === "none" ? "" : bs; el.addEventListener("pointerleave", function () { el.style.transition = "transform .8s cubic-bezier(.22,1,.36,1)"; el.style.transform = el._base; setTimeout(function () { el.style.transition = ""; }, 800); }); }
      var rr = el.getBoundingClientRect(), x = (e.clientX - rr.left) / rr.width - 0.5, y = (e.clientY - rr.top) / rr.height - 0.5, a = el.classList.contains("tilt--strong") ? 10 : 5;
      el.style.transform = el._base + " perspective(1000px) rotateY(" + x * a + "deg) rotateX(" + -y * a + "deg)";
      el.style.setProperty("--mx", (x + 0.5) * 100 + "%"); el.style.setProperty("--my", (y + 0.5) * 100 + "%"); el.style.setProperty("--shine", (100 - (x + 0.5) * 100) + "%");
    });
  }

  /* =================== MARQUEE / MANIFEST =================== */
  var marquees = [];
  function buildWords() {
    var words = t("words"); if (!Array.isArray(words)) return;
    [["wordsA", words], ["wordsB", words.slice().reverse()]].forEach(function (pair) {
      var el = document.getElementById(pair[0]); if (!el) return;
      var html = pair[1].map(function (w) { return "<span>" + esc(w) + "</span>"; }).join(""); el.innerHTML = html + html + html + html;
    });
    var mf = $("#manifestWords");
    if (mf) mf.innerHTML = words.map(function (w, i) { return '<li><span class="mf__n">' + pad(i + 1) + '</span><span class="mf__w">' + esc(w) + "</span></li>"; }).join("");
  }
  onLang(buildWords);
  $$(".marquee__row").forEach(function (row) { marquees.push({ el: $(".marquee__track", row), dir: +row.dataset.dir, x: 0 }); });

  /* =================== AUTOPLAY IN VIEW =================== */
  if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (es) { es.forEach(function (en) { var v = en.target; if (en.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p) p.catch(function () {}); } else v.pause(); }); }, { threshold: 0.1 });
    $$("video.autoplay").forEach(function (v) { vio.observe(v); });
  }

  /* =================== FRAME LOOP =================== */
  function frame() {
    readLevel();
    var v = lenis ? lenis.velocity : 0;
    marquees.forEach(function (m) {
      if (!m.el) return; var w = m.el.scrollWidth / 2;
      m.x -= (reduced ? 0 : 0.6 + Math.abs(v) * 0.35) * m.dir; if (m.x <= -w) m.x += w; if (m.x > 0) m.x -= w;
      m.el.style.transform = "translate3d(" + m.x + "px,0,0) skewX(" + Math.max(-12, Math.min(12, -v * 0.4)) + "deg)";
    });
    requestAnimationFrame(frame);
  }

  /* =================== SCROLL ANIMATIONS =================== */
  function initScroll() {
    if (!hasGsap) return;
    $$(".reveal-up").forEach(function (el) {
      if (el.closest(".hero") || el.closest(".page-hero") || el.closest(".nqc")) return;
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
    });
    $$(".split-words").forEach(function (el) {
      if (el.closest(".page-hero")) return;
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: function () {
        el.classList.add("is-in"); gsap.fromTo(el._words || [], { yPercent: 110, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.05, ease: "expo.out" });
      } });
    });
    $$(".scrub-text").forEach(function (el) { ScrollTrigger.create({ trigger: el, start: "top 85%", end: "bottom 55%", onUpdate: function (s) { scrubState.set(el, s.progress); updateScrub(el); } }); });
    if (!reduced) $$("[data-stagger]").forEach(function (g) {
      gsap.from(g.children, { y: 60, opacity: 0, duration: 1.1, stagger: 0.08, ease: "expo.out", clearProps: "transform,opacity", scrollTrigger: { trigger: g, start: "top 90%" } });
    });
    $$("[data-parallax]").forEach(function (el) {
      gsap.to(el, { yPercent: +el.dataset.parallax, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".poster3d").forEach(function (p) {
      gsap.fromTo(p, { rotateY: -28, rotateX: 8 }, { rotateY: 0, rotateX: 0, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 95%", end: "top 35%", scrub: 1 } });
    });
    var mfList = $("#manifestWords");
    if (mfList) ScrollTrigger.create({ trigger: mfList, start: "top 75%", end: "bottom 50%", onUpdate: function (s) {
      var li = $$("li", mfList), n = li.length; li.forEach(function (l, i) { l.classList.toggle("is-lit", s.progress * n >= i + 0.2); });
    } });
    if ($(".steps__line span")) gsap.fromTo(".steps__line span", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 60%", scrub: true } });
    $$(".flatten").forEach(function (g) { gsap.fromTo(g, { rotateX: 28, scale: 0.9, y: 50 }, { rotateX: 0, scale: 1, y: 0, ease: "none", scrollTrigger: { trigger: g, start: "top bottom", end: "top 35%", scrub: 1 } }); });
    $$(".page-hero__inner").forEach(function (h) { gsap.to(h, { yPercent: -14, opacity: 0.25, ease: "none", scrollTrigger: { trigger: h.parentElement, start: "top top", end: "bottom top", scrub: true } }); });
  }

  /* =================== INTRO =================== */
  function intro() {
    if (pt && pt.classList.contains("is-cover")) { pt.classList.add("is-reveal"); pt.classList.remove("is-cover"); }
    document.body.classList.add("is-ready");
    var needSplash = !store("nq-lang-chosen") && splash;
    if (!hasGsap || reduced) {
      $$(".reveal-up").forEach(function (e) { e.style.opacity = 1; e.style.transform = "none"; }); $$(".split-words").forEach(function (e) { e.classList.add("is-in"); });
      if (needSplash) openSplash(); return;
    }
    var tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: window.NQ_INTERNAL_NAV ? 0.3 : 0 });
    if ($(".hero__title")) tl.fromTo(".hero__title .c", { yPercent: 120, rotate: 10, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.4, stagger: 0.025 }, 0);
    $$(".page-hero .split-words").forEach(function (el) { el.classList.add("is-in"); tl.fromTo(el._words || [], { yPercent: 110, rotate: 5 }, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.06 }, 0.05); });
    tl.to(".hero .reveal-up, .page-hero .reveal-up", { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.35);
    if (needSplash) tl.call(openSplash, null, 0.9);
  }
  function runLoader(done) {
    var lbar = $("#loaderBar"), pct = $("#loaderPct");
    if (!lbar) { done(); return; }
    var shown = 0, target = 10, finished = false, imgs = $$("img").filter(function (i) { return i.loading !== "lazy"; }), total = imgs.length + 1, loaded = 0;
    function inc() { loaded++; target = Math.max(target, Math.round(loaded / total * 100)); }
    imgs.forEach(function (i) { if (i.complete) inc(); else { i.addEventListener("load", inc, { once: true }); i.addEventListener("error", inc, { once: true }); } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(inc); else inc();
    var safety = setTimeout(function () { target = 100; }, 3500);
    (function step() {
      shown += (target - shown) * 0.12 + 0.3; if (shown > target) shown = target;
      lbar.style.width = shown + "%"; pct.textContent = Math.round(shown) + "%";
      if (shown >= 99.5 && !finished) { finished = true; clearTimeout(safety); setTimeout(function () { $("#loader").classList.add("is-done"); document.body.classList.remove("is-loading"); if (lenis) lenis.start(); done(); }, 250); return; }
      requestAnimationFrame(step);
    })();
  }


  /* =================== CLUB CHAPTERS =================== */
  var club = $("#nqClub");
  if (club) {
    var chs = $$(".nqc__ch", club), hudBtns = $$(".nqc__hud button", club), cbar = $("#nqcBar");
    var setCh = function (p) {
      chs.forEach(function (c) { var on = p >= +c.dataset.from && p < +c.dataset.to; if (c.classList.contains("is-on") !== on) c.classList.toggle("is-on", on); });
      var idx = [0, 0.15, 0.32, 0.5, 0.71, 0.87].reduce(function (a, v, i) { return p >= v ? i : a; }, 0);
      hudBtns.forEach(function (b, i) { b.classList.toggle("is-active", i === idx); });
      if (cbar) cbar.style.transform = "scaleY(" + p + ")";
      club.classList.toggle("is-moving", p > 0.02 && p < 0.97);
    };
    club.addEventListener("clubprogress", function (e) { setCh(e.detail); });
    var goTo = function (p) { var top = club.offsetTop + p * (club.offsetHeight - innerHeight); if (lenis) lenis.scrollTo(top, { duration: 2.2 }); else scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" }); };
    hudBtns.forEach(function (b) { b.addEventListener("click", function () { goTo(+b.dataset.go); }); });
    var skip = $("#nqcSkip"); if (skip) skip.addEventListener("click", function () { var top = club.offsetTop + club.offsetHeight - 60; if (lenis) lenis.scrollTo(top, { duration: 1.2 }); else scrollTo(0, top); });
    setCh(0);
  }

  /* =================== BOOT =================== */
  buildClubs();
  applyLang(lang, false);
  initMap();
  initScroll();
  onScroll();
  tickCountdowns();
  requestAnimationFrame(frame);
  if (lenis && $("#loader")) lenis.stop();
  runLoader(function () { intro(); if (hasGsap) ScrollTrigger.refresh(); });
  window.addEventListener("load", function () { if (hasGsap) ScrollTrigger.refresh(); });
  window.addEventListener("hashchange", function () { if (PAGE === "event") location.reload(); });
})();
