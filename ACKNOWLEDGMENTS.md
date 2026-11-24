# Acknowledgments

- **Project**: DEADRYX
- **Author**: Bharat Ji Dubey ([bharatjid021@gmail.com](mailto:bharatjid021@gmail.com))
- **Repository**: [https://github.com/bharatjidubey/DEADRYX](https://github.com/bharatjidubey/DEADRYX)

DEADRYX is built on the shoulders of outstanding open-source libraries, published fitness science, and the collective knowledge of the web development community. This document credits every external contribution that made the app possible.

---

## 1. Third-Party Libraries

| Library | Version | Purpose | License |
| :--- | :--- | :--- | :--- |
| [Confetti.js](https://github.com/mathusummut/confetti.js) | Latest | Full-screen confetti animation on Personal Record detections | MIT |
| [Chart.js](https://www.chartjs.org/) | 4.x | Interactive progress line charts on the Analytics page | MIT |
| [Google Identity Services (GIS)](https://developers.google.com/identity) | Latest | Client-side OAuth 2.0 token management for Google Drive sync | Google APIs ToS |
| [Google Drive REST API v3](https://developers.google.com/drive/api/v3/reference) | v3 | Serverless cloud backup to `appDataFolder` | Google APIs ToS |

> Full license texts for bundled third-party code are reproduced in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

---

## 2. Fonts & Design Assets

| Asset | Author / Source | License |
| :--- | :--- | :--- |
| **Inter Typeface** | Rasmus Andersson, served via [Google Fonts](https://fonts.google.com/specimen/Inter) | SIL Open Font License 1.1 |
| **Glassmorphism Design Language** | Design pattern popularized by Apple (macOS Big Sur, 2020) and widely adopted across the web design community | — |
| **PWA Iconography** | Custom-designed for DEADRYX | MIT (same as project) |

---

## 3. Fitness Science References

The strength calculation engines in `tools.js` are based on peer-reviewed and published research:

| Formula / Standard | Source |
| :--- | :--- |
| **Brzycki 1RM Formula** | Brzycki, M. (1993). *Strength Testing — Predicting a One-Rep Max from Reps-to-Fatigue.* Journal of Physical Education, Recreation and Dance, 64(1), 88–90. |
| **Epley 1RM Formula** | Epley, B. (1985). *Poundage Chart.* Boyd Epley Workout. University of Nebraska–Lincoln. |
| **DOTS Powerlifting Coefficient** | Jansen, T. (2019). *DOTS Formula for Powerlifting.* Published and adopted by the International Powerlifting Federation (IPF). |
| **RPE / Borg Modified Scale** | Borg, G. (1982). *Psychophysical bases of perceived exertion.* Medicine & Science in Sports & Exercise, 14(5), 377–381. |

---

## 4. Infrastructure & Tooling

| Service | Purpose |
| :--- | :--- |
| [Netlify](https://www.netlify.com/) | Primary production hosting, edge CDN, CSP header injection via `_headers` |
| [Cloudflare Pages](https://pages.cloudflare.com/) | Secondary deployment target configured via `wrangler.jsonc` |
| [GitHub](https://github.com/bharatjidubey/DEADRYX) | Source code hosting, issue tracking, and release management |

---

## 5. Developer Community

DEADRYX was built in the spirit of the open web. The following community resources were indispensable during development:

- **[MDN Web Docs](https://developer.mozilla.org/)** — Authoritative reference for the Web Storage API, IndexedDB, Service Worker lifecycle, Web Audio API, and Web Bluetooth API.
- **[web.dev / Chrome for Developers](https://web.dev/)** — PWA best practices, Lighthouse auditing guidance, and Service Worker architecture patterns.
- **[Stack Overflow](https://stackoverflow.com/)** — Community-answered solutions for edge cases in localStorage quotas, IndexedDB transaction handling, and CSS custom property inheritance.
- **[Google Identity Services Docs](https://developers.google.com/identity/oauth2/web/guides/overview)** — OAuth 2.0 implicit flow migration and token management.

---

## 6. Contributors

See the **[Contributors graph](https://github.com/bharatjidubey/DEADRYX/graphs/contributors)** on GitHub for everyone who has submitted code, filed bugs, or suggested features.

---

> Want your name here? Read [CONTRIBUTING.md](CONTRIBUTING.md) and open a pull request. All contributions — code, bug reports, documentation, and feature ideas — are valued and credited.
