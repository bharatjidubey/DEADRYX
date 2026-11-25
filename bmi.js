// bmi.js - BMI tracking, history, suggestions, and mini-graph
const BMI_HISTORY_KEY = "deadryx-bmi-history-v1";
const BMI_PROFILE_KEY = "deadryx-bmi-profile-v1";
const BMI_TARGET_KEY = "deadryx-bmi-target-v1";


// ============ STORAGE ============
function loadBMIHistory() {
  try { return JSON.parse(localStorage.getItem(BMI_HISTORY_KEY)) || []; }
  catch { return []; }
}
function saveBMIHistory(arr) {
  localStorage.setItem(BMI_HISTORY_KEY, JSON.stringify(arr));
}
function loadBMIProfile() {
  try { return JSON.parse(localStorage.getItem(BMI_PROFILE_KEY)) || {}; }
  catch { return {}; }
}
function saveBMIProfile(p) {
  localStorage.setItem(BMI_PROFILE_KEY, JSON.stringify(p));
}
function loadBMITarget() {
  try { return JSON.parse(localStorage.getItem(BMI_TARGET_KEY)) || null; }
  catch { return null; }
}
function saveBMITarget(t) {
  localStorage.setItem(BMI_TARGET_KEY, JSON.stringify(t));
}

// ============ CONVERSIONS ============
function toKg(weight, unit) {
  const w = parseFloat(weight);
  if (!w || w <= 0) return 0;
  return unit === "lbs" ? w * 0.453592 : w;
}
function toMeters(height, unit, inches = 0) {
  const h = parseFloat(height);
  const i = parseFloat(inches) || 0;
  if (unit === "cm") return h / 100;
  if (unit === "ft") return ((h * 12) + i) * 0.0254;
  if (unit === "in") return h * 0.0254;
  return 0;
}

// ============ BMI CALC ============
function calculateBMI(weightKg, heightM) {
  if (!weightKg || !heightM) return 0;
  return weightKg / (heightM * heightM);
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: "Underweight", color: "#4da3ff", level: "under" };
  if (bmi < 25) return { label: "Healthy", color: "#36e28a", level: "healthy" };
  if (bmi < 30) return { label: "Overweight", color: "#f5c95f", level: "over" };
  return { label: "Obese", color: "#ff6b6b", level: "obese" };
}

function getHealthyWeightRange(heightM) {
  return {
    min: +(18.5 * heightM * heightM).toFixed(1),
    max: +(24.9 * heightM * heightM).toFixed(1)
  };
}

// ============ SUGGESTIONS ============
function getSuggestions(bmi, age, heightM, weightKg) {
  const range = getHealthyWeightRange(heightM);
  const cat = getBMICategory(bmi);
  const isTeen = age && age < 19;
  const suggestions = [];
  let actionText = "";

  if (cat.level === "healthy") {
    actionText = `You're in the healthy zone! Maintain ${range.min}–${range.max} kg.`;
    suggestions.push("✅ Keep up your current routine");
    suggestions.push("💧 Stay hydrated (3–4L/day)");
    suggestions.push("🏋️ Continue strength training 4–6x/week");
  } else if (cat.level === "under") {
    const need = +(range.min - weightKg).toFixed(1);
    actionText = `Gain ~${need} kg to reach healthy range (${range.min}–${range.max} kg).`;
    if (isTeen) {
      suggestions.push("🥛 Drink milk & eat protein-rich meals 4–5x/day");
      suggestions.push("🏀 Play sports — basketball, swimming, cycling help height");
      suggestions.push("😴 Sleep 8–10 hours (growth hormone peaks in deep sleep)");
      suggestions.push("🏋️ Light strength training — avoid heavy compression lifts");
    } else {
      suggestions.push("🍗 Add 300–500 extra calories daily (protein, rice, nuts)");
      suggestions.push("🏋️ Focus on compound lifts — squats, deadlifts, bench");
      suggestions.push("🥜 Snack on peanut butter, bananas, full-fat dairy");
    }
  } else if (cat.level === "over") {
    const need = +(weightKg - range.max).toFixed(1);
    actionText = `Lose ~${need} kg to reach healthy range (${range.min}–${range.max} kg).`;
    if (isTeen) {
      suggestions.push("⚽ Play active sports — football, swimming, cycling 1hr/day");
      suggestions.push("🥗 Cut sugary drinks and junk food — not calories drastically");
      suggestions.push("😴 Sleep 8–9 hours (poor sleep = weight gain)");
    } else {
      suggestions.push("🏃 Add 30 min cardio 4–5x/week");
      suggestions.push("🥗 Slight deficit — cut 300–500 cal/day, keep protein high");
      suggestions.push("💧 Drink water before meals to reduce overeating");
    }
  } else {
    const need = +(weightKg - range.max).toFixed(1);
    actionText = `Lose ~${need} kg gradually to reach healthy range (${range.min}–${range.max} kg).`;
    if (isTeen) {
      suggestions.push("👨‍⚕️ Consult a doctor/nutritionist first");
      suggestions.push("⚽ Start with fun activities — swimming, cycling 30 min/day");
      suggestions.push("🥗 Replace sugary drinks with water; smaller portions");
    } else {
      suggestions.push("👨‍⚕️ Consider consulting a doctor/dietitian");
      suggestions.push("🚶 Start with low-impact cardio — walking 45 min/day");
      suggestions.push("🥗 Aim for 500 cal/day deficit; eat whole foods");
      suggestions.push("🏋️ Add resistance training 3x/week to preserve muscle");
    }
  }

  return { actionText, suggestions, range, category: cat };
}

