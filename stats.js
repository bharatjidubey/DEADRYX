// stats.js - Weekly & Monthly summary calculations

function computeStats() {
  const history = JSON.parse(localStorage.getItem("deadryx-historical-log-v1") || "{}");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
    let dayHasData = false;

    Object.keys(dayExercises).forEach(exName => {
      const sets = dayExercises[exName];
      Object.keys(sets).forEach(setKey => {
        const w = parseFloat(sets[setKey].weight || "0");
        const r = parseInt(sets[setKey].reps || "0");
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

  return {
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
}

function renderStats() {
  const container = document.getElementById("statsSummary");
  if (!container) return;
  const s = computeStats();
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

document.addEventListener("DOMContentLoaded", renderStats);