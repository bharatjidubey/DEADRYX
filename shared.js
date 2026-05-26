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
}

// Apply theme as early as possible to avoid flash
applyTheme(loadTheme());

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
  THEME_KEY
];

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
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data._meta || data._meta.app !== "DEADRYX") {
          if (!confirm("This file doesn't look like a DEADRYX backup. Import anyway?")) {
            return reject(new Error("Import cancelled"));
          }
        }
        let imported = 0;
        BACKUP_KEYS.forEach(key => {
          if (data[key] !== undefined) {
            localStorage.setItem(key, data[key]);
            imported++;
          }
        });
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
  const r = parseInt(reps);
  if (!w || w <= 0 || !r || r <= 0) return null;

  const records = loadPRRecords();
  const existing = records[exerciseName] || { weight: 0, reps: 0, date: null };

  let isWeightPR = w > existing.weight;
  let isRepsPR = w === existing.weight && r > existing.reps;

  if (isWeightPR || isRepsPR) {
    records[exerciseName] = {
      weight: Math.max(w, existing.weight),
      reps: isWeightPR ? r : Math.max(r, existing.reps),
      date: new Date().toISOString().split("T")[0]
    };
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
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#36e28a', '#4da3ff', '#f5c95f'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#36e28a', '#4da3ff', '#f5c95f'] });
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

// ================== THEME TOGGLE BUTTON WIRING ==================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
    btn.addEventListener("click", toggleTheme);
  });
  applyTheme(loadTheme());
});