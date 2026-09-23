# Changelog

All notable changes to the **DEADRYX** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
