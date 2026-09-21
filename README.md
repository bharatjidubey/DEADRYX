# DEADRYX 🏋️‍♂️

> **The Free, Offline-First Gym Workout Tracker & Pro-Athlete Platform.**
> No ads. No subscriptions. No forced accounts. Your training data belongs to you.

[![Live Web App](https://img.shields.io/badge/Live%20App-deadryx.netlify.app-36e28a?style=for-the-badge&logo=netlify)](https://deadryx.netlify.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20First-60a5fa?style=for-the-badge&logo=pwa)](manifest.json)
[![Pure Vanilla](https://img.shields.io/badge/Stack-Vanilla%20HTML%20%7C%20CSS%20%7C%20JS-yellow?style=for-the-badge&logo=javascript)](docs/ARCHITECTURE.md)

---

## 🌟 Overview

**DEADRYX** is an ultra-fast, privacy-first workout logging platform engineered specifically for strength athletes, powerlifters, bodybuilders, and dedicated gym-goers. Built entirely with pure Vanilla web technologies, DEADRYX works 100% offline inside gym basements with zero reception, saving all workout sessions, personal records, and transformation media directly to browser storage.

When connected, athletes can seamlessly synchronize their data to their personal Google Drive without relying on centralized third-party servers.

---

## ✨ Features

### 1. In-Gym Workout Logger
- **7-Day Dynamic Split Routine**: Tailor target muscle groups per day (Push, Pull, Legs, Upper, Lower, or Custom).
- **10-Minute Anti-Cheating Lock**: Sessions lock 10 minutes after save to preserve data integrity and record genuine effort.
- **Previous Session Benchmarks**: Instant in-card visibility of weights and reps achieved during previous workouts.
- **Set Type Badges**: Cycle sets between Warmup (`W`), Normal (`N`), Drop (`D`), and Failure (`F`).
- **RPE & RIR Tracking**: Record exertion levels (6.0 through 10.0 in 0.5 increments).

### 2. Pro-Athlete Gym Utilities
- **Floating Rest Timer**: Quick 30s, 60s, 90s, 120s, and 180s countdown intervals with synthesized Web Audio chimes and device vibration.
- **Barbell Plate Calculator**: Computes exact Olympic plates per sleeve (25kg, 20kg, 15kg, 10kg, 5kg, 2.5kg, 1.25kg) with interactive visual bar rendering.
- **Warmup Ladder Generator**: Progressive percentage ramp preparing joints and central nervous system for top working sets.
- **Strength Engine (1RM & DOTS)**: Combined Brzycki and Epley estimated 1RM calculations plus official unisex DOTS powerlifting coefficient scores.
- **CSV Data Export**: Download complete training history into standard spreadsheet-ready CSV.

### 3. Visual Analytics & Records
- **Interactive Progress Charts**: Max-weight lifting progression curves powered by Chart.js.
- **PR Celebrations**: Automatic detection of new Personal Records with celebratory confetti animations.
- **Dynamic Exercise Switcher**: Switch between compound lifts directly from the Analytics dashboard.
- **Target Deadline Goals**: Set target weight milestones with calendar deadlines.

### 4. Fitness Transformation Memories
- **Photo & Video Gallery**: Capture transformation check-ins and form videos stored locally in IndexedDB (`FitnessMemoriesDB`).
- **Full-Screen Lightbox**: High-resolution image/video inspection.
- **Memory Leak Protection**: Active object URL registry preventing browser memory bloat.

### 5. Private Cloud Synchronization
- **Google Drive Sync**: Direct client-side OAuth 2.0 integration saving encrypted backups to the user's private `appDataFolder`.
- **Offline JSON Backups**: One-click manual backup download and restore.
- **Zero Telemetry**: No third-party ads, tracking cookies, or tracking pixels.

---

## 🛠️ Tech Stack & Philosophy

DEADRYX takes pride in a **zero-dependency build philosophy**:

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Structure** | Semantic HTML5 | Accessible, lightweight, zero-framework DOM |
| **Styling** | Vanilla CSS3 | Custom Properties, Glassmorphism, Responsive Grid (360px+) |
| **Logic** | Vanilla JavaScript (ES6+) | Event-delegated, modular architecture |
| **Storage** | LocalStorage + IndexedDB | Key-value application state & binary transformation media |
| **Offline** | Service Worker (`deadryx-cache-v5`) | Network-first asset caching, full offline PWA execution |
| **Cloud** | Google Drive REST API v3 | Client-side authorization & serverless backup |
| **Hosting** | Netlify / Cloudflare Pages | Edge-deployed static files with security headers |

---

## 🚀 Getting Started

Because DEADRYX requires no compilers, build pipelines, or node packages, running it locally is instant:

### Prerequisites
- Any modern web browser (Chrome, Edge, Safari, Firefox)
- Python 3.x or any local HTTP server utility

### Running Locally
```bash
# 1. Clone the repository
git clone https://github.com/bharatjidubey/DEADRYX.git
cd DEADRYX

# 2. Start a local server (needed for PWA Service Workers)
python -m http.server 8080

# 3. Open in your browser
# http://localhost:8080
```

---

## 📁 Repository Structure

```
DEADRYX/
├── index.html               # Main workout logging dashboard & calendar
├── analysis.html            # Progress charts & target analytics
├── memories.html            # Transformation photo/video memory gallery
├── notes.html               # Exercise-specific form notes & cues
├── privacy.html             # Privacy policy & data ownership statement
├── styles.css               # Master stylesheet (theme tokens & pro-tools)
├── script.js                # Core workout logger & calendar logic
├── tools.js                 # Rest Timer, Plate Calculator, Warmup, 1RM/DOTS
├── shared.js                # Themes, backup keys, PR engine, drawer navigation
├── stats.js                 # Weekly & monthly training volume statistics
├── bmi.js                   # Body Mass Index & caloric target calculator
├── memories.js              # IndexedDB media storage & timeline renderer
├── gdrive-sync.js           # Google Drive cloud sync integration
├── sw.js                    # Service Worker offline cache engine (v5)
├── manifest.json            # PWA manifest metadata
├── README.md                # Project documentation overview
├── LICENSE                  # MIT License
├── CHANGELOG.md             # Version release history
├── CONTRIBUTING.md          # Contribution guidelines
├── SECURITY.md              # Vulnerability disclosure policy
├── THIRD_PARTY_LICENSES.md  # Open-source third-party attributions
└── docs/                    # Complete Engineering & User Documentation
    ├── PRD.md               # Product Requirements Document
    ├── SRS.md               # Software Requirements Specification
    ├── ARCHITECTURE.md      # Architecture & system design diagrams
    ├── DATABASE.md          # LocalStorage schema & IndexedDB data dictionary
    ├── DESIGN.md            # UI/UX design tokens & style guide
    ├── SETUP.md             # Local setup & Google OAuth instructions
    ├── CODING_STANDARDS.md  # Engineering best practices & patterns
    ├── TEST_PLAN.md         # Quality assurance test suites
    ├── ROADMAP.md           # Future milestones
    ├── DEPLOYMENT.md        # Netlify & Cloudflare deployment guide
    ├── RELEASE_CHECKLIST.md # Production release checklist
    ├── BACKUP_DR.md         # Cloud sync & disaster recovery runbook
    ├── adr/                 # Architecture Decision Records
    │   ├── 0001-vanilla-stack-offline-first.md
    │   ├── 0002-indexeddb-media-storage.md
    │   └── 0003-google-drive-appdata-sync.md
    ├── user/                # Athlete & gym-goer user guides
    │   ├── GETTING_STARTED.md
    │   └── FAQ.md
    └── legal/               # Legal statements
        ├── PRIVACY_POLICY.md
        ├── TERMS.md
        └── COOKIES.md
```

---

## 📚 Complete Documentation Suite

For comprehensive documentation, refer to the guides in [`docs/`](docs/):
- **[Product Requirements Document (PRD)](docs/PRD.md)**
- **[Software Requirements Specification (SRS)](docs/SRS.md)**
- **[Architecture & Data Flow](docs/ARCHITECTURE.md)**
- **[Database & Storage Dictionary](docs/DATABASE.md)**
- **[UI/UX Design Spec](docs/DESIGN.md)**
- **[Developer Setup Guide](docs/SETUP.md)**
- **[Athlete Getting Started Guide](docs/user/GETTING_STARTED.md)**
- **[Frequently Asked Questions](docs/user/FAQ.md)**

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author & Support

Crafted with dedication by **Bharat Ji Dubey**:
- **Email**: [bharatjid021@gmail.com](mailto:bharatjid021@gmail.com)
- **Live App**: [deadryx.netlify.app](www.deadryx.me)
- **Support**: [Buy Me a Coffee](https://buymeacoffee.com/bharatjidubey)
