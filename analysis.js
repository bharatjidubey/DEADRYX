const HISTORICAL_KEY = "deadryx-historical-log-v1";
const TARGET_KEY = "deadryx-targets-v1";
const exerciseTitle = document.getElementById("exerciseTitle");
const progressChartCanvas = document.getElementById("progressChart");
const emptyState = document.getElementById("emptyState");
const btnThisYear = document.getElementById("btnThisYear");
const btnLifetime = document.getElementById("btnLifetime");

const targetPanel = document.getElementById("targetPanel");
const targetWeightInput = document.getElementById("targetWeight");
const targetDateInput = document.getElementById("targetDate");
const saveTargetBtn = document.getElementById("saveTargetBtn");

let chartInstance = null;
let historicalData = [];
let currentFilteredData = [];
let currentViewMode = "thisYear";
let currentLabels = [];
let currentFullDates = [];
let currentDataPoints = [];
let currentActiveIndices = [];
let hoveredDotIndex = null;

const params = new URLSearchParams(window.location.search);
let exerciseName = params.get("exercise") || "";

function safeEscape(str) {
  return (typeof window.escapeHtml === "function")
    ? window.escapeHtml(str)
    : String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getOrCreateChartTooltip() {
  let ttEl = document.getElementById("chartjs-tooltip");
  if (!ttEl) {
    ttEl = document.createElement("div");
    ttEl.id = "chartjs-tooltip";
    ttEl.className = "graph-floating-tooltip";
    document.body.appendChild(ttEl);
  }
  return ttEl;
}

function getAllAvailableExercises() {
  const raw = loadHistoricalLog();
  const set = new Set();

  // 1. Gather all exercises from history
  Object.keys(raw).forEach(date => {
    if (raw[date] && typeof raw[date] === "object") {
      Object.keys(raw[date]).forEach(ex => {
        if (ex && ex !== "Exercise") set.add(ex);
      });
    }
  });

  // 2. Add custom exercises from user plan
  try {
    const customs = JSON.parse(localStorage.getItem("deadryx-custom-exercises-v1") || "[]");
    customs.forEach(c => {
      if (c && c.name) set.add(c.name);
    });
  } catch {}

  // 3. Add standard popular exercises
  const DEFAULT_LIST = [
    "Barbell Bench Press", "Incline Dumbbell Press", "Cable Crossover",
    "Barbell Squat", "Leg Press", "Romanian Deadlift", "Bulgarian Split Squat",
    "Deadlift", "Pull-up", "Lat Pulldown", "Barbell Row",
    "Overhead Press", "Lateral Raise", "Barbell Curl", "Hammer Curl",
    "Tricep Pushdown", "Skull Crushers", "Cable Crunch", "Plank"
  ];
  DEFAULT_LIST.forEach(ex => set.add(ex));

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function initExerciseSelect() {
  const select = document.getElementById("exerciseSelect");
  const exercises = getAllAvailableExercises();

  // If exerciseName is not specified in URL, pick the most recent one with data or default
  if (!exerciseName) {
    const raw = loadHistoricalLog();
    const dates = Object.keys(raw).sort().reverse();
    let found = null;
    for (const d of dates) {
      const exs = Object.keys(raw[d] || {});
      if (exs.length > 0) {
        found = exs[0];
        break;
      }
    }
    exerciseName = found || "Barbell Bench Press";
  }

  if (exerciseTitle) {
    exerciseTitle.textContent = `${exerciseName} Progress`;
  }

  if (select) {
    select.innerHTML = "";
    exercises.forEach(ex => {
      const opt = document.createElement("option");
      opt.value = ex;
      opt.textContent = ex;
      if (ex.toLowerCase() === exerciseName.toLowerCase()) {
        opt.selected = true;
        exerciseName = ex;
      }
      select.appendChild(opt);
    });

    select.addEventListener("change", (e) => {
      switchExercise(e.target.value);
    });
  }
}

function switchExercise(newName) {
  exerciseName = newName;
  if (exerciseTitle) {
    exerciseTitle.textContent = `${exerciseName} Progress`;
  }
  const newUrl = new URL(window.location);
  newUrl.searchParams.set("exercise", exerciseName);
  window.history.replaceState({}, "", newUrl);

  historicalData = processHistoricalData();
  renderChart(currentViewMode);
}

function loadHistoricalLog() {
  try {
    const raw = localStorage.getItem(HISTORICAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) { return {}; }
}

function loadTargets() {
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) { return {}; }
}

function saveTargets(data) {
  localStorage.setItem(TARGET_KEY, JSON.stringify(data));
}

function formatDeadline(stored) {
  if (!stored) return "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(stored)) {
    const [y, m, d] = stored.split("-");
    return parseInt(d, 10) + " " + months[parseInt(m, 10) - 1] + " " + y;
  }
  // Handle old YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(stored)) {
    const [y, m] = stored.split("-");
    return "1 " + months[parseInt(m, 10) - 1] + " " + y;
  }
  return stored;
}

