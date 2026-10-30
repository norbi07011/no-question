/* =========================================================
   NO QUESTION EVENTS — shared layout
   Injects header, menus, language picker, page transition,
   footer and lightbox into every page.
   ========================================================= */
(function () {
  "use strict";
  var page = document.body.getAttribute("data-page") || "home";
  var PAGES = [
    { id: "home", href: "index.html", k: "nav.home" },
    { id: "about", href: "about.html", k: "nav.about" },
    { id: "events", href: "events.html", k: "nav.events" },
    { id: "media", href: "media.html", k: "nav.media" },
    { id: "clubs", href: "clubs.html", k: "nav.clubs" },
    { id: "partners", href: "partners.html", k: "nav.partners" },
    { id: "contact", href: "contact.html", k: "nav.contact" }
  ];
  window.NQ_PAGES = PAGES;
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  var internalNav = ss("nq-seen") === "1";
  ss("nq-seen", "1");
  window.NQ_INTERNAL_NAV = internalNav;

  var LOGO = '<img src="assets/img/logo-white.svg" alt="No Question Events" width="892" height="242">';
  var isActive = function (p) { return p.id === page || (page === "event" && p.id === "events"); };

  var links = PAGES.map(function (p) {
    return '<a href="' + p.href + '" data-i18n="' + p.k + '"' + (isActive(p) ? ' class="is-active" aria-current="page"' : "") + "></a>";
  }).join("");

  var langSeg = '<div class="lang" role="group" data-i18n-aria="nav.lang"><button data-lang="nl" lang="nl">NL</button><button data-lang="pl" lang="pl">PL</button><button data-lang="en" lang="en">EN</button><span class="lang__pill" aria-hidden="true"></span></div>';

  var top =
    // loader (first visit) or page-transition cover (internal navigation)
    (internalNav ? "" :
      '<div class="loader" id="loader" aria-hidden="true"><div class="loader__inner">' + LOGO.replace("<img", '<img class="loader__logo"') +
      '<div class="loader__bar"><span id="loaderBar"></span></div><div class="loader__meta"><span data-i18n="loader.text"></span><span id="loaderPct">0%</span></div></div></div>') +
    '<div class="pt' + (internalNav ? " is-cover" : "") + '" id="pt" aria-hidden="true"><div class="pt__panel"><span class="pt__bar"></span></div><div class="pt__panel pt__panel--2"></div></div>' +
    '<canvas id="gl" aria-hidden="true"></canvas><div class="grain" aria-hidden="true"></div><div class="vignette" aria-hidden="true"></div>' +
    '<div class="progress" aria-hidden="true"><span id="progressBar"></span></div>' +
    '<header class="nav" id="nav">' +
      '<a href="index.html" class="nav__logo" aria-label="No Question Events">' + LOGO + "</a>" +
      '<nav class="nav__links" aria-label="Main">' + links + "</nav>" +
      '<div class="nav__right">' +
        '<button class="sound" id="soundBtn" aria-pressed="false"><span class="sound__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="sound__label" data-i18n="sound.off"></span></button>' +
        langSeg +
        '<a href="' + ((window.NQ_CONFIG || {}).ticketUrl || "events.html") + '"' + ((window.NQ_CONFIG || {}).ticketUrl ? ' target="_blank" rel="noopener"' : "") + ' class="btn btn--grad nav__cta"><span data-i18n="nav.tickets"></span></a>' +
        '<button class="burger" id="burger" data-i18n-aria="nav.menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span></button>' +
      "</div>" +
    "</header>" +
    '<div class="mobile-menu" id="mobileMenu"><nav>' + PAGES.map(function (p, i) {
      return '<a href="' + p.href + '"' + (isActive(p) ? ' class="is-active"' : "") + '><small>0' + (i + 1) + '</small><span data-i18n="' + p.k + '"></span></a>';
    }).join("") + '</nav><div class="mobile-menu__lang"><span data-i18n="nav.lang"></span>' + langSeg.replace('class="lang"', 'class="lang lang--big"') + "</div></div>" +
    // language splash (first visit without a saved choice)
    '<div class="splash" id="splash" role="dialog" aria-modal="true" aria-labelledby="splashTitle" hidden>' +
      '<div class="splash__inner">' + LOGO.replace("<img", '<img class="splash__logo"') +
        '<h2 id="splashTitle" class="splash__title">Kies je taal · Wybierz język · Choose your language</h2>' +
        '<div class="splash__opts">' +
          '<button data-lang="nl" lang="nl"><b>NL</b><span>Nederlands</span><small>Ga verder in het Nederlands</small></button>' +
          '<button data-lang="pl" lang="pl"><b>PL</b><span>Polski</span><small>Przejdź dalej po polsku</small></button>' +
          '<button data-lang="en" lang="en"><b>EN</b><span>English</span><small>Continue in English</small></button>' +
        "</div><p class=\"splash__sub\" data-i18n=\"splash.sub\"></p>" +
      "</div>" +
    "</div>";

  var follow = '<div class="socials">' +
    '<a data-social="instagram" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>' +
    '<a data-social="tiktok" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 3 2.5 5 5.5 5"/></svg></a>' +
    '<a data-social="facebook" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z"/></svg></a>' +
  "</div>";
  window.NQ_SOCIALS_HTML = follow;

  var bottom =
    '<footer class="footer">' +
      '<div class="wrap footer__grid">' +
        '<div class="footer__brand">' + LOGO + '<p data-i18n="footer.tagline"></p><a class="footer__mail js-mail" href="#"></a><a class="footer__tel js-tel" href="#"></a></div>' +
        '<div><p class="footer__h" data-i18n="footer.pages"></p><nav class="footer__nav">' + PAGES.map(function (p) { return '<a href="' + p.href + '" data-i18n="' + p.k + '"></a>'; }).join("") + "</nav></div>" +
        '<div><p class="footer__h" data-i18n="footer.follow"></p>' + follow +
          '<p class="footer__h footer__h--lang" data-i18n="nav.lang"></p><div class="footer__langs"><button data-lang="nl">Nederlands</button><button data-lang="pl">Polski</button><button data-lang="en">English</button></div></div>' +
      "</div>" +
      '<div class="footer__giant" aria-hidden="true">' + LOGO + "</div>" +
      '<div class="wrap footer__row"><span>© <span class="js-year">2026</span> No Question Events. <span data-i18n="footer.rights"></span></span>' +
        ((window.NQ_CONFIG || {}).kvk ? '<span class="footer__kvk"><span data-i18n="footer.kvk">KvK</span> ' + window.NQ_CONFIG.kvk + '</span>' : '') +
        '<a href="privacy.html" data-i18n="footer.privacy"></a><span data-i18n="footer.made"></span></div>' +
    "</footer>" +
    '<div class="lightbox" id="lightbox" aria-hidden="true" role="dialog" aria-modal="true">' +
      '<button class="lightbox__close" id="lbClose"><span data-i18n="lightbox.close"></span> ✕</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" id="lbPrev" data-i18n-aria="lightbox.prev"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>' +
      '<div class="lightbox__body" id="lbBody"></div>' +
      '<button class="lightbox__nav lightbox__nav--next" id="lbNext" data-i18n-aria="lightbox.next"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '<p class="lightbox__title" id="lbTitle"></p>' +
    "</div>" +
    '<audio id="bgAudio" src="assets/audio/no-question.mp3" loop preload="none"></audio>';

  document.body.insertAdjacentHTML("afterbegin", top);
  document.body.insertAdjacentHTML("beforeend", bottom);
  if (!internalNav) document.body.classList.add("is-loading");
})();
