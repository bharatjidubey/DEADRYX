// shared.js - Shared utilities: theme toggle, data backup, PR detection
// Include this on ALL pages BEFORE page-specific scripts.

// ================== THEME TOGGLE ==================
const THEME_KEY = "deadryx-theme-v1";

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
    btn.innerHTML = theme === "dark"
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    btn.setAttribute("title", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  });
}

function toggleTheme() {
  const current = loadTheme();
  applyTheme(current === "dark" ? "light" : "dark");
  triggerSync();
}

function triggerSync() {
  updateLastWriteTime();
  if (typeof uploadToDrive === "function") {
    uploadToDrive().catch(e => console.error("Drive upload failed", e));
  }
}

// Apply theme as early as possible to avoid flash
applyTheme(loadTheme());

// ================== SHARED HTML ESCAPE & ZOOM-SAFE TOOLTIP ==================
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
window.escapeHtml = escapeHtml;

let _tooltipZoomCache = null;
window.addEventListener("resize", () => { _tooltipZoomCache = null; }, { passive: true });

function getFixedZoomMetrics(tooltipEl) {
  const vw = document.documentElement.clientWidth || window.innerWidth;
  if (_tooltipZoomCache && _tooltipZoomCache.vw === vw) {
    return _tooltipZoomCache;
  }

  const prevLeft = tooltipEl.style.left;
  const prevTop = tooltipEl.style.top;

  tooltipEl.style.left = "0px";
  tooltipEl.style.top = "0px";
  const r0 = tooltipEl.getBoundingClientRect();

  tooltipEl.style.left = "100px";
  tooltipEl.style.top = "100px";
  const r100 = tooltipEl.getBoundingClientRect();

  tooltipEl.style.left = prevLeft;
  tooltipEl.style.top = prevTop;

  _tooltipZoomCache = {
    vw,
    originLeft: r0.left,
    originTop: r0.top,
    scaleX: (r100.left - r0.left) / 100 || 1,
    scaleY: (r100.top - r0.top) / 100 || 1
  };
  return _tooltipZoomCache;
}

/**
 * Position a fixed-position tooltip near a viewport anchor coordinate (clientX, clientY),
 * calibrating once per viewport size so root CSS zoom (e.g. html { zoom: 0.75 })
 * never shifts the rendered box or triggers redundant reflows during hover.
 */
function positionFloatingTooltip(tooltipEl, anchorClientX, anchorClientY, gap = 14) {
  if (!tooltipEl) return;

  tooltipEl.classList.add("visible");
  const { originLeft, originTop, scaleX, scaleY } = getFixedZoomMetrics(tooltipEl);
  const rect = tooltipEl.getBoundingClientRect();

  const ttW = rect.width || (tooltipEl.offsetWidth * scaleX) || 140;
  const ttH = rect.height || (tooltipEl.offsetHeight * scaleY) || 56;

  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;

  let targetLeft = anchorClientX - (ttW / 2);
  let targetTop = anchorClientY - ttH - gap;

  if (targetLeft < 8) targetLeft = 8;
  if (targetLeft + ttW > vw - 8) targetLeft = Math.max(8, vw - ttW - 8);
  if (targetTop < 8) targetTop = anchorClientY + gap + 6;
  if (targetTop + ttH > vh - 8) targetTop = Math.max(8, vh - ttH - 8);

  tooltipEl.style.left = ((targetLeft - originLeft) / scaleX) + "px";
  tooltipEl.style.top = ((targetTop - originTop) / scaleY) + "px";
}
window.positionFloatingTooltip = positionFloatingTooltip;

// ================== DATA EXPORT / IMPORT ==================
const BACKUP_KEYS = [
  "deadryx-workout-history-v1",
  "deadryx-attendance-v1",
  "deadryx-historical-log-v1",
  "deadryx-custom-exercises-v1",
  "deadryx-hidden-exercises-v1",
  "deadryx-split-config-v1",
  "deadryx-targets-v1",
  "deadryx-notes-v1",
  "deadryx-pr-records-v1",
  "deadryx-bmi-history-v1",
  "deadryx-bmi-profile-v1",
  "deadryx-bmi-target-v1",
  "deadryx-exercise-order-v1",
  "deadryx-media-sync-v1",
  "deadryx-timer-prefs-v1",
  "deadryx-last-write-v1",
  THEME_KEY
];
window.BACKUP_KEYS = BACKUP_KEYS;