// ============ RENDER ============
function renderBMIPanel() {
  const panel = document.getElementById("bmiPanel");
  if (!panel) return;

  const profile = loadBMIProfile();
  const history = loadBMIHistory();
  const target = loadBMITarget();
  const latest = history[history.length - 1];

  const info = latest ? getSuggestions(latest.bmi, profile.age, latest.heightM, latest.weightKg) : null;
  const percent = info ? Math.min(100, Math.max(0, ((latest.bmi - 15) / (35 - 15)) * 100)) : 0;
  const dashArray = 2 * Math.PI * 50; // 314.16
  const dashOffset = dashArray - (dashArray * percent) / 100;
  const color = info ? info.category.color : "var(--muted)";
  const label = info ? info.category.label : "Healthy";

  // Weight, body fat, and muscle mass defaults or stored values
  const weightStr = latest ? `${(latest.weightKg * (profile.weightUnit === "lbs" ? 2.20462 : 1)).toFixed(1)} ${profile.weightUnit || "kg"}` : "--";
  const bodyFatStr = profile.bodyFat ? `${profile.bodyFat}%` : "--";
  const muscleMassStr = profile.muscleMass ? `${profile.muscleMass} kg` : "--";

  panel.innerHTML = `
    <div class="body-overview-header">
      <p class="panel-kicker">Body Overview</p>
      <div class="overview-dropdown-chip">Overview ▾</div>
    </div>

    <!-- Circular SVG Progress Gauge -->
    <div class="bmi-gauge-container">
      <div class="bmi-gauge-circle">
        <svg width="130" height="130" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" class="gauge-track" stroke="rgba(255,255,255,0.03)" stroke-width="8" fill="transparent" />
          <circle cx="60" cy="60" r="50" class="gauge-fill" stroke="${color}" stroke-width="8" fill="transparent"
            stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" stroke-linecap="round" transform="rotate(-90 60 60)" />
        </svg>
        <div class="gauge-center-text">
          <span class="bmi-large-value" style="color: ${color};">${latest ? latest.bmi.toFixed(1) : "--"}</span>
          <span class="bmi-label-sub">BMI</span>
          <span class="bmi-status-badge" style="color: ${color}; background: ${color}12;">${latest ? label : "Enter Stats"}</span>
        </div>
      </div>
    </div>

    <!-- Metrics Table -->
    <div class="body-metrics-table">
      <div class="metrics-row">
        <span class="metric-label">Weight</span>
        <span class="metric-val">${weightStr}</span>
      </div>
      <div class="metrics-row">
        <span class="metric-label">Body Fat</span>
        <span class="metric-val">${bodyFatStr}</span>
      </div>
      <div class="metrics-row">
        <span class="metric-label">Muscle Mass</span>
        <span class="metric-val">${muscleMassStr}</span>
      </div>
    </div>

    <!-- Update Button -->
    <button class="update-metrics-btn" id="updateMetricsBtn">Update Metrics</button>

    <!-- Collapsible Input Fields -->
    <div class="bmi-inputs-collapsible" id="bmiInputsCollapsible">
      <div class="bmi-inputs-inner">
        <div class="bmi-row">
          <label>Weight</label>
          <div class="bmi-input-group">
            <input type="number" id="bmiWeight" step="0.1" placeholder="Weight"
              value="${profile.weight || ''}" class="bmi-input">
            <select id="bmiWeightUnit" class="bmi-select">
              <option value="kg" ${profile.weightUnit !== "lbs" ? "selected" : ""}>kg</option>
              <option value="lbs" ${profile.weightUnit === "lbs" ? "selected" : ""}>lbs</option>
            </select>
          </div>
        </div>

        <div class="bmi-row">
          <label>Height</label>
          <div class="bmi-input-group" id="heightGroup">
            <input type="number" id="bmiHeight" step="0.1" placeholder="Height"
              value="${profile.height || ''}" class="bmi-input">
            <input type="number" id="bmiHeightIn" step="1" placeholder="in"
              value="${profile.heightInches || ''}" class="bmi-input bmi-input-in"
              style="${profile.heightUnit === 'ft' ? '' : 'display:none;'}">
            <select id="bmiHeightUnit" class="bmi-select">
              <option value="cm" ${profile.heightUnit === "cm" ? "selected" : ""}>cm</option>
              <option value="ft" ${profile.heightUnit === "ft" ? "selected" : ""}>ft+in</option>
              <option value="in" ${profile.heightUnit === "in" ? "selected" : ""}>in</option>
            </select>
          </div>
        </div>

        <div class="bmi-row-half-group">
          <div class="bmi-row">
            <label>Body Fat %</label>
            <input type="number" id="bmiBodyFat" step="0.1" placeholder="e.g. 12"
              value="${profile.bodyFat || ''}" class="bmi-input">
          </div>
          <div class="bmi-row">
            <label>Muscle Mass (kg)</label>
            <input type="number" id="bmiMuscleMass" step="0.1" placeholder="e.g. 62"
              value="${profile.muscleMass || ''}" class="bmi-input">
          </div>
        </div>

        <div class="bmi-row-half-group">
          <div class="bmi-row">
            <label>Age</label>
            <input type="number" id="bmiAge" min="5" max="100" placeholder="Age"
              value="${profile.age || ''}" class="bmi-input">
          </div>
          <div class="bmi-row">
            <label>Target (kg)</label>
            <input type="number" id="bmiTargetWeight" step="0.1" placeholder="Target"
              value="${target?.weight || ''}" class="bmi-input">
          </div>
        </div>

        <button class="primary-btn" id="bmiCalcBtn" style="width:100%; margin-top:0.6rem; border-radius: 12px; padding: 0.6rem;">
          Save Metrics
        </button>

        ${history.length > 0 ? `
          <button class="backup-btn danger" id="bmiClearBtn" style="width:100%; margin-top:0.4rem; font-size:0.75rem; border-radius: 12px; padding: 0.5rem;">
            Clear History
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Dynamic details shown at bottom of Card if latest exists -->
    ${latest ? `
      <div id="bmiResult" class="bmi-result">
        ${renderBMIResult(latest, profile.age, target)}
      </div>
      ${renderNutritionBlock(latest.weightKg)}
    ` : ''}

    ${history.length > 1 ? `
      <div class="bmi-graph-wrap" style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
        <p class="panel-kicker" style="margin:0 0 0.4rem;">Trend History</p>
        <canvas id="bmiMiniChart" width="280" height="90"></canvas>
      </div>
    ` : ''}
  `;

  attachBMIHandlers();
  if (history.length > 1) drawBMIChart(history);
}

function renderBMIResult(latest, age, target) {
  const info = getSuggestions(latest.bmi, age, latest.heightM, latest.weightKg);
  let targetHTML = "";
  if (target && target.weight) {
    const diff = +(latest.weightKg - target.weight).toFixed(1);
    const direction = diff > 0 ? "lose" : diff < 0 ? "gain" : "maintain";
    const abs = Math.abs(diff);
    targetHTML = `
      <div class="bmi-target-row" style="margin-top: 0.75rem;">
        <span class="bmi-target-label">🎯 Target: ${target.weight} kg</span>
        <span class="bmi-target-diff ${direction}">
          ${abs === 0 ? "Reached! 🏆" : `${direction} ${abs} kg`}
        </span>
      </div>
    `;
  }

  return `
    <div class="bmi-value-card" style="border: none; background: transparent; padding: 0; box-shadow: none; margin-top: 0.5rem;">
      ${targetHTML}
      <p class="bmi-action" style="margin-top: 0.5rem;">${info.actionText}</p>
      <ul class="bmi-suggestions" style="margin-top: 0.5rem;">
        ${info.suggestions.slice(0, 2).map(s => `<li>${s}</li>`).join("")}
      </ul>
    </div>
  `;
}

// ============ NUTRITION CALCULATOR ============
function renderNutritionBlock(weightKg) {
  const w = weightKg;
  const maintenance = Math.round(w * 33);
  const bulk = maintenance + 400;
  const cut = maintenance - 500;

  const protein = Math.round(w * 2);
  const fat = Math.round(w * 0.8);
  const proteinCal = protein * 4;
  const fatCal = fat * 9;

  const maintenanceCarbs = Math.max(0, Math.round((maintenance - proteinCal - fatCal) / 4));
  const bulkCarbs = Math.max(0, Math.round((bulk - proteinCal - fatCal) / 4));
  const cutCarbs = Math.max(0, Math.round((cut - proteinCal - fatCal) / 4));
  const maintenanceCarbsCal = maintenanceCarbs * 4;
  const bulkCarbsCal = bulkCarbs * 4;
  const cutCarbsCal = cutCarbs * 4;

  return `
    <div class="nutrition-block"
         data-maintain-cal="${maintenance}" data-bulk-cal="${bulk}" data-cut-cal="${cut}"
         data-protein="${protein}" data-fat="${fat}"
         data-protein-cal="${proteinCal}" data-fat-cal="${fatCal}"
         data-maintain-carbs="${maintenanceCarbs}" data-bulk-carbs="${bulkCarbs}" data-cut-carbs="${cutCarbs}"
         data-maintain-carbs-cal="${maintenanceCarbsCal}" data-bulk-carbs-cal="${bulkCarbsCal}" data-cut-carbs-cal="${cutCarbsCal}">

      <p class="panel-kicker" style="margin: 1rem 0 0.4rem;">Gym Formula</p>
      <h2 style="margin:0 0 0.15rem; font-size: 1.1rem;">Nutrition Calculator</h2>
      <p class="muted-text" style="font-size: 0.78rem; margin: 0 0 0.7rem;">For 6-day training · ${w.toFixed(1)} kg body weight</p>

      <div class="nutrition-tabs" id="nutritionTabs">
        <button class="nutrition-tab active" data-mode="maintain">Maintain</button>
        <button class="nutrition-tab" data-mode="bulk">Bulk</button>
        <button class="nutrition-tab" data-mode="cut">Cut</button>
      </div>

      <div class="nutrition-calorie-card" id="nutritionCalCard">
        <div class="calorie-main-row">
          <span class="calorie-number" id="nutritionCalNum">${maintenance}</span>
          <span class="calorie-unit">kcal / day</span>
        </div>
        <span class="calorie-label" id="nutritionCalLabel">Maintenance Calories</span>
        <span class="calorie-formula" id="nutritionCalFormula">Weight × 33</span>
      </div>

      <div class="nutrition-macros">
        <div class="macro-row">
          <div class="macro-left">
            <span class="macro-dot" style="background:#36e28a;"></span>
            <span class="macro-name">Protein</span>
          </div>
          <div class="macro-right">
            <span class="macro-value">${protein}g</span>
            <span class="macro-cal">${proteinCal} kcal</span>
          </div>
        </div>
        <div class="macro-row">
          <div class="macro-left">
            <span class="macro-dot" style="background:#f5c95f;"></span>
            <span class="macro-name">Fat</span>
          </div>
          <div class="macro-right">
            <span class="macro-value">${fat}g</span>
            <span class="macro-cal">${fatCal} kcal</span>
          </div>
        </div>
        <div class="macro-row">
          <div class="macro-left">
            <span class="macro-dot" style="background:#4da3ff;"></span>
            <span class="macro-name">Carbs</span>
          </div>
          <div class="macro-right">
            <span class="macro-value" id="nutritionCarbsG">${maintenanceCarbs}g</span>
            <span class="macro-cal" id="nutritionCarbsCal">${maintenanceCarbsCal} kcal</span>
          </div>
        </div>
        <div class="macro-row">
          <div class="macro-left">
            <span class="macro-dot" style="background:#97a3b6;"></span>
            <span class="macro-name">Fiber</span>
          </div>
          <div class="macro-right">
            <span class="macro-value">30–40g</span>
            <span class="macro-cal">—</span>
          </div>
        </div>
      </div>

      <div class="nutrition-formulas">
        <span>Protein = Weight × 2</span>
        <span>Fat = Weight × 0.8</span>
        <span>Carbs = Remaining cal ÷ 4</span>
      </div>

      <div class="nutrition-notes">
        <p class="panel-kicker" style="margin: 0 0 0.35rem;">Important Notes</p>
        <ul class="nutrition-notes-list">
          <li>1g protein = 4 kcal</li>
          <li>1g carbs = 4 kcal</li>
          <li>1g fat = 9 kcal</li>
          <li>Drink 3–4L water daily</li>
          <li>Sleep 7–8 hours</li>
          <li>Progressive overload in gym is necessary</li>
        </ul>
      </div>
    </div>
  `;
}

// ============ CHART ============
function formatBMIChartDate(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  } catch (e) {}
  return dateStr;
}

function drawBMIChart(history) {
  const canvas = document.getElementById("bmiMiniChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const pad = { t: 12, r: 12, b: 20, l: 12 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const points = history.slice(-12);
  if (points.length < 1) return;

  const bmis = points.map(p => p.bmi);
  const weights = points.map(p => p.weightKg);
  const bmiMin = Math.min(...bmis) - 1;
  const bmiMax = Math.max(...bmis) + 1;
  const wMin = Math.min(...weights) - 2;
  const wMax = Math.max(...weights) + 2;

  const xStep = points.length > 1 ? plotW / (points.length - 1) : 0;

  const dots = points.map((p, i) => {
    const x = points.length === 1 ? pad.l + plotW / 2 : pad.l + i * xStep;
    const yW = (wMax === wMin) ? pad.t + plotH / 2 : pad.t + plotH - ((p.weightKg - wMin) / (wMax - wMin)) * plotH;
    const yB = (bmiMax === bmiMin) ? pad.t + plotH / 2 : pad.t + plotH - ((p.bmi - bmiMin) / (bmiMax - bmiMin)) * plotH;
    return {
      x,
      yWeight: yW,
      yBMI: yB,
      weightKg: p.weightKg,
      bmi: p.bmi,
      date: p.date
    };
  });

  // Tooltip element setup
  let tooltipEl = document.getElementById("bmiChartTooltip");
  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.id = "bmiChartTooltip";
    tooltipEl.className = "graph-floating-tooltip";
    document.body.appendChild(tooltipEl);
  }

  let activeHoveredIdx = null;
  let cachedPadding = null;

  function getContentBox() {
    const rect = canvas.getBoundingClientRect();
    if (!cachedPadding) {
      const cs = window.getComputedStyle(canvas);
      cachedPadding = {
        padL: (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0),
        padR: (parseFloat(cs.paddingRight) || 0) + (parseFloat(cs.borderRightWidth) || 0),
        padT: (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.borderTopWidth) || 0),
        padB: (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderBottomWidth) || 0)
      };
    }
    const cssFullW = canvas.offsetWidth || rect.width;
    const cssFullH = canvas.offsetHeight || rect.height;
    const zoomRatioX = cssFullW > 0 ? rect.width / cssFullW : 1;
    const zoomRatioY = cssFullH > 0 ? rect.height / cssFullH : 1;
    const leftOffset = cachedPadding.padL * zoomRatioX;
    const rightOffset = cachedPadding.padR * zoomRatioX;
    const topOffset = cachedPadding.padT * zoomRatioY;
    const bottomOffset = cachedPadding.padB * zoomRatioY;
    return {
      left: rect.left + leftOffset,
      top: rect.top + topOffset,
      width: Math.max(1, rect.width - leftOffset - rightOffset),
      height: Math.max(1, rect.height - topOffset - bottomOffset)
    };
  }

  function showTooltip(dot, clientX, clientY) {
    const formattedDate = formatBMIChartDate(dot.date);
    tooltipEl.innerHTML = `
      <div class="tt-grid">
        <div class="tt-label">Date</div>
        <div class="tt-value">${formattedDate}</div>
        <div class="tt-label">Weight</div>
        <div class="tt-value accent">${dot.weightKg} kg</div>
        <div class="tt-label">BMI</div>
        <div class="tt-value">${dot.bmi}</div>
      </div>
    `;

    if (typeof window.positionFloatingTooltip === "function") {
      window.positionFloatingTooltip(tooltipEl, clientX, clientY, 14);
    } else {
      const ttWidth = tooltipEl.offsetWidth || 150;
      const ttHeight = tooltipEl.offsetHeight || 75;
      let left = clientX - (ttWidth / 2);
      let top = clientY - ttHeight - 14;
      if (left < 10) left = 10;
      if (left + ttWidth > window.innerWidth - 10) left = window.innerWidth - ttWidth - 10;
      if (top < 10) top = clientY + 16;
      tooltipEl.style.left = left + "px";
      tooltipEl.style.top = top + "px";
      tooltipEl.classList.add("visible");
    }
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove("visible");
  }

  function render(hoveredIdx) {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    ctx.clearRect(0, 0, W, H);

    // Baseline
    ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.12)" : "rgba(150,150,150,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + plotH);
    ctx.lineTo(pad.l + plotW, pad.t + plotH);
    ctx.stroke();

    if (points.length > 1) {
      // Weight line (blue)
      ctx.strokeStyle = "#4da3ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      dots.forEach((d, i) => {
        i === 0 ? ctx.moveTo(d.x, d.yWeight) : ctx.lineTo(d.x, d.yWeight);
      });
      ctx.stroke();

      // BMI line (green)
      ctx.strokeStyle = "#36e28a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      dots.forEach((d, i) => {
        i === 0 ? ctx.moveTo(d.x, d.yBMI) : ctx.lineTo(d.x, d.yBMI);
      });
      ctx.stroke();
    }

    // Vertical guide line for hovered dot
    if (hoveredIdx !== null && dots[hoveredIdx]) {
      const hDot = dots[hoveredIdx];
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.25)" : "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.moveTo(hDot.x, pad.t);
      ctx.lineTo(hDot.x, pad.t + plotH);
      ctx.stroke();
      ctx.restore();
    }

    // Dots for Weight (blue)
    dots.forEach((d) => {
      ctx.fillStyle = "#4da3ff";
      ctx.beginPath();
      ctx.arc(d.x, d.yWeight, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dots for BMI (green)
    dots.forEach((d) => {
      ctx.fillStyle = "#36e28a";
      ctx.beginPath();
      ctx.arc(d.x, d.yBMI, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Concentric hover target ring on the active dot (matching user reference)
    if (hoveredIdx !== null && dots[hoveredIdx]) {
      const hDot = dots[hoveredIdx];
      const gapColor = isLight ? "#f0f3f8" : "#141b25";
      const ringColorW = isLight ? "#2563eb" : "#ffffff";
      const ringColorB = isLight ? "#059669" : "#ffffff";

      // Highlight Weight dot with gap + outer concentric ring
      ctx.save();
      ctx.fillStyle = gapColor;
      ctx.beginPath();
      ctx.arc(hDot.x, hDot.yWeight, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ringColorW;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hDot.x, hDot.yWeight, 7.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#4da3ff";
      ctx.beginPath();
      ctx.arc(hDot.x, hDot.yWeight, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Highlight BMI dot with gap + outer concentric ring
      ctx.save();
      ctx.fillStyle = gapColor;
      ctx.beginPath();
      ctx.arc(hDot.x, hDot.yBMI, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ringColorB;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hDot.x, hDot.yBMI, 7.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#36e28a";
      ctx.beginPath();
      ctx.arc(hDot.x, hDot.yBMI, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // X labels
    ctx.fillStyle = isLight ? "rgba(15, 23, 42, 0.55)" : "rgba(150,150,150,0.7)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(points[0].date.slice(5), pad.l, H - 4);
    if (points.length > 1) {
      const lastLabel = points[points.length - 1].date.slice(5);
      ctx.fillText(lastLabel, W - pad.r - ctx.measureText(lastLabel).width, H - 4);
    }
  }

  // Initial draw
  render(null);

  // Mouse / Touch Interaction Handlers (screen-pixel projection so CSS zoom/padding never desyncs)
  function getNearestDotMatch(clientX, clientY, radiusPx = 26) {
    const box = getContentBox();
    let nearestIdx = null;
    let minDist = radiusPx;

    dots.forEach((dot, idx) => {
      const screenX = box.left + (dot.x / W) * box.width;
      const screenYW = box.top + (dot.yWeight / H) * box.height;
      const screenYB = box.top + (dot.yBMI / H) * box.height;
      const distW = Math.hypot(screenX - clientX, screenYW - clientY);
      const distB = Math.hypot(screenX - clientX, screenYB - clientY);
      const dist = Math.min(distW, distB);
      if (dist <= minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });

    if (nearestIdx === null) return null;
    const dot = dots[nearestIdx];
    return {
      idx: nearestIdx,
      dot,
      anchorX: box.left + (dot.x / W) * box.width,
      anchorY: box.top + (Math.min(dot.yWeight, dot.yBMI) / H) * box.height
    };
  }

  function setHoverState(match) {
    const nextIdx = match ? match.idx : null;
    if (nextIdx !== activeHoveredIdx) {
      activeHoveredIdx = nextIdx;
      canvas.style.cursor = match ? "pointer" : "default";
      render(nextIdx);
      if (match) {
        showTooltip(match.dot, match.anchorX, match.anchorY);
      } else {
        hideTooltip();
      }
    }
  }

  canvas.onmousemove = (e) => {
    setHoverState(getNearestDotMatch(e.clientX, e.clientY, 26));
  };

  canvas.onmouseleave = () => {
    setHoverState(null);
  };

  const handleTouch = (touch) => {
    const match = getNearestDotMatch(touch.clientX, touch.clientY, 36);
    if (match) setHoverState(match);
  };

  canvas.ontouchstart = (e) => {
    if (e.touches && e.touches.length > 0) {
      handleTouch(e.touches[0]);
    }
  };

  canvas.ontouchmove = (e) => {
    if (e.touches && e.touches.length > 0) {
      handleTouch(e.touches[0]);
    }
  };

  canvas.ontouchend = () => {
    setTimeout(() => {
      render(null);
      hideTooltip();
    }, 2500);
  };
}

// ============ HANDLERS ============
function attachBMIHandlers() {
  const heightUnit = document.getElementById("bmiHeightUnit");
  const heightIn = document.getElementById("bmiHeightIn");
  const calcBtn = document.getElementById("bmiCalcBtn");
  const clearBtn = document.getElementById("bmiClearBtn");
  const updateBtn = document.getElementById("updateMetricsBtn");
  const collapsible = document.getElementById("bmiInputsCollapsible");

  if (heightUnit && heightIn) {
    heightUnit.addEventListener("change", () => {
      heightIn.style.display = heightUnit.value === "ft" ? "" : "none";
    });
  }

  if (updateBtn && collapsible) {
    updateBtn.addEventListener("click", () => {
      collapsible.classList.toggle("expanded");
      updateBtn.textContent = collapsible.classList.contains("expanded") ? "Cancel Update" : "Update Metrics";
    });
  }

  if (calcBtn) {
    calcBtn.addEventListener("click", () => {
      const weight = document.getElementById("bmiWeight").value;
      const weightUnit = document.getElementById("bmiWeightUnit").value;
      const height = document.getElementById("bmiHeight").value;
      const heightIn = document.getElementById("bmiHeightIn").value;
      const heightUnitVal = document.getElementById("bmiHeightUnit").value;
      const age = document.getElementById("bmiAge").value;
      const targetWeight = document.getElementById("bmiTargetWeight").value;
      const bodyFat = document.getElementById("bmiBodyFat").value;
      const muscleMass = document.getElementById("bmiMuscleMass").value;

      if (!weight || !height) {
        alert("Please enter weight and height.");
        return;
      }

      const weightKg = toKg(weight, weightUnit);
      const heightM = toMeters(height, heightUnitVal, heightIn);

      if (!weightKg || !heightM) {
        alert("Invalid values. Please check your inputs.");
        return;
      }

      const bmi = calculateBMI(weightKg, heightM);

      saveBMIProfile({
        weight, weightUnit, height, heightUnit: heightUnitVal,
        heightInches: heightIn, age, bodyFat, muscleMass
      });

      if (targetWeight) {
        saveBMITarget({ weight: parseFloat(targetWeight) });
      }

      const history = loadBMIHistory();
      const today = new Date().toISOString().split("T")[0];
      const entry = {
        date: today,
        weightKg: +weightKg.toFixed(2),
        heightM: +heightM.toFixed(4),
        bmi: +bmi.toFixed(2)
      };

      const existing = history.findIndex(h => h.date === today);
      if (existing >= 0) history[existing] = entry;
      else history.push(entry);

      saveBMIHistory(history);
      triggerSync();
      renderBMIPanel();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Delete all BMI history? This cannot be undone.")) {
        saveBMIHistory([]);
        // Clear cached profile body fat / muscle mass
        const profile = loadBMIProfile();
        delete profile.bodyFat;
        delete profile.muscleMass;
        saveBMIProfile(profile);
        triggerSync();
        renderBMIPanel();
      }
    });
  }

  // Nutrition tab switching
  const nutritionBlock = document.querySelector('.nutrition-block');
  const nutritionTabs = document.getElementById('nutritionTabs');
  if (nutritionTabs && nutritionBlock) {
    nutritionTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.nutrition-tab');
      if (!tab) return;

      nutritionTabs.querySelectorAll('.nutrition-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const mode = tab.dataset.mode;
      const calNum = document.getElementById('nutritionCalNum');
      const calLabel = document.getElementById('nutritionCalLabel');
      const calFormula = document.getElementById('nutritionCalFormula');
      const carbsG = document.getElementById('nutritionCarbsG');
      const carbsCal = document.getElementById('nutritionCarbsCal');
      const calCard = document.getElementById('nutritionCalCard');

      if (mode === 'maintain') {
        calNum.textContent = nutritionBlock.dataset.maintainCal;
        calLabel.textContent = 'Maintenance Calories';
        calFormula.textContent = 'Weight × 33';
        carbsG.textContent = nutritionBlock.dataset.maintainCarbs + 'g';
        carbsCal.textContent = nutritionBlock.dataset.maintainCarbsCal + ' kcal';
        calCard.className = 'nutrition-calorie-card';
      } else if (mode === 'bulk') {
        calNum.textContent = nutritionBlock.dataset.bulkCal;
        calLabel.textContent = 'Bulking Calories';
        calFormula.textContent = 'Maintenance + 400';
        carbsG.textContent = nutritionBlock.dataset.bulkCarbs + 'g';
        carbsCal.textContent = nutritionBlock.dataset.bulkCarbsCal + ' kcal';
        calCard.className = 'nutrition-calorie-card bulk';
      } else {
        calNum.textContent = nutritionBlock.dataset.cutCal;
        calLabel.textContent = 'Cutting Calories';
        calFormula.textContent = 'Maintenance − 500';
        carbsG.textContent = nutritionBlock.dataset.cutCarbs + 'g';
        carbsCal.textContent = nutritionBlock.dataset.cutCarbsCal + ' kcal';
        calCard.className = 'nutrition-calorie-card cut';
      }
    });
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", renderBMIPanel);