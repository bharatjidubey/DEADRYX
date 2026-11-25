<div align="center">

<img src="logo.png" alt="DEADRYX Logo" width="88" height="88" />

# DEADRYX

**Offline-First Gym Workout Tracker, Strength Analytics & Athlete Utility Platform**

*Built as a solo student project by **Bharat Ji Dubey***

[![Live App](https://img.shields.io/badge/Live%20Website-deadryx.me-36e28a?style=for-the-badge&logo=cloudflare&logoColor=0b0f16)](https://deadryx.me)
[![Stage: Testing Phase](https://img.shields.io/badge/Status-Testing%20Phase-fbbf24?style=for-the-badge)](#status-notice)
[![Hosted On](https://img.shields.io/badge/Hosted-Cloudflare%20%26%20GitHub-60a5fa?style=for-the-badge&logo=github)](https://github.com/bharatjidubey/DEADRYX)
[![License: MIT](https://img.shields.io/badge/License-MIT-94a3b8?style=for-the-badge)](LICENSE)

[Live App](https://deadryx.me) · [GitHub Repo](https://github.com/bharatjidubey/DEADRYX) · [Features](#features--how-they-work) · [Tech Stack](#tech-stack--architecture) · [Run Locally](#getting-started-locally) · [Project Structure](#project-structure) · [Privacy](privacy.html)

</div>

---

## Status Notice

> **Currently in Active Testing Phase:** DEADRYX is live at **[https://deadryx.me](https://deadryx.me)** as an ongoing solo student project. Core workout logging, analytics, offline caching, and Google Drive sync are operational while UI/UX refinements and new features continue to roll out. Keeping periodic local JSON backups via **Settings → Export** is recommended during testing.

---

## Overview

**DEADRYX** is a zero-dependency, privacy-first web application built specifically for lifters who want speed, reliability, and total data ownership—without ads, paywalls, or forced accounts.

- **Works Anywhere:** Service Worker offline caching (`deadryx-cache-v16`) keeps the app functional in gym basements with no signal.
- **Data Stays Yours:** Workout logs, PRs, targets, notes, and body metrics are stored in browser `localStorage`; progress photos and videos are stored offline in IndexedDB (`FitnessMemoriesDB`).
- **Optional Serverless Cloud Sync:** Connect a personal Google account to synchronize data directly to your private Google Drive `appDataFolder`.
- **Zero Build Pipeline:** Pure semantic HTML5, CSS3, and modular ES6+ JavaScript hosted via **Cloudflare** and **GitHub**.

---

## Features & How They Work

### 1. Workout Logger & Dynamic 7-Day Split
*Pages: `index.html` · Script: `script.js`*

- **Customizable Weekly Split:** Assign any combination of `Chest`, `Back`, `Shoulders`, `Biceps`, `Triceps`, `Legs`, `Abs`, or `Rest` across Monday–Sunday and switch days via the calendar grid.
- **Structured Set Tracking:** Log weight and reps per set, click set badges to cycle types (**Warmup `W`**, **Normal `N`**, **Drop `D`**, **Failure `F`**), select **RPE (`6.0–10.0`)**, and view live inline **Estimated 1RM (`e1RM`)** as you type.
- **Previous Session Benchmarks:** Automatically scans historical logs case-insensitively across all training days to display your most recent weight, reps, and date right beside each set.
- **10-Minute Anti-Tamper Edit Lock:** Newly saved sets for today remain editable for **10 minutes** (`Editable (Xm left)`), then permanently lock to preserve authentic training records; non-today days remain read-only.
- **Flexible Routine Editor:** Add custom exercises with muscle autocomplete, change set counts, reorder/delete movements, copy exercises from another day, or rename exercises with automatic key migration across history, PRs, notes, and targets.

### 2. AI Workout Plan Onboarding & Data Portability
*Scripts: `script.js`, `shared.js`, `tools.js`*

- **Setup Plan with AI:** Copy or download the structured DEADRYX AI prompt for ChatGPT, Claude, or Gemini, then upload or drag-and-drop the generated `.json` routine in **Merge (preserve workout history)** or **Clean Slate (reset)** mode.
- **JSON Backup & Restore:** One-click export and drag-and-drop restore across all 17 `localStorage` state keys.
- **CSV History Export:** Generates a clean spreadsheet-ready `.csv` containing Date, Day, Exercise, Muscle Group, Set #, Set Type, Weight, Reps, RPE, and Estimated 1RM.

### 3. Pro-Athlete In-Gym Utilities
*Script: `tools.js`*

- **Floating Rest Timer:** Built-in countdown timer (`30s`, `60s`, `90s`, `120s`, `180s` presets, `±15s` controls, pause/reset, and optional auto-start on workout save) with synthesized Web Audio countdown beeps/chime and device vibration.
- **Barbell Plate Calculator:** Computes per-side plate loading (`25kg` down to `1.25kg`) across Olympic (`20kg`), Women's (`15kg`), Smith/EZ (`10kg`), and `0kg` bars with a visual bar-sleeve diagram.
- **Warmup Ladder Generator:** Builds progressive percentage ramp sets (`Empty Bar`, `50%`, `70%`, `85%`, `92%`) up to your working weight.
- **Strength Calculator (1RM & DOTS):** Estimates 1RM by averaging Brzycki and Epley formulas (`60%–95%` breakdown) and calculates unisex **DOTS** powerlifting scores from Squat, Bench, Deadlift, and body weight.

### 4. Progress Analytics, Targets & PR Engine
*Page: `analysis.html` · Scripts: `analysis.js`, `shared.js`*

- **Max-Weight Progression Chart:** Chart.js curve that automatically plots the **highest weight logged** across all sets for each session, with an exercise switcher and **This Year** / **Lifetime** views.
- **Zoom-Calibrated Hover & Tap Inspection:** Hovering or tapping any dot draws a concentric target ring and anchors a floating tooltip (**Date** + **Weight**) directly above the dot, alongside an inspect bar.
- **Target Milestones & 3rd-Set Reference:** Lock target weights with calendar deadlines (automatically unlocking once surpassed). The Y-axis dynamically scales around both logged weights and targets so lower targets never clip higher lifts.
- **PR Celebrations:** Automatically detects weight or rep Personal Records when saving a workout, firing `canvas-confetti` bursts and a PR notification toast.

### 5. Activity Heatmap & Training Statistics
*Scripts: `script.js`, `stats.js`*

- **1-Year Activity Heatmap:** GitHub-style contribution grid displaying daily logged exercise counts across the year with floating date/activity tooltips.
- **Weekly & Monthly Stats Summary:** Displays **This Week (7 days)** and **This Month (30 days)** metrics for workouts, total volume (`kg`), sets completed, and unique exercises.

### 6. BMI Gauge & Gym Nutrition Calculator
*Script: `bmi.js`*

- **Body Composition & Trend Chart:** Animated SVG BMI gauge (`Underweight`, `Healthy`, `Overweight`, `Obese`), `kg`/`lbs` and `cm`/`ft+in`/`in` units, Body Fat %, Muscle Mass, target tracking, and an interactive dual-line Weight & BMI canvas chart with dot tooltips.
- **Nutrition Calculator:** Estimates daily calories and macros (`Protein = Weight × 2g`, `Fat = Weight × 0.8g`, `Carbs = remaining kcal ÷ 4`) across **Maintain**, **Bulk (`+400 kcal`)**, and **Cut (`-500 kcal`)** goals.

### 7. Exercise Form Notes
*Page: `notes.html` · Script: `notes.js`*

- Dedicated per-exercise workspace for seat heights, cues, and technique reminders featuring an edit-lock toggle, automatic `💪` bullet formatting on `Enter`, and `750ms` debounced auto-save.

### 8. Offline Fitness Memories Gallery
*Page: `memories.html` · Script: `memories.js`*

- Stores transformation photos (`PNG`/`JPEG`, up to `8 MB`) and form videos (`MP4`, up to `25 MB`) locally in browser **IndexedDB** (`FitnessMemoriesDB`), complete with upload progress toasts, a full-screen lightbox viewer, and automatic `URL.revokeObjectURL` memory cleanup.

### 9. Google Drive Cloud Sync, Themes & PWA
*Scripts: `gdrive-sync.js`, `sw.js`, `shared.js`*

- **Client-Side OAuth 2.0 Sync:** Backs up structured workout logs (`deadryx_sync_data.json` with Last-Write-Wins timestamps) and Memories media (`DEADRYX_Memories` folder) inside the user's private Google Drive `appDataFolder`, with automatic sync on reconnect.
- **Offline PWA & Themes:** Network-first Service Worker (`deadryx-cache-v16`) caches core runtime assets for offline reliability alongside synced Dark/Light themes and responsive mobile drawer + bottom navigation.

---

## Tech Stack & Architecture

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Markup** | Semantic HTML5 | Five standalone multi-page views |
| **Styling** | Vanilla CSS3 | Custom theme variables, glassmorphic cards, responsive grid |
| **Application Logic** | Vanilla JavaScript (ES6+) | Modular state management, Canvas 2D charts & delegated events |
| **Visualizations** | Chart.js & canvas-confetti (CDN) | Exercise progression graphs & PR celebrations |
| **Browser Storage** | `localStorage` + IndexedDB | Structured workout state (`17` keys) & binary media storage |
| **Offline Engine** | Service Worker (`deadryx-cache-v16`) | Network-first caching & offline fallback via `sw.js` |
| **Cloud Backup** | Google Identity + Drive API v3 | Serverless client-side sync in private `appDataFolder` |
| **Hosting & Edge** | Cloudflare + GitHub | Live delivery via `deadryx.me`, `wrangler.jsonc`, and `_headers` |

---

## Getting Started Locally

No build tools or package installation required—serve the root directory over any local HTTP server (required for Service Workers and OAuth):

```bash
# 1. Clone the repository
git clone https://github.com/bharatjidubey/DEADRYX.git
cd DEADRYX

# 2. Start a local static server
python -m http.server 8080

# 3. Visit http://localhost:8080 in your browser
```

---

## Project Structure

```text
DEADRYX/
├── index.html          # Main workout logger, split calendar, heatmap & BMI panel
├── analysis.html       # Exercise progress charts & target deadline tracker
├── notes.html          # Exercise form cues & training notes
├── memories.html       # Offline photo & video transformation timeline
├── privacy.html        # Privacy policy & client-side storage disclosures
├── styles.css          # Master dark/light theme & responsive stylesheet
│
├── shared.js           # Theme manager, backup I/O, PR detection, nav & tooltips
├── script.js           # Workout logging engine, split editor, AI import & quotes
├── tools.js            # Rest timer, plate calculator, warmup ladder, 1RM/DOTS & CSV
├── analysis.js         # Chart.js analytics, hover inspection & dynamic Y-axis bounds
├── bmi.js              # BMI gauge, nutrition macros & Weight/BMI trend chart
├── notes.js            # Auto-saving exercise notes controller
├── memories.js         # IndexedDB media store, upload toast & lightbox viewer
├── stats.js            # Weekly & monthly volume summary calculations
├── gdrive-sync.js      # Google Drive OAuth2 & media sync integration
│
├── sw.js               # Offline-first PWA Service Worker (deadryx-cache-v16)
├── manifest.json       # Web App Manifest metadata
├── logo.png            # Application logo
├── favicon.png         # Browser tab icon
├── icon-192.png        # PWA install icon
│
├── wrangler.jsonc      # Cloudflare Workers/Pages static assets config
├── _headers            # Cloudflare security & CSP response headers
├── robots.txt          # Search engine crawler directives
├── sitemap.xml         # Sitemap for live public routes
├── README.md           # Project overview & documentation
├── LICENSE             # MIT License
└── .gitignore          # Git ignore rules
```

---

## Privacy & License

- **Privacy:** DEADRYX collects zero analytics or tracking telemetry. See [privacy.html](privacy.html) for full client-side storage and Google Drive permission details.
- **License:** Released under the **MIT License** — see [LICENSE](LICENSE).

---

## Author

**Bharat Ji Dubey** *(Student · Solo Developer)*  
- **Live Website:** [https://deadryx.me](https://deadryx.me)  
- **GitHub Repository:** [https://github.com/bharatjidubey/DEADRYX](https://github.com/bharatjidubey/DEADRYX)  
- **Email:** [bharatjid021@gmail.com](mailto:bharatjid021@gmail.com)  
- **Support:** [Buy Me a Coffee](https://buymeacoffee.com/bharatjidubey)
