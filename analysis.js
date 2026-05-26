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

const params = new URLSearchParams(window.location.search);
const exerciseName = params.get("exercise") || "Exercise";

exerciseTitle.textContent = `${exerciseName} Progress`;

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
  const dates = Object.keys(rawData).sort((a, b) => new Date(a) - new Date(b));

  const processed = [];

  dates.forEach(date => {
    const dayData = rawData[date];
    if (dayData[exerciseName]) {
      const sets = dayData[exerciseName];
      let maxWeight = 0;

      Object.keys(sets).forEach(setKey => {
        const weight = parseFloat(sets[setKey].weight || "0");
        if (weight > maxWeight) {
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

function renderChart(viewMode = "thisYear") {
  currentViewMode = viewMode;

  if (!historicalData.length) {
    progressChartCanvas.style.display = "none";
    targetPanel.style.display = "flex";
    emptyState.style.display = "block";
    currentFilteredData = [];
    renderTargetBlock();
    return;
  }

  progressChartCanvas.style.display = "block";
  targetPanel.style.display = "flex";
  emptyState.style.display = "none";

  let filteredData = historicalData;

  if (viewMode === "thisYear") {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00`);
    const endOfYear = new Date(`${currentYear}-12-31T23:59:59`);

    filteredData = historicalData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startOfYear && itemDate <= endOfYear;
    });
  }

  currentFilteredData = filteredData;
  renderTargetBlock();

  let labels = [];
  let dataPoints = [];

  if (viewMode === "thisYear") {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00`);
    const endOfYear = new Date(`${currentYear}-12-31T23:59:59`);

    const dataMap = {};
    filteredData.forEach(item => {
      dataMap[item.date] = item.maxWeight;
    });

    for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const locDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
      const isoD = locDate.toISOString().split("T")[0];

      labels.push(dateStr);
      dataPoints.push(dataMap[isoD] !== undefined ? dataMap[isoD] : null);
    }
  } else {
    labels = filteredData.map(item => {
      const d = new Date(item.date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
    dataPoints = filteredData.map(item => item.maxWeight);
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  let latestThirdSetWeight = null;
  const rawData = loadHistoricalLog();
  const sortedDates = Object.keys(rawData).sort((a, b) => new Date(b) - new Date(a));
  for (let d of sortedDates) {
    if (rawData[d] && rawData[d][exerciseName]) {
      const sets = rawData[d][exerciseName];
      if (sets && sets["3"] && sets["3"].weight) {
        latestThirdSetWeight = parseFloat(sets["3"].weight);
        if (latestThirdSetWeight > 0) break;
      }
    }
  }

  const targets = loadTargets();
  const t = targets[exerciseName] ? targets[exerciseName][currentViewMode] : null;
  const currentTargetWeight = (t && t.weight) ? parseFloat(t.weight) : null;

  const customStickersPlugin = {
    id: 'customStickers',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;

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
        pointBackgroundColor: "#0b0f16",
        pointBorderColor: "#36e28a",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        spanGaps: true,
        tension: 0.3
      }]
    },
    plugins: [customStickersPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#141b25",
          titleColor: "#f4f7fb",
          bodyColor: "#36e28a",
          borderColor: "rgba(255, 255, 255, 0.09)",
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: {
            color: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.03)"
          },
          ticks: {
            color: "#97a3b6",
            maxTicksLimit: 12
          }
        },
        y: {
          grid: {
            color: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.03)"
          },
          ticks: { color: "#97a3b6" },
          beginAtZero: false,
          max: currentTargetWeight ? Math.ceil(Math.max(currentTargetWeight * 1.1, (latestThirdSetWeight || 0) * 1.1)) : undefined,
          suggestedMin: undefined
        }
      }
    }
  });
}

historicalData = processHistoricalData();
renderChart("thisYear");

btnThisYear.addEventListener("click", () => {
  btnThisYear.classList.add("active");
  btnLifetime.classList.remove("active");
  renderChart("thisYear");
});

btnLifetime.addEventListener("click", () => {
  btnLifetime.classList.add("active");
  btnThisYear.classList.remove("active");
  renderChart("lifetime");
});

saveTargetBtn.addEventListener("click", () => {
  const w = parseFloat(targetWeightInput.value);
  const d = parseDeadline(targetDateInput.value);
  if (!w) return;

  const targets = loadTargets();
  if (!targets[exerciseName]) targets[exerciseName] = {};
  targets[exerciseName][currentViewMode] = { weight: w, deadline: d };
  saveTargets(targets);

  renderTargetBlock();
  renderChart(currentViewMode);
});

// Mobile Sidebar Toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const appSidebar = document.getElementById("appSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

if (mobileMenuBtn && appSidebar && sidebarOverlay) {
  function toggleSidebar() {
    appSidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("active");
  }

  mobileMenuBtn.addEventListener("click", toggleSidebar);
  sidebarOverlay.addEventListener("click", toggleSidebar);
}

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