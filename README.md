# No Question Events — website

Statyczna strona (HTML/CSS/JS), bez builda i bez serwera. Otwórz `index.html` albo wrzuć cały folder na dowolny hosting (Netlify, Vercel, GitHub Pages, Hostinger…).

Języki: NL / PL / EN (przełącznik w menu, ekran wyboru języka przy pierwszej wizycie, albo `?lang=pl` w adresie).

## Podstrony
| Plik | Co jest |
|---|---|
| `index.html` | Start — animowane logo, film przewijany z kadrów z koncertów, najbliższy koncert, karuzela 3D „Highlights”, kluby, partnerzy, newsletter |
| `about.html` | O nas — historia, usługi, jak pracujemy, za kulisami, wartości, partnerzy |
| `events.html` | Kalendarz — oś czasu, nadchodzące koncerty, historia („Już było”), aftermovie, FAQ |
| `event.html#<id>` | Strona koncertu (np. `event.html#sarius-bonson-epis`, `event.html#kali-helmond`) |
| `media.html` | Karuzela 3D wszystkich filmów (filtry) + karuzela plakatów |
| `clubs.html` | Kluby: Effenaar, Baroeg, Q-Factory — mapa, zdjęcia, linki |
| `partners.html` | Partnerzy i współpraca — tunel z logotypami, karty z linkami, na dole bonus: klub 3D |
| `contact.html` | Kontakt — e-mail, telefon/WhatsApp, formularz, FAQ |
| `privacy.html` | Polityka prywatności |

## Co edytować
- **`js/config.js`** — wszystko, co się zmienia:
  - `ticketUrl` — link do sklepu z biletami (przycisk „Tickets” i „Kup bilety”),
  - `events` — koncerty (data, klub, line-up, plakat). Koncert po dacie `end` sam przechodzi do historii,
  - `clubs`, `partners`, `reels` (filmy), `posters` (plakaty), `email`, `phone`, `socials`.
- **`js/i18n.js`** — wszystkie teksty NL / PL / EN (opisy koncertów: klucze `ev.<id>.*`).
- **`js/layout.js`** — menu i stopka wspólne dla wszystkich podstron.

## Struktura
```
assets/film/   kadry do animacji przewijania na Start (d = komputer, m = telefon)
assets/video/  rolki i aftermovie
assets/img/    plakaty, okładki, logotypy partnerów (img/partners)
js/            film.js (Start), club.js (klub 3D), carousel.js, partners.js, app.js …
vendor/        three.js, GSAP, Lenis, Leaflet (lokalnie, działa też offline)
```

Formularze (kontakt, newsletter) otwierają program pocztowy (mailto). Do wysyłki bez programu pocztowego można podpiąć np. Formspree.
