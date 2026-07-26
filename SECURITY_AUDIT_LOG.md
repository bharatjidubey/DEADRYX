# DEADRYX Security Audit Log

## Stack Detection (Step 0)
- **Architecture**: Client-side static web application (HTML5 / Vanilla JavaScript ES6 / Vanilla CSS / Progressive Web App).
- **Backend / Server**: No custom server backend (serverless client-only). Host-level security response headers configured via `_headers` & `netlify.toml`.
- **Database / Storage**: Client-side `localStorage` (workout logs, PR records, split config, themes), `IndexedDB` (`FitnessMemoriesDB` for media files), and user's personal `Google Drive REST API v3` (`appDataFolder` & `DEADRYX_Memories` folder) for encrypted cloud backup.
- **Authentication**: Client-side Google Identity Services (GIS) OAuth 2.0 explicit user token flow. No password storage or server-side auth token database.
- **Deployment Targets**: Netlify / Cloudflare Pages / GitHub Pages static web hosting.

---

## Phase 1 — Foundation: Secrets & Secure Deployment
- **Status**: PASSED
- **Findings**:
  - Scanned full codebase for hardcoded API keys and secrets. OAuth Client ID (`195627152960-...apps.googleusercontent.com`) is a public client identifier by OAuth 2.0 specification design and is safe in client-side code.
  - Secret scanning rules added to `.gitignore`.
  - Enforced HTTPS-only via HSTS (`max-age=31536000; includeSubDomains; preload`).
  - Added HTTP Security Headers via `_headers`, `netlify.toml`, and HTML `<meta>` fallbacks across all 5 HTML files (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
  - Added Subresource Integrity (SRI `sha384`) on external CDN scripts (`canvas-confetti`).
  - Added `rel="noopener noreferrer"` to all outgoing external links.

---

## Phase 2 — Input Validation & Injection Prevention
- **Status**: PASSED
- **Findings**:
  - Sanitized Google profile picture URLs (`sanitizeGoogleImageUrl`) to restrict sources strictly to `https://*.googleusercontent.com` or `https://*.google.com`.
  - Added `escapeHtml` utility to encode all user-controlled text strings inserted into `innerHTML`.
  - Added 5MB strict limit and payload validation on manual JSON backup imports (`importAllData`).
  - Enforced file type validation (`image/png`, `image/jpeg`, `video/mp4`) and file size limits (8MB for images, 25MB for videos) in `memories.js` before IndexedDB storage and Google Drive upload.

---

## Phase 3 — Abuse Protection & Rate Limiting
- **Status**: PASSED / MAPPED TO CLIENT ARCHITECTURE
- **Findings**:
  - As a static client-side web application without a custom API backend server, server-side IP rate-limiting middleware does not apply directly.
  - Client-side upload debouncing (`debounceUploadTimeout` 2500ms) implemented in `gdrive-sync.js` to prevent API quota abuse on Google Drive REST endpoints.
  - File size and upload count rate throttling applied in `memories.js`.

---

## Phase 4 — Authentication System Hardening
- **Status**: PASSED
- **Findings**:
  - Confirmed no custom password storage or custom password comparison logic exists anywhere in the codebase.
  - Authentication relies strictly on Google Identity Services (GIS) OAuth 2.0 PKCE / token flow.
  - Access tokens are short-lived and token expiration is validated (`Date.now() < parsedToken.expires_at`) before making API calls or loading cached user profiles.
  - Revocation endpoint (`google.accounts.oauth2.revoke`) called upon explicit Sign-out.

---

## Phase 5 — IDOR & Ownership Enforcement
- **Status**: PASSED / MAPPED TO ARCHITECTURE
- **Findings**:
  - Data privacy and ownership are enforced natively by Google Drive's zero-trust architecture: files are saved inside the logged-in user's private `appDataFolder` and `DEADRYX_Memories` folder on Google Drive.
  - Users can only read, update, or delete data stored within their own authenticated Google Drive container.
  - No multi-tenant backend server or shared database exists that could allow cross-user IDOR data leaks.
