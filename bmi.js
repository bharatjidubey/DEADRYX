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

  panel.innerHTML = `
    <p class="panel-kicker">BMI Tracker</p>
    <h2 style="margin:0 0 0.6rem; font-size: 1.2rem;">Body Mass Index</h2>

    <div class="bmi-inputs">
      <div class="bmi-row">
        <label>Weight</label>
        <div class="bmi-input-group">
          <input type="number" id="bmiWeight" step="0.1" placeholder="0"
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
          <input type="number" id="bmiHeight" step="0.1" placeholder="0"
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

      <div class="bmi-row">
        <label>Age <span class="muted-text" style="font-weight:400; font-size:0.72rem;">(optional)</span></label>
        <input type="number" id="bmiAge" min="5" max="100" placeholder="e.g. 22"
          value="${profile.age || ''}" class="bmi-input" style="width:100%;">
      </div>

      <div class="bmi-row">
        <label>Target Weight (kg) <span class="muted-text" style="font-weight:400; font-size:0.72rem;">(optional)</span></label>
        <input type="number" id="bmiTargetWeight" step="0.1" placeholder="e.g. 70"
          value="${target?.weight || ''}" class="bmi-input" style="width:100%;">
      </div>

      <button class="primary-btn" id="bmiCalcBtn" style="width:100%; margin-top:0.4rem;">
        Calculate & Save
      </button>
    </div>

    <div id="bmiResult" class="bmi-result">
      ${latest ? renderBMIResult(latest, profile.age, target) : '<p class="muted-text" style="font-size:0.82rem; text-align:center; margin:0.8rem 0 0;">Enter your stats to see your BMI.</p>'}
    </div>

    ${latest ? renderNutritionBlock(latest.weightKg) : ''}

    ${history.length > 1 ? `
      <div class="bmi-graph-wrap">
        <p class="panel-kicker" style="margin:0 0 0.4rem;">Progress</p>
        <canvas id="bmiMiniChart" width="280" height="90"></canvas>
        <div class="bmi-graph-legend">
          <span><i style="background:#36e28a;"></i>BMI</span>
          <span><i style="background:#4da3ff;"></i>Weight (kg)</span>
        </div>
      </div>
    ` : ''}

    ${history.length > 0 ? `
      <button class="backup-btn danger" id="bmiClearBtn" style="width:100%; margin-top:0.6rem; font-size:0.75rem;">
        Clear BMI History
      </button>
    ` : ''}
  `;

  attachBMIHandlers();
  if (history.length > 1) drawBMIChart(history);
}

function renderBMIResult(latest, age, target) {
  const info = getSuggestions(latest.bmi, age, latest.heightM, latest.weightKg);
  const percent = Math.min(100, Math.max(0, ((latest.bmi - 15) / (35 - 15)) * 100));

  let targetHTML = "";
  if (target && target.weight) {
    const diff = +(latest.weightKg - target.weight).toFixed(1);
    const direction = diff > 0 ? "lose" : diff < 0 ? "gain" : "maintain";
    const abs = Math.abs(diff);
    targetHTML = `
      <div class="bmi-target-row">
        <span class="bmi-target-label">🎯 Target: ${target.weight} kg</span>
        <span class="bmi-target-diff ${direction}">
          ${abs === 0 ? "Reached! 🏆" : `${direction} ${abs} kg`}
        </span>
      </div>
    `;
  }

  return `
    <div class="bmi-value-card" style="border-color: ${info.category.color}44;">
      <div class="bmi-value-top">
        <div>
          <span class="bmi-big-number" style="color:${info.category.color};">${latest.bmi.toFixed(1)}</span>
          <span class="bmi-unit">BMI</span>
        </div>
        <span class="bmi-badge" style="background:${info.category.color}22; color:${info.category.color};">
          ${info.category.label}
        </span>
      </div>

      <div class="bmi-scale-bar">
        <div class="bmi-scale-marker" style="left:${percent}%;"></div>
      </div>
      <div class="bmi-scale-labels">
        <span>15</span><span>18.5</span><span>25</span><span>30</span><span>35+</span>
      </div>

      ${targetHTML}

      <p class="bmi-action">${info.actionText}</p>
      <ul class="bmi-suggestions">
        ${info.suggestions.map(s => `<li>${s}</li>`).join("")}
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
function drawBMIChart(history) {
  const canvas = document.getElementById("bmiMiniChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const pad = { t: 8, r: 8, b: 18, l: 8 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const points = history.slice(-12);
  if (points.length < 2) return;

  const bmis = points.map(p => p.bmi);
  const weights = points.map(p => p.weightKg);
  const bmiMin = Math.min(...bmis) - 1;
  const bmiMax = Math.max(...bmis) + 1;
  const wMin = Math.min(...weights) - 2;
  const wMax = Math.max(...weights) + 2;

  ctx.strokeStyle = "rgba(150,150,150,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t + plotH);
  ctx.lineTo(pad.l + plotW, pad.t + plotH);
  ctx.stroke();

  const xStep = plotW / (points.length - 1);

  // Weight line (blue)
  ctx.strokeStyle = "#4da3ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = pad.l + i * xStep;
    const y = pad.t + plotH - ((p.weightKg - wMin) / (wMax - wMin)) * plotH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // BMI line (green)
  ctx.strokeStyle = "#36e28a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = pad.l + i * xStep;
    const y = pad.t + plotH - ((p.bmi - bmiMin) / (bmiMax - bmiMin)) * plotH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots for BMI
  points.forEach((p, i) => {
    const x = pad.l + i * xStep;
    const y = pad.t + plotH - ((p.bmi - bmiMin) / (bmiMax - bmiMin)) * plotH;
    ctx.fillStyle = "#36e28a";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // X labels
  ctx.fillStyle = "rgba(150,150,150,0.7)";
  ctx.font = "10px Inter, sans-serif";
  ctx.fillText(points[0].date.slice(5), pad.l, H - 4);
  const lastLabel = points[points.length - 1].date.slice(5);
  ctx.fillText(lastLabel, W - pad.r - ctx.measureText(lastLabel).width, H - 4);
}

// ============ HANDLERS ============
function attachBMIHandlers() {
  const heightUnit = document.getElementById("bmiHeightUnit");
  const heightIn = document.getElementById("bmiHeightIn");
  const calcBtn = document.getElementById("bmiCalcBtn");
  const clearBtn = document.getElementById("bmiClearBtn");

  if (heightUnit && heightIn) {
    heightUnit.addEventListener("change", () => {
      heightIn.style.display = heightUnit.value === "ft" ? "" : "none";
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
        heightInches: heightIn, age
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