function parseDeadline(text) {
  if (!text) return "";
  const t = text.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  // Already YYYY-MM (old format)
  if (/^\d{4}-\d{2}$/.test(t)) return t + "-01";
  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = t.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})$/);
  if (dmy) return dmy[3] + "-" + dmy[2].padStart(2, "0") + "-" + dmy[1].padStart(2, "0");
  // "25 Dec 2026" or "25 Dec, 2026"
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const parts = t.replace(",", "").toLowerCase().split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const mi = months.indexOf(parts[1].substring(0, 3));
    const year = parts[2];
    if (day && mi >= 0 && /^\d{4}$/.test(year)) {
      return year + "-" + String(mi + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    }
  }
  return t;
}

function renderTargetBlock() {
  if (!targetWeightInput || !targetDateInput || !saveTargetBtn) return;
  const targets = loadTargets();
  const exTargets = targets[exerciseName] || {};
  const t = exTargets[currentViewMode];

  if (t && t.weight) {
    targetWeightInput.value = t.weight;
    targetDateInput.value = formatDeadline(t.deadline) || "";

    let highestWeight = 0;
    currentFilteredData.forEach(item => {
      if (item.maxWeight > highestWeight) highestWeight = item.maxWeight;
    });

    if (highestWeight >= parseFloat(t.weight)) {
      targetWeightInput.disabled = false;
      targetDateInput.disabled = false;
      saveTargetBtn.disabled = false;
      saveTargetBtn.textContent = "Target Reached! Set New";
      saveTargetBtn.classList.remove("locked");
    } else {
      targetWeightInput.disabled = true;
      targetDateInput.disabled = true;
      saveTargetBtn.disabled = true;
      saveTargetBtn.textContent = "Target Locked";
      saveTargetBtn.classList.add("locked");
    }
  } else {
    targetWeightInput.value = "";
    targetDateInput.value = "";
    targetWeightInput.disabled = false;
    targetDateInput.disabled = false;
    saveTargetBtn.disabled = false;
    saveTargetBtn.textContent = "Lock Target";
    saveTargetBtn.classList.remove("locked");
  }
}

function processHistoricalData() {
  const rawData = loadHistoricalLog();
  const dates = Object.keys(rawData).sort();

  const processed = [];

  const cleanTarget = (exerciseName || "").trim().toLowerCase();

  dates.forEach(date => {
    const dayData = rawData[date];
    if (!dayData || typeof dayData !== "object") return;
    const matchKey = Object.keys(dayData).find(k => k.trim().toLowerCase() === cleanTarget);
    if (matchKey && dayData[matchKey] && typeof dayData[matchKey] === "object") {
      const sets = dayData[matchKey];
      let maxWeight = 0;

      Object.keys(sets).forEach(setKey => {
        const entry = sets[setKey];
        if (!entry || typeof entry !== "object") return;
        const weight = parseFloat(entry.weight || "0");
        if (Number.isFinite(weight) && weight > maxWeight) {
          maxWeight = weight;
        }
      });

      if (maxWeight > 0) {
        processed.push({ date, maxWeight });
      }
    }
  });

  return processed;
}