function updateLastWriteTime() {
  localStorage.setItem("deadryx-last-write-v1", new Date().toISOString());
}

function exportAllData() {
  const data = {
    _meta: {
      app: "DEADRYX",
      version: 1,
      exportedAt: new Date().toISOString()
    }
  };
  BACKUP_KEYS.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw !== null) data[key] = raw;
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `deadryx-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importAllData(file) {
  return new Promise((resolve, reject) => {
    const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (!file || file.size > MAX_IMPORT_SIZE) {
      return reject(new Error("File exceeds maximum allowed import size (5MB)."));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || typeof data !== "object") {
          return reject(new Error("Invalid backup file format."));
        }
        if (!data._meta || data._meta.app !== "DEADRYX") {
          if (!confirm("This file doesn't look like a DEADRYX backup. Import anyway?")) {
            return reject(new Error("Import cancelled"));
          }
        }
        let imported = 0;
        BACKUP_KEYS.forEach(key => {
          if (data[key] !== undefined) {
            const val = typeof data[key] === "string" ? data[key] : JSON.stringify(data[key]);
            localStorage.setItem(key, val);
            imported++;
          }
        });

        // Also normalize AI plan schema keys if present and not yet imported
        if (data.split && data["deadryx-split-config-v1"] === undefined) {
          localStorage.setItem("deadryx-split-config-v1", typeof data.split === "string" ? data.split : JSON.stringify(data.split));
          imported++;
        }
        if (data.customExercises && data["deadryx-custom-exercises-v1"] === undefined) {
          localStorage.setItem("deadryx-custom-exercises-v1", typeof data.customExercises === "string" ? data.customExercises : JSON.stringify(data.customExercises));
          imported++;
        }
        if (data.workoutHistory && data["deadryx-workout-history-v1"] === undefined) {
          localStorage.setItem("deadryx-workout-history-v1", typeof data.workoutHistory === "string" ? data.workoutHistory : JSON.stringify(data.workoutHistory));
          imported++;
        }
        if (data.historicalLog && data["deadryx-historical-log-v1"] === undefined) {
          localStorage.setItem("deadryx-historical-log-v1", typeof data.historicalLog === "string" ? data.historicalLog : JSON.stringify(data.historicalLog));
          imported++;
        }
        if (data.attendance && data["deadryx-attendance-v1"] === undefined) {
          localStorage.setItem("deadryx-attendance-v1", typeof data.attendance === "string" ? data.attendance : JSON.stringify(data.attendance));
          imported++;
        }
        if (data.prRecords && data["deadryx-pr-records-v1"] === undefined) {
          localStorage.setItem("deadryx-pr-records-v1", typeof data.prRecords === "string" ? data.prRecords : JSON.stringify(data.prRecords));
          imported++;
        }
        if (data.targets && data["deadryx-targets-v1"] === undefined) {
          localStorage.setItem("deadryx-targets-v1", typeof data.targets === "string" ? data.targets : JSON.stringify(data.targets));
          imported++;
        }
        if (data.notes && data["deadryx-notes-v1"] === undefined) {
          localStorage.setItem("deadryx-notes-v1", typeof data.notes === "string" ? data.notes : JSON.stringify(data.notes));
          imported++;
        }
        resolve(imported);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ================== PR DETECTION & CELEBRATION ==================
const PR_KEY = "deadryx-pr-records-v1";

function loadPRRecords() {
  try {
    return JSON.parse(localStorage.getItem(PR_KEY)) || {};
  } catch { return {}; }
}

function savePRRecords(data) {
  localStorage.setItem(PR_KEY, JSON.stringify(data));
}

function detectAndRecordPR(exerciseName, weight, reps) {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || w <= 0 || !r || r <= 0) return null;

  const records = loadPRRecords();
  const cleanKey = (exerciseName || "").trim().toLowerCase();
  const existing = records[cleanKey] || records[exerciseName] || { weight: 0, reps: 0, date: null };

  const isWeightPR = w > existing.weight;
  const isRepsPR = w === existing.weight && r > existing.reps;

  if (isWeightPR || isRepsPR) {
    const updated = {
      weight: Math.max(w, existing.weight),
      reps: isWeightPR ? r : Math.max(r, existing.reps),
      date: new Date().toISOString().split("T")[0]
    };
    records[cleanKey] = updated;
    records[exerciseName] = updated;
    savePRRecords(records);
    return {
      isPR: true,
      exerciseName,
      previous: existing,
      current: { weight: w, reps: r },
      type: isWeightPR ? "weight" : "reps"
    };
  }
  return null;
}

function celebratePR(prData) {
  if (typeof confetti === "function") {
    const duration = 2500;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#60a5fa', '#34d399', '#fbbf24'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#60a5fa', '#34d399', '#fbbf24'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  }

  const toast = document.createElement("div");
  toast.className = "pr-toast";
  const prevStr = prData.previous.weight
    ? `${prData.previous.weight}kg × ${prData.previous.reps}`
    : "First record!";
  toast.innerHTML = `
    <div class="pr-toast-icon">🏆</div>
    <div class="pr-toast-body">
      <strong>NEW PERSONAL RECORD!</strong>
      <span>${prData.exerciseName}</span>
      <span class="pr-toast-stats">${prData.current.weight}kg × ${prData.current.reps} reps</span>
      <span class="pr-toast-prev">Previous: ${prevStr}</span>
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}

