# Changelog

All notable changes to the **DEADRYX** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-11-24

### Added
- **60-Day Full Lifecycle Simulation Suite**: Interactive browser-based test suite in `tests/simulation-runner.html` and `tests/simulation-engine.js` with Instant Batch Mode (< 3s), Real-Time Mode (1 min = 1 day), Single-Day Drill, 15 Anti-Tamper attack vectors, 25 special milestone events, and ~2,000+ automated assertions covering all 35 features.
- **New Visitor Welcome Onboarding Modal**: Automatic welcome modal for new unauthenticated visitors with custom sharp typography for "DEADRYX" (`Metal Mania`), feature overview cards (workouts, targets, analytics, memories, BMI, AI import), privacy guarantee, and state guard preventing display for signed-in users. Reopenable anytime from sidebar "Welcome Guide" button.
- **In-Browser Automated Test Runner**: Automated unit and integration test harness in `tests/test-runner.html` with 25 test suites and 79 assertions covering math, anti-tamper state machine, AI plan import stress tests, routine scoping, cloud sync conflict engine, timer drift prevention, CSV formula injection defense, RIR translation matrix, target auto-unlock, exercise cascade rename, and cross-day exercise links.
- **Cross-Day Same-Name Exercise Interconnection Engine**: Exercises sharing the exact same name across multiple split days (e.g., Lat Pulldown on Tuesday & Friday) now seamlessly link progressive overload benchmarks across sessions with full case-insensitivity and day-independent set scoping.
- **Mobile Navigation Streamlining**: Shifted sidebar drawer toggle to top mobile avatar; removed 3-dot menu and top search button for a distraction-free 4-tab bottom navigation bar.
- **QA & Testing Specification**: Comprehensive QA Test Plan v2.1.0 in `docs/TEST_PLAN.md` covering 9 manual test suites (53 test cases), automated suites matrix, and pre-deployment release checklist.
- **AI Workout Plan Onboarding & Importer**: Modal with copyable/downloadable prompt compatible with ChatGPT, Claude, and Gemini to generate personalized JSON plans from workouts, timetables, or images.
- **Dual Plan Application**: Option to choose between "Clean Slate" (wipe previous logs and start fresh) and "Merge / Overwrite" (update split and exercises while preserving logging history).
- **Custom Exercise Synchronization in Notes & Analysis**: Custom and imported exercises are now automatically surfaced in exercise selector dropdowns across `analysis.html` and `notes.html`.

### Fixed
- **Custom Day Isolation & Default Bleed Fix**: Resolved issue where default built-in exercises with 3 fallback sets were appended to days that already had custom exercises configured. Days with day-specific custom routines now exclusively display their planned exercises.
- **Set Type Cycling Alignment**: Corrected cycling sequence in test runner from `N` → `D` → `F` → `W` to match production `tools.js` sequence: `Normal (N)` → `Warmup (W)` → `Drop (D)` → `Failure (F)`.
- **Cross-Day Custom Exercise Deletion**: Scoped custom exercise deletion to the active day, preventing accidental cross-day deletions.

### Changed
- Upgraded Service Worker cache to `deadryx-cache-v6`.

---

## [2.0.0] - 2026-09-21

### Added
- **Floating Rest Timer**: In-gym rest timer widget with customizable countdown intervals (30s, 60s, 90s, 120s, 180s), Web Audio synthesized chimes, and haptic vibration feedback.
- **Barbell Plate Calculator**: Dynamic plate sleeve math engine calculating exact 25kg, 20kg, 15kg, 10kg, 5kg, 2.5kg, and 1.25kg plates needed per side with color-coded Olympic sleeve visualization.
- **Warmup Ladder Generator**: Automatic multi-step progressive warmup ramp percentages (empty bar, 50%, 70%, 85%, potentiation) to prepare nervous system before working sets.
- **Strength Engine (1RM & DOTS)**: Instant e1RM calculator (Brzycki & Epley formulas) and official DOTS powerlifting coefficient calculator for unisex strength evaluation.
- **Set Type Tagging & Cycling**: Badges for Warmup (`W`), Normal (`N`), Drop (`D`), and Failure (`F`) with cycling on click.
- **RPE / RIR Selector**: Per-set Rate of Perceived Exertion selector (6 to 10 in 0.5 increments).
- **Live e1RM Tooltip**: Real-time estimated 1RM calculated dynamically as athletes type weight and reps.
- **CSV History Export**: Download complete workout history into CSV format for external analysis in Google Sheets or Excel.
- **Interactive Exercise Selector**: Dropdowns on Analytics and Notes pages to easily switch between exercises.
- **Transformation Memory Deletion**: Added memory deletion with confirmation dialog.

### Changed
- Refactored workout logger event listeners to use single-listener event delegation on `#exerciseList`, drastically reducing DOM thrashing and memory overhead.
- Guarded the 30-second interval refresh to prevent disrupting active user typing or open modal dialogs.
- Fixed object URL leaks in transformation media gallery via automatic URL revocation.
- Upgraded Service Worker cache to `deadryx-cache-v5`.
- Unified all 16 LocalStorage backup keys into a single source of truth across local JSON export and Google Drive sync.

---

## [1.1.0] - 2026-06-15

### Added
- **Google Drive Cloud Sync**: Direct OAuth 2.0 integration backing up application state to private `appDataFolder`.
- **Transformation Media Gallery**: IndexedDB-backed fitness photos and video journaling (`memories.html`).
- **BMI & Target Weight Engine**: Body mass index calculator with historical weight tracking and daily caloric suggestion breakdowns.
- **Dark & Light Theme**: Toggleable glassmorphic UI with CSS custom properties.

---

## [1.0.0] - 2026-03-01

### Added
- **Core Workout Tracker**: Interactive 7-day calendar split tracker with muscle-to-day mappings.
- **10-Minute Lock Rule**: Tamper-proof logging window locking entries 10 minutes after save to encourage honest workout tracking.
- **Personal Record (PR) Engine**: Automatic weight and rep PR detection with confetti celebrations.
- **Progress Analytics**: Chart.js integration tracking max weight progression over time with yearly/lifetime filters.
- **PWA Capabilities**: Service worker caching and installable web app manifest.