function resetChartHoverState() {
  const hadHover = hoveredDotIndex !== null;
  hoveredDotIndex = null;
  if (progressChartCanvas) {
    progressChartCanvas.style.cursor = "default";
  }
  const hintEl = document.getElementById("inspectHint");
  const dataEl = document.getElementById("inspectData");
  if (hintEl && dataEl) {
    hintEl.style.display = "inline-flex";
    dataEl.style.display = "none";
  }
  const ttEl = document.getElementById("chartjs-tooltip");
  if (ttEl) ttEl.classList.remove("visible");
  if (hadHover && chartInstance) {
    chartInstance.draw();
  }
}

function renderChart(viewMode = "thisYear") {
  currentViewMode = viewMode;
  hoveredDotIndex = null;
  const existingTooltip = document.getElementById("chartjs-tooltip");
  if (existingTooltip) existingTooltip.classList.remove("visible");

  if (!historicalData.length) {
    if (progressChartCanvas) progressChartCanvas.style.display = "none";
    if (targetPanel) targetPanel.style.display = "flex";
    if (emptyState) emptyState.style.display = "block";
    currentFilteredData = [];
    renderTargetBlock();
    return;
  }

  if (progressChartCanvas) progressChartCanvas.style.display = "block";
  if (targetPanel) targetPanel.style.display = "flex";
  if (emptyState) emptyState.style.display = "none";

  let filteredData = historicalData;

  if (viewMode === "thisYear") {
    const currentYear = new Date().getFullYear();
    filteredData = historicalData.filter(item => {
      if (!item || !item.date) return false;
      const yr = /^\d{4}/.test(item.date)
        ? parseInt(item.date.slice(0, 4), 10)
        : new Date(item.date).getFullYear();
      return yr === currentYear;
    });
  }

  if (!filteredData.length) {
    if (progressChartCanvas) progressChartCanvas.style.display = "none";
    if (targetPanel) targetPanel.style.display = "flex";
    if (emptyState) {
      emptyState.style.display = "block";
      emptyState.textContent = viewMode === "thisYear"
        ? `No workout sessions recorded for ${exerciseName} this year (${new Date().getFullYear()}). Switch to 'Lifetime' or log a workout!`
        : `No historical data available for ${exerciseName} yet. Complete and save a workout to see your progress!`;
    }
    currentFilteredData = [];
    renderTargetBlock();
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  currentFilteredData = filteredData;
  renderTargetBlock();

  let labels = [];
  let fullDates = [];
  let dataPoints = [];

  if (viewMode === "thisYear") {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const dataMap = {};
    filteredData.forEach(item => {
      dataMap[item.date] = item.maxWeight;
    });

    for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      const isoD = `${y}-${m}-${dayNum}`;

      labels.push(dateStr);
      fullDates.push(`${dateStr}, ${y}`);
      dataPoints.push(dataMap[isoD] !== undefined ? dataMap[isoD] : null);
    }
  } else {
    labels = filteredData.map(item => {
      const [y, m, d] = item.date.split("-");
      const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
    fullDates = filteredData.map(item => {
      const [y, m, d] = item.date.split("-");
      const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    });
    dataPoints = filteredData.map(item => item.maxWeight);
  }

  currentLabels = labels;
  currentFullDates = fullDates;
  currentDataPoints = dataPoints;
  currentActiveIndices = [];
  for (let i = 0; i < dataPoints.length; i++) {
    if (dataPoints[i] !== null && dataPoints[i] !== undefined) {
      currentActiveIndices.push(i);
    }
  }

  // Reset live inspect badge to idle hint
  const hintEl = document.getElementById("inspectHint");
  const dataEl = document.getElementById("inspectData");
  if (hintEl && dataEl) {
    hintEl.style.display = "inline-flex";
    dataEl.style.display = "none";
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  let latestThirdSetWeight = null;
  const rawData = loadHistoricalLog();
  const cleanTarget = (exerciseName || "").trim().toLowerCase();
  const sortedDates = Object.keys(rawData).sort().reverse();
  for (let d of sortedDates) {
    const dayObj = rawData[d];
    if (!dayObj || typeof dayObj !== "object") continue;
    const matchKey = Object.keys(dayObj).find(k => k.trim().toLowerCase() === cleanTarget);
    if (matchKey && dayObj[matchKey]) {
      const sets = dayObj[matchKey];
      if (sets && sets["3"] && sets["3"].weight) {
        latestThirdSetWeight = parseFloat(sets["3"].weight);
        if (latestThirdSetWeight > 0) break;
      }
    }
  }

  const targets = loadTargets();
  const t = targets[exerciseName] ? targets[exerciseName][currentViewMode] : null;
  const currentTargetWeight = (t && t.weight) ? parseFloat(t.weight) : null;

  // Include logged data weights alongside target/reference lines so a lower target never clips dots
  const validWeights = dataPoints.filter(v => typeof v === "number" && Number.isFinite(v) && v > 0);
  const boundCandidates = [...validWeights];
  if (currentTargetWeight !== null && Number.isFinite(currentTargetWeight) && currentTargetWeight > 0) {
    boundCandidates.push(currentTargetWeight);
  }
  if (latestThirdSetWeight !== null && Number.isFinite(latestThirdSetWeight) && latestThirdSetWeight > 0) {
    boundCandidates.push(latestThirdSetWeight);
  }
  const highestRef = boundCandidates.length ? Math.max(...boundCandidates) : 0;
  const lowestRef = boundCandidates.length ? Math.min(...boundCandidates) : 0;
  const yAxisMax = highestRef > 0 ? Math.ceil(Math.max(highestRef * 1.12, highestRef + 2)) : undefined;
  const yAxisMin = lowestRef > 0 ? Math.max(0, Math.floor(Math.min(lowestRef * 0.88, lowestRef - 2))) : 0;

  const isLightTheme = document.documentElement.getAttribute("data-theme") === "light";

  const customStickersPlugin = {
    id: 'customStickers',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      const isLight = document.documentElement.getAttribute("data-theme") === "light";

      if (currentTargetWeight !== null && currentTargetWeight > 0) {
        const yPixel = yAxis.getPixelForValue(currentTargetWeight);
        if (yPixel >= yAxis.top && yPixel <= yAxis.bottom) {
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.moveTo(xAxis.left, yPixel);
          ctx.lineTo(xAxis.right, yPixel);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(77, 163, 255, 0.7)";
          ctx.stroke();

          ctx.font = "bold 13px 'Inter', sans-serif";
          ctx.fillStyle = "rgba(77, 163, 255, 0.9)";
          ctx.fillText("🎯 Target: " + currentTargetWeight + "kg", xAxis.left + 15, yPixel - 8);
          ctx.restore();
        }
      }

      if (latestThirdSetWeight !== null && latestThirdSetWeight > 0) {
        const yPixel = yAxis.getPixelForValue(latestThirdSetWeight);
        if (yPixel >= yAxis.top && yPixel <= yAxis.bottom) {
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(xAxis.left, yPixel);
          ctx.lineTo(xAxis.right, yPixel);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(245, 201, 95, 0.7)";
          ctx.stroke();

          ctx.font = "bold 13px 'Inter', sans-serif";
          ctx.fillStyle = "rgba(245, 201, 95, 0.9)";
          ctx.fillText("🏋️ Latest 3rd Set: " + latestThirdSetWeight + "kg", xAxis.left + 15, yPixel - 8);
          ctx.restore();
        }
      }

      // Draw concentric target ring & subtle guide line on hovered dot
      if (hoveredDotIndex !== null) {
        const meta = chart.getDatasetMeta(0);
        const pt = meta && meta.data ? meta.data[hoveredDotIndex] : null;
        if (pt && !pt.skip && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
          ctx.save();

          // Subtle vertical guide line
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.2)" : "rgba(255, 255, 255, 0.25)";
          ctx.lineWidth = 1;
          ctx.moveTo(pt.x, yAxis.top);
          ctx.lineTo(pt.x, yAxis.bottom);
          ctx.stroke();

          // Outer concentric ring with crisp gap around inner dot
          ctx.setLineDash([]);
          const bgFill = isLight ? "#f0f3f8" : "#0b0f16";
          const outerRingColor = isLight ? "#059669" : "#ffffff";
          const innerDotColor = isLight ? "#059669" : "#36e28a";

          ctx.fillStyle = bgFill;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = outerRingColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = innerDotColor;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    }
  };

  const ctx = progressChartCanvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(54, 226, 138, 0.4)");
  gradient.addColorStop(1, "rgba(54, 226, 138, 0.0)");

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Max Weight (kg)",
        data: dataPoints,
        borderColor: "#36e28a",
        backgroundColor: gradient,
        borderWidth: 3,
        pointBackgroundColor: isLightTheme ? "#ffffff" : "#0b0f16",
        pointBorderColor: isLightTheme ? "#059669" : "#36e28a",
        pointBorderWidth: 2.5,
        pointRadius: 6,
        fill: true,
        spanGaps: true,
        tension: 0.3
      }]
    },
    plugins: [customStickersPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      events: [], // Handled via zoom-safe direct screen-space listeners
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        x: {
          grid: {
            color: isLightTheme ? "rgba(15, 23, 42, 0.05)" : "rgba(255,255,255,0.03)",
            borderColor: isLightTheme ? "rgba(15, 23, 42, 0.08)" : "rgba(255,255,255,0.03)"
          },
          ticks: {
            color: isLightTheme ? "#64748b" : "#97a3b6",
            maxTicksLimit: 12
          }
        },
        y: {
          grid: {
            color: isLightTheme ? "rgba(15, 23, 42, 0.05)" : "rgba(255,255,255,0.03)",
            borderColor: isLightTheme ? "rgba(15, 23, 42, 0.08)" : "rgba(255,255,255,0.03)"
          },
          ticks: { color: isLightTheme ? "#64748b" : "#97a3b6" },
          beginAtZero: false,
          min: yAxisMin,
          max: yAxisMax
        }
      }
    }
  });
}