// ================== SERVICE WORKER REGISTRATION ==================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ================== CENTRALIZED DOM INITIALIZATION ==================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Theme toggle buttons
  document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
    btn.addEventListener("click", toggleTheme);
  });
  applyTheme(loadTheme());

  // 2. Storage consent banner
  const consentBanner = document.getElementById("storageConsentBanner");
  const acceptBtn = document.getElementById("acceptStorageBtn");
  if (consentBanner && acceptBtn) {
    if (!localStorage.getItem("deadryx_storage_consent")) {
      setTimeout(() => consentBanner.classList.add("show"), 500);
    }
    acceptBtn.addEventListener("click", () => {
      localStorage.setItem("deadryx_storage_consent", "true");
      consentBanner.classList.remove("show");
    });
  }

  // 3. Centralized mobile sidebar drawer & avatar navigation
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileAvatars = document.querySelectorAll(".mobile-avatar, #mobileAvatarBtn");
  const appSidebar = document.getElementById("appSidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (appSidebar) {
    const toggle = (e) => {
      e.stopPropagation();
      appSidebar.classList.toggle("open");
      if (sidebarOverlay) sidebarOverlay.classList.toggle("active");
    };

    mobileAvatars.forEach(av => {
      av.addEventListener("click", toggle);
      av.style.cursor = "pointer";
      av.setAttribute("role", "button");
      av.setAttribute("tabindex", "0");
      av.setAttribute("aria-label", "Open navigation menu and profile");
      av.setAttribute("title", "Open Menu & Profile");
      av.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle(e);
        }
      });
    });

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", toggle);
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => {
        appSidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
      });
    }
  }
});

// ================== GLOBAL ESCAPE KEY HANDLER ==================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // 1. Close open modals & dropdowns
    document.querySelectorAll(".modal-overlay.active, .modal-overlay.show, .tools-modal.active, .exercise-dropdown-menu.open").forEach(m => {
      m.classList.remove("active", "show", "open");
    });
    // 2. Close mobile sidebar drawer
    const sb = document.getElementById("appSidebar");
    const ov = document.getElementById("sidebarOverlay");
    if (sb && sb.classList.contains("open")) {
      sb.classList.remove("open");
      if (ov) ov.classList.remove("active");
    }
    // 3. Close tools FAB menu
    const fab = document.getElementById("toolsFAB");
    if (fab && fab.classList.contains("open")) {
      fab.classList.remove("open");
    }
    // 4. Close lightbox
    const lb = document.getElementById("mediaLightbox");
    if (lb && lb.classList.contains("active")) {
      if (typeof closeLightbox === "function") {
        closeLightbox();
      } else {
        lb.classList.remove("active");
        document.body.style.overflow = "";
      }
    }
  }
});