/* =========================================================
   NO QUESTION EVENTS — site config
   Fill in events, clubs, links and contact details here.
   ========================================================= */
window.NQ_CONFIG = {
  // Default ticket shop (used when an event has no ticketUrl of its own)
  ticketUrl: "https://passtheblunt.stager.co/shop/default",

  // Contact details (footer, contact page, forms)
  email: "events@noquestion.nl",
  phone: "+31613922391",
  phoneLabel: "+31 6 13 92 23 91",
  kvk: "74552651",

  socials: {
    instagram: "https://www.instagram.com/noquestionevents",
    tiktok: "https://www.tiktok.com/@noquestion_events",
    facebook: "https://www.facebook.com/share/19b4xUqgvP/"
  },

  /* ---------------- EVENTS ----------------
     status: "upcoming" | "past"  (also automatic: after `end` the event moves to history)
     type:   "concert" | "club" | "festival"
     Texts per language live in i18n.js under "ev.<id>.*"           */
  events: [
    {
      id: "sarius-bonson-epis",
      status: "upcoming",
      type: "concert",
      title: "Sarius × Bonson × Epis",
      start: "2027-02-13T19:00:00+01:00",
      end: "2027-02-14T00:00:00+01:00",
      clubId: "effenaar",
      venue: "Effenaar",
      city: "Eindhoven",
      address: "Dommelstraat 2, 5611 CK Eindhoven",
      poster: "assets/img/poster-sarius.jpg",
      banner: "assets/img/poster-wide.jpg",
      bgVideo: "assets/video/teaser-bw.mp4",
      ticketUrl: "",
      lineup: [
        { name: "Sarius", role: "artist", video: "assets/video/artist-sarius.mp4", poster: "assets/img/artist-sarius.jpg" },
        { name: "Bonson", role: "artist", video: "assets/video/artist-bonson.mp4", poster: "assets/img/artist-bonson.jpg" },
        { name: "Epis", role: "artist", video: "assets/video/artist-epis.mp4", poster: "assets/img/artist-epis.jpg" },
        { name: "DJ Rasmatal", role: "host" }
      ],
      media: [
        { type: "video", src: "assets/video/promo-sarius-bonson-epis.mp4", poster: "assets/img/promo-sarius-bonson-epis.jpg" },
        { type: "video", src: "assets/video/teaser-bw.mp4", poster: "assets/img/teaser-bw.jpg" },
        { type: "img", src: "assets/img/tickets-sale.jpg" },
        { type: "img", src: "assets/img/koncert-effenaar.jpg" }
      ]
    },
    {
      id: "kali-helmond",
      status: "past",
      type: "concert",
      title: "Kali",
      start: "2026-10-10T20:00:00+02:00",
      doors: "2026-10-10T19:00:00+02:00",
      end: "2026-10-11T01:00:00+02:00",
      clubId: "cacaofabriek",
      venue: "De Cacaofabriek",
      city: "Helmond",
      address: "Cacaokade 1, 5705 LA Helmond",
      poster: "assets/img/poster-kali.jpg",
      ticketUrl: "",
      lineup: [
        { name: "Kali", role: "artist" },
        { name: "Monogram", role: "support" },
        { name: "Zyga WPU", role: "support" },
        { name: "DJ Rasmatal", role: "host" }
      ],
      media: [
        { type: "img", src: "assets/img/poster-kali.jpg" }
      ]
    }
  ],

  // Aftermovies of shows we already did (events page → archive)
  archive: [
    { f: "aftermovie-1", k: "reels.r1", type: "concert" },
    { f: "aftermovie-2", k: "reels.r14", type: "concert" },
    { f: "holandia", k: "reels.r4", type: "festival" }
  ],

  /* ---------------- VIDEOS ----------------
     cat:  live | backstage | promo
     sets: where else a video is used ("home" = highlights carousel)
     Every video appears once on the media page; each page uses its own. */
  reels: [
    { f: "live-teal", k: "reels.r2", cat: "live", sets: ["home"] },
    { f: "live-purple", k: "reels.r16", cat: "live", sets: ["home"] },
    { f: "night-cut-2", k: "reels.r6", cat: "live", sets: ["home"] },
    { f: "live-blue", k: "reels.r17", cat: "live", sets: ["home"] },
    { f: "brand-logo", k: "reels.r8", cat: "promo", sets: ["home"] },
    { f: "brand-reel", k: "reels.r12", cat: "promo", sets: ["home"] },
    { f: "aftermovie-1", k: "reels.r1", cat: "live" },
    { f: "aftermovie-2", k: "reels.r14", cat: "live" },
    { f: "holandia", k: "reels.r4", cat: "promo" },
    { f: "promo-sarius-bonson-epis", k: "reels.r10", cat: "promo" },
    { f: "teaser-bw", k: "reels.r9", cat: "promo" },
    { f: "manifest-words", k: "reels.r13", cat: "promo" },
    { f: "backstage-1", k: "reels.r3", cat: "backstage" },
    { f: "interview-street", k: "reels.r5", cat: "backstage" },
    { f: "night-cut-1", k: "reels.r11", cat: "backstage" }
  ],

  /* ---------------- POSTERS ----------------
     Every poster & graphic — past and upcoming. Add new ones on top.
     cat: upcoming | past | brand                                      */
  posters: [
    { src: "assets/img/poster-sarius.jpg", k: "po.1", cat: "upcoming" },
    { src: "assets/img/koncert-effenaar.jpg", k: "po.2", cat: "upcoming" },
    { src: "assets/img/tickets-sale.jpg", k: "po.3", cat: "upcoming" },
    { src: "assets/img/poster-wide.jpg", k: "po.6", cat: "upcoming" },
    { src: "assets/img/poster-kali.jpg", k: "po.kali", cat: "past" }
  ],

  /* ---------------- PARTNERS & COLLABS ----------------
     type: "partner" (brands we work with) | "collab" (clubs & agencies)
     logo: image file, or mark: text wordmark when no logo file yet      */
  partners: [
    { id: "jd", name: "J&D Video Productions", type: "partner", role: "pr.jd", logo: "assets/img/partners/jd-video.png",
      links: { instagram: "https://www.instagram.com/jd_video_productions", facebook: "https://www.facebook.com/share/1M6jgYwn1q/" } },
    { id: "dajlatan", name: "Dajlatan Watch", type: "partner", role: "pr.dajlatan", logo: "assets/img/partners/dajlatan.png",
      links: { web: "https://dajlatanwatch.com/", instagram: "https://www.instagram.com/dajlatanwatch", facebook: "https://www.facebook.com/share/1Ch8ATyeiz/" } },
    { id: "ptb", name: "Pass the Blunt", type: "partner", role: "pr.ptb", logo: "assets/img/partners/passtheblunt.png",
      links: { instagram: "https://www.instagram.com/passthebluntnl", facebook: "https://www.facebook.com/share/1KLisxX6Dy/", tiktok: "https://www.tiktok.com/@blanciknl" } },
    { id: "zenit", name: "Zenit Design", type: "partner", role: "pr.zenit", mark: "ZENIT<small>DESIGN</small>",
      links: { instagram: "https://www.instagram.com/zenit.design", facebook: "https://www.facebook.com/share/1BzhFNWWbF/" } },
    { id: "rapoland", name: "Rapoland.nl", type: "partner", role: "pr.rapoland", logo: "assets/img/partners/rapoland.png",
      links: { instagram: "https://www.instagram.com/rapoland.nl", facebook: "https://www.facebook.com/share/1DuNLx1cho/", tiktok: "https://www.tiktok.com/@rapoland.nl" } },
    { id: "anturaz", name: "Agencja Anturaż", type: "collab", role: "pr.anturaz", logo: "assets/img/partners/anturaz.png",
      links: { instagram: "https://www.instagram.com/anturazagencja", facebook: "https://www.facebook.com/share/1F9KUWrzE6/", tiktok: "https://www.tiktok.com/@antura931" } },
    { id: "effenaar", name: "Effenaar", type: "collab", role: "pr.club", city: "Eindhoven", logo: "assets/img/partners/effenaar.png",
      links: { web: "https://www.effenaar.nl/", instagram: "https://www.instagram.com/effenaar", facebook: "https://www.facebook.com/share/1HrCUYUS8J/" } },
    { id: "baroeg", name: "Baroeg", type: "collab", role: "pr.club", city: "Rotterdam", logo: "assets/img/partners/baroeg.png",
      links: { web: "https://baroeg.nl/", instagram: "https://www.instagram.com/baroegrotterdam", facebook: "https://www.facebook.com/share/1JDA9yVvCN/", tiktok: "https://www.tiktok.com/@baroegnl" } },
    { id: "cacaofabriek", name: "De Cacaofabriek", type: "collab", role: "pr.club", city: "Helmond", mark: "CACAO<small>FABRIEK</small>",
      links: { web: "https://cacaofabriek.nl/", instagram: "https://www.instagram.com/decacaofabriek", facebook: "https://www.facebook.com/share/19JPXqL8tj/" } },
    { id: "qfactory", name: "Q-Factory", type: "collab", role: "pr.club", city: "Amsterdam", mark: "Q&#8209;FACTORY<small>AMSTERDAM</small>",
      links: { web: "https://q-factory.com/nl", instagram: "https://www.instagram.com/qfactory_adam", facebook: "https://www.facebook.com/share/1CD8FHVhXk/", tiktok: "https://www.tiktok.com/@qfactoryamsterdam" } }
  ],

  /* ---------------- CLUBS ----------------
     Set lat/lng + address when known; a club without lat/lng
     is shown as "address coming soon".                             */
  clubs: [
    {
      id: "effenaar", name: "Effenaar", city: "Eindhoven",
      address: "Dommelstraat 2, 5611 CK Eindhoven",
      lat: 51.4434, lng: 5.4797, color: "#f2e63a", img: "assets/img/stage-live.jpg",
      // photo of the venue itself (Wikimedia Commons, free licence — credit links to the file page)
      photos: [
        { f: "Poppodium De Effenaar.jpg", by: "Choinowski", lic: "CC BY-SA 4.0" },
        { f: "Effenaar - panoramio.jpg", by: "michiel1972", lic: "CC BY-SA 3.0" },
        { f: "20250503 ARTMS Eindhoven concert 01.jpg", by: "Robbie Klinkenberg", lic: "CC BY 4.0", pos: "50% 70%" }
      ],
      links: { web: "https://www.effenaar.nl/", instagram: "https://www.instagram.com/effenaar", facebook: "https://www.facebook.com/share/1HrCUYUS8J/" }
    },
    {
      id: "baroeg", name: "Baroeg", city: "Rotterdam",
      address: "Spinozaweg 300, 3076 ET Rotterdam",
      lat: 51.8786, lng: 4.5347, color: "#35c759", img: "assets/img/live-purple.jpg",
      photos: [
        { f: "Het Baroeg Pand.jpg", by: "ColinvanVugt", lic: "CC BY-SA 4.0" },
        { f: "Baroeg27042008.jpg", by: "Juvarra", lic: "CC BY-SA 3.0" },
        { f: "40 jaar Baroeg- foto door André ten Brinke.jpg", by: "André ten Brinke / ColinvanVugt", lic: "CC BY-SA 4.0" }
      ],
      links: { web: "https://baroeg.nl/", instagram: "https://www.instagram.com/baroegrotterdam", facebook: "https://www.facebook.com/share/1JDA9yVvCN/", tiktok: "https://www.tiktok.com/@baroegnl" }
    },
    {
      id: "qfactory", name: "Q-Factory", city: "Amsterdam",
      address: "Atlantisplein 1, 1093 NE Amsterdam",
      lat: 52.3575, lng: 4.9301, color: "#4a55ff", img: "assets/img/live-blue.jpg",
      photos: [
        { f: "2022 Amsterdam, Q-Factory 01.jpg", by: "Kleon3", lic: "CC BY-SA 4.0" },
        { f: "2022 Amsterdam, Q-Factory 05.jpg", by: "Kleon3", lic: "CC BY-SA 4.0" },
        { f: "20260420 Yves Amsterdam concert 1.jpg", by: "Robbie Klinkenberg", lic: "CC BY 4.0", pos: "50% 35%" }
      ],
      links: { web: "https://q-factory.com/nl", instagram: "https://www.instagram.com/qfactory_adam", facebook: "https://www.facebook.com/share/1CD8FHVhXk/", tiktok: "https://www.tiktok.com/@qfactoryamsterdam" }
    },
    {
      id: "cacaofabriek", name: "De Cacaofabriek", city: "Helmond",
      address: "Cacaokade 1, 5705 LA Helmond",
      lat: 51.47335, lng: 5.65536, color: "#ff7a3c", img: "assets/img/poster-kali.jpg",
      photos: [
        { f: "De Cacaofabriek achterkant - panoramio.jpg", by: "Theodenhugt", lic: "CC BY 3.0" },
        { f: "Het poppodium in De Cacaofabriek.jpg", by: "Het Speelhuis", lic: "CC BY-SA 4.0" },
        { f: "Exterieur OVERZICHT GEVELS - Helmond - 20285667 - RCE.jpg", by: "Paul van Galen / RCE", lic: "CC BY-SA 4.0" }
      ],
      links: { web: "https://cacaofabriek.nl/", instagram: "https://www.instagram.com/decacaofabriek", facebook: "https://www.facebook.com/share/19JPXqL8tj/" }
    }
  ]
};