function inspectChartAtClientPos(clientX, clientY, radiusPx = 30) {
  if (!progressChartCanvas || !chartInstance) {
    resetChartHoverState();
    return;
  }

  const rect = progressChartCanvas.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    resetChartHoverState();
    return;
  }

  const meta = chartInstance.getDatasetMeta(0);
  if (!meta || !meta.data || !meta.data.length) {
    resetChartHoverState();
    return;
  }

  const logicalW = chartInstance.width || progressChartCanvas.clientWidth || rect.width;
  const logicalH = chartInstance.height || progressChartCanvas.clientHeight || rect.height;

  let nearest = null;
  let minDist = radiusPx;
  let anchorX = 0;
  let anchorY = 0;

  for (let k = 0; k < currentActiveIndices.length; k++) {
    const i = currentActiveIndices[k];
    const pt = meta.data[i];
    if (!pt || pt.skip || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;

    // Project dot's logical coordinate into viewport CSS pixels (immune to CSS zoom)
    const screenPtX = rect.left + (pt.x / logicalW) * rect.width;
    const screenPtY = rect.top + (pt.y / logicalH) * rect.height;
    const dist = Math.hypot(screenPtX - clientX, screenPtY - clientY);

    if (dist <= minDist) {
      minDist = dist;
      nearest = i;
      anchorX = screenPtX;
      anchorY = screenPtY;
    }
  }

  if (nearest === null) {
    resetChartHoverState();
    return;
  }

  const ttEl = getOrCreateChartTooltip();
  if (hoveredDotIndex === nearest && ttEl.classList.contains("visible")) {
    return;
  }

  progressChartCanvas.style.cursor = "pointer";
  if (hoveredDotIndex !== nearest) {
    hoveredDotIndex = nearest;
    chartInstance.draw();
  }

  const dateVal = currentFullDates[nearest] || currentLabels[nearest] || "";
  const weightVal = currentDataPoints[nearest];

  const hintEl = document.getElementById("inspectHint");
  const dataEl = document.getElementById("inspectData");
  const dateEl = document.getElementById("inspectDate");
  const weightEl = document.getElementById("inspectWeight");

  if (hintEl) hintEl.style.display = "none";
  if (dataEl) dataEl.style.display = "inline-flex";
  if (dateEl) dateEl.textContent = "📅 " + dateVal;
  if (weightEl) weightEl.textContent = "🏋️ " + weightVal + " kg";

  ttEl.innerHTML = `<div class="tt-grid">
    <div class="tt-label">Date</div><div class="tt-value">${safeEscape(dateVal)}</div>
    <div class="tt-label">Weight</div><div class="tt-value accent">${safeEscape(weightVal)} kg</div>
  </div>`;

  if (typeof window.positionFloatingTooltip === "function") {
    window.positionFloatingTooltip(ttEl, anchorX, anchorY, 15);
  } else {
    const ttW = ttEl.offsetWidth || 140;
    const ttH = ttEl.offsetHeight || 56;
    let left = anchorX - ttW / 2;
    let top = anchorY - ttH - 15;
    if (left < 8) left = 8;
    if (left + ttW > window.innerWidth - 8) left = window.innerWidth - ttW - 8;
    if (top < 8) top = anchorY + 18;
    ttEl.style.left = left + "px";
    ttEl.style.top = top + "px";
    ttEl.classList.add("visible");
  }
}

