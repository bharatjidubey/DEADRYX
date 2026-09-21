// stats.js - Weekly & Monthly summary calculations with memoized caching

let _cachedStats = null;
let _lastStatsCompute = 0;
const STATS_CACHE_TTL = 10000; // 10 seconds

function computeStats(force = false) {
  const nowMs = Date.now();
  if (!force && _cachedStats && (nowMs - _lastStatsCompute < STATS_CACHE_TTL)) {
    return _cachedStats;
  }

  let history = {};
  try {
    const raw = localStorage.getItem("deadryx-historical-log-v1");
    if (raw) history = JSON.parse(raw);
  } catch (e) {
    history = {};
  }

  const now = new Date();
  const weekAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(nowMs - 30 * 24 * 60 * 60 * 1000);

  const stats = {
    week: { workouts: 0, totalVolume: 0, totalSets: 0, exercises: new Set() },
    month: { workouts: 0, totalVolume: 0, totalSets: 0, exercises: new Set() }
  };

  Object.keys(history).forEach(dateStr => {
    const d = new Date(dateStr);
    const inWeek = d >= weekAgo;
    const inMonth = d >= monthAgo;
    if (!inMonth) return;

    const dayExercises = history[dateStr];
    if (!dayExercises || typeof dayExercises !== "object") return;
    let dayHasData = false;

    Object.keys(dayExercises).forEach(exName => {
      const sets = dayExercises[exName];
      if (!sets || typeof sets !== "object") return;

      Object.keys(sets).forEach(setKey => {
        const setObj = sets[setKey];
        if (!setObj) return;
        const w = parseFloat(setObj.weight || "0");
        const r = parseInt(setObj.reps || "0", 10);
        if (w > 0 && r > 0) {
          dayHasData = true;
          const vol = w * r;
          if (inMonth) {
            stats.month.totalVolume += vol;
            stats.month.totalSets += 1;
            stats.month.exercises.add(exName);
          }
          if (inWeek) {
            stats.week.totalVolume += vol;
            stats.week.totalSets += 1;
            stats.week.exercises.add(exName);
          }
        }
      });
    });

    if (dayHasData) {
      if (inMonth) stats.month.workouts += 1;
      if (inWeek) stats.week.workouts += 1;
    }
  });

  _cachedStats = {
    week: {
      workouts: stats.week.workouts,
      volume: Math.round(stats.week.totalVolume),
      sets: stats.week.totalSets,
      uniqueExercises: stats.week.exercises.size
    },
    month: {
      workouts: stats.month.workouts,
      volume: Math.round(stats.month.totalVolume),
      sets: stats.month.totalSets,
      uniqueExercises: stats.month.exercises.size
    }
  };
  _lastStatsCompute = nowMs;

  return _cachedStats;
}

function renderStats(force = false) {
  const container = document.getElementById("statsSummary");
  if (!container) return;
  const s = computeStats(force);
  container.innerHTML = `
    <div class="stats-tabs">
      <button class="stats-tab active" data-period="week">This Week</button>
      <button class="stats-tab" data-period="month">This Month</button>
    </div>
    <div class="stats-grid" id="statsGrid">
      ${renderStatsPeriod(s.week)}
    </div>
  `;

  const grid = container.querySelector("#statsGrid");
  container.querySelectorAll(".stats-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      container.querySelectorAll(".stats-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const period = tab.dataset.period;
      grid.innerHTML = renderStatsPeriod(s[period]);
    });
  });
}

function renderStatsPeriod(data) {
  return `
    <div class="stat-card">
      <div class="stat-icon">🏋️</div>
      <div class="stat-value">${data.workouts}</div>
      <div class="stat-label">Workouts</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📊</div>
      <div class="stat-value">${data.volume.toLocaleString()}</div>
      <div class="stat-label">Total Volume (kg)</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🔢</div>
      <div class="stat-value">${data.sets}</div>
      <div class="stat-label">Sets Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">💪</div>
      <div class="stat-value">${data.uniqueExercises}</div>
      <div class="stat-label">Exercises</div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => renderStats(false));