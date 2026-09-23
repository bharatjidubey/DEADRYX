# Contributing to DEADRYX

First off, thank you for considering contributing to DEADRYX! Our mission is to provide dedicated athletes, powerlifters, and gym-goers with an ultra-clean, completely free, and offline-first workout tracking experience.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/DEADRYX.git
   cd DEADRYX
   ```
3. **Run a local test server**:
   No build tools or bundlers are required! DEADRYX is 100% vanilla HTML, CSS, and JavaScript.
   ```bash
   python -m http.server 8080
   # or
   npx serve .
   ```
4. Open `http://localhost:8080` in your web browser.

## Architectural Principles

When writing or modifying code in DEADRYX, please adhere to these core rules:
- **Zero Build Frameworks**: Use Vanilla HTML5, Vanilla ES6+ JavaScript, and Vanilla CSS3. Do not add React, Vue, Webpack, or Tailwind unless explicitly approved.
- **Offline-First**: All core features must work without an active internet connection. Use `localStorage` for structured key-value state and `IndexedDB` for media files.
- **Privacy First**: Never introduce third-party ad networks, tracking scripts, or analytics beacons.
- **Performance & PWA**: Ensure all new files are added to the service worker cache list in `sw.js` and update the cache version identifier.
- **Aesthetic Excellence**: Follow the dark-mode glassmorphic theme defined in `styles.css` using CSS custom properties (`var(--green)`, `var(--panel-2)`, `var(--border)`, etc.).

## Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add RPE 0.5 step selector`
- `fix: prevent 30s timer from wiping active input`
- `docs: update PRD and architecture diagrams`
- `perf: memoize weekly stats calculation`
- `style: enhance plate visual contrast in light mode`

## Submitting a Pull Request

1. Create a descriptive feature branch: `git checkout -b feat/warmup-ladder-rpe`.
2. Ensure your changes don't break existing features and verify bracket/brace balance.
3. Test in both **Desktop** and **Mobile** viewports (360px–420px width).
4. Verify dark and light themes.
5. Push to your branch and submit a Pull Request to `main`.