function attachChartInteraction() {
  if (!progressChartCanvas) return;

  let touchHideTimer = null;

  progressChartCanvas.addEventListener("mousemove", (e) => {
    inspectChartAtClientPos(e.clientX, e.clientY, 30);
  });

  progressChartCanvas.addEventListener("click", (e) => {
    inspectChartAtClientPos(e.clientX, e.clientY, 34);
  });

  progressChartCanvas.addEventListener("mouseleave", () => {
    resetChartHoverState();
  });

  progressChartCanvas.addEventListener("touchstart", (e) => {
    if (touchHideTimer) clearTimeout(touchHideTimer);
    if (e.touches && e.touches.length > 0) {
      inspectChartAtClientPos(e.touches[0].clientX, e.touches[0].clientY, 40);
    }
  }, { passive: true });

  progressChartCanvas.addEventListener("touchmove", (e) => {
    if (touchHideTimer) clearTimeout(touchHideTimer);
    if (e.touches && e.touches.length > 0) {
      inspectChartAtClientPos(e.touches[0].clientX, e.touches[0].clientY, 40);
    }
  }, { passive: true });

  progressChartCanvas.addEventListener("touchend", () => {
    touchHideTimer = setTimeout(resetChartHoverState, 2500);
  });
}

function initAnalysisPage() {
  initExerciseSelect();
  historicalData = processHistoricalData();
  renderChart("thisYear");
  attachChartInteraction();

  if (btnThisYear) {
    btnThisYear.addEventListener("click", () => {
      btnThisYear.classList.add("active");
      if (btnLifetime) btnLifetime.classList.remove("active");
      renderChart("thisYear");
    });
  }

  if (btnLifetime) {
    btnLifetime.addEventListener("click", () => {
      btnLifetime.classList.add("active");
      if (btnThisYear) btnThisYear.classList.remove("active");
      renderChart("lifetime");
    });
  }

  if (saveTargetBtn) {
    saveTargetBtn.addEventListener("click", () => {
      const w = parseFloat(targetWeightInput.value);
      const d = parseDeadline(targetDateInput.value);
      if (!w) return;

      const targets = loadTargets();
      if (!targets[exerciseName]) targets[exerciseName] = {};
      targets[exerciseName][currentViewMode] = { weight: w, deadline: d };
      saveTargets(targets);
      triggerSync();

      renderTargetBlock();
      renderChart(currentViewMode);
    });
  }

  // Re-render chart colors when theme toggles
  document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setTimeout(() => {
        if (historicalData.length) renderChart(currentViewMode);
      }, 0);
    });
  });

  // Calendar picker button
  const calendarBtn = document.getElementById("calendarPickerBtn");
  const hiddenPicker = document.getElementById("hiddenDatePicker");

  if (calendarBtn && hiddenPicker) {
    calendarBtn.addEventListener("click", () => {
      if (targetDateInput.disabled) return;
      hiddenPicker.showPicker();
    });

    hiddenPicker.addEventListener("change", () => {
      if (hiddenPicker.value) {
        targetDateInput.value = formatDeadline(hiddenPicker.value);
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnalysisPage);
} else {
  initAnalysisPage();
}
