// tools.js — Pro Athlete In-Gym Utilities
// Rest Timer, Barbell Plate Calculator, Warmup Ladder, 1RM & Strength Score Engines

// ==================== REST TIMER MODULE ====================
const DeadryxTimer = (() => {
  let timerInterval = null;
  let totalSeconds = 90;
  let remainingSeconds = 0;
  let isRunning = false;
  let isPaused = false;
  let audioCtx = null;
  let timerEl = null;

  const PRESETS = [30, 60, 90, 120, 180];
  const TIMER_PREFS_KEY = 'deadryx-timer-prefs-v1';

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(TIMER_PREFS_KEY)) || { defaultTime: 90 };
    } catch { return { defaultTime: 90 }; }
  }

  function savePrefs(prefs) {
    localStorage.setItem(TIMER_PREFS_KEY, JSON.stringify(prefs));
  }

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playBeep(frequency, duration, volume) {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio beep failed:', e);
    }
  }

  function playCountdownBeep() {
    playBeep(880, 0.12, 0.3);
  }

  function playCompletionChime() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      // 3-tone ascending chime
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.35, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.4);
      });
    } catch (e) {
      console.warn('Chime failed:', e);
    }
  }

  function vibrate(pattern) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function getProgressPercent() {
    if (totalSeconds <= 0) return 0;
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  }

  function updateDisplay() {
    if (!timerEl) return;
    const timeDisplay = timerEl.querySelector('.timer-time');
    const progressRing = timerEl.querySelector('.timer-progress-ring-fill');
    const statusText = timerEl.querySelector('.timer-status');

    if (timeDisplay) timeDisplay.textContent = formatTime(remainingSeconds);
    
    if (progressRing) {
      const circumference = 2 * Math.PI * 36; // r=36
      const offset = circumference - (getProgressPercent() / 100) * circumference;
      progressRing.style.strokeDashoffset = offset;
    }

    if (statusText) {
      if (!isRunning && !isPaused && remainingSeconds === 0) {
        statusText.textContent = 'Ready';
      } else if (isPaused) {
        statusText.textContent = 'Paused';
      } else if (isRunning) {
        statusText.textContent = 'Resting...';
      }
    }

    // Update button states
    const playBtn = timerEl.querySelector('.timer-play-btn');
    if (playBtn) {
      playBtn.innerHTML = isRunning && !isPaused
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }
  }

  function tick() {
    if (remainingSeconds <= 0) {
      complete();
      return;
    }

    remainingSeconds--;

    // Countdown beeps at 3, 2, 1
    if (remainingSeconds <= 3 && remainingSeconds > 0) {
      playCountdownBeep();
      vibrate([100]);
    }

    updateDisplay();

    if (remainingSeconds <= 0) {
      complete();
    }
  }

  function complete() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    isPaused = false;
    remainingSeconds = 0;

    playCompletionChime();
    vibrate([200, 100, 200, 100, 300]);

    // Flash the timer widget
    if (timerEl) {
      timerEl.classList.add('timer-complete-flash');
      setTimeout(() => timerEl.classList.remove('timer-complete-flash'), 1500);
    }

    updateDisplay();
  }

  function start(seconds) {
    if (timerInterval) clearInterval(timerInterval);
    
    totalSeconds = seconds || totalSeconds;
    remainingSeconds = totalSeconds;
    isRunning = true;
    isPaused = false;

    // Expand timer on start
    if (timerEl) timerEl.classList.add('expanded');

    updateDisplay();
    timerInterval = setInterval(tick, 1000);
  }

  function togglePause() {
    if (!isRunning) return;
    
    if (isPaused) {
      isPaused = false;
      timerInterval = setInterval(tick, 1000);
    } else {
      isPaused = true;
      clearInterval(timerInterval);
      timerInterval = null;
    }
    updateDisplay();
  }

  function reset() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    isPaused = false;
    remainingSeconds = 0;
    updateDisplay();
  }

  function adjustTime(delta) {
    if (isRunning && !isPaused) {
      remainingSeconds = Math.max(0, remainingSeconds + delta);
      totalSeconds = Math.max(totalSeconds, remainingSeconds);
    } else {
      totalSeconds = Math.max(5, totalSeconds + delta);
      remainingSeconds = totalSeconds;
    }
    updateDisplay();
  }

  function createTimerWidget() {
    if (document.getElementById('deadryxRestTimer')) {
      timerEl = document.getElementById('deadryxRestTimer');
      return timerEl;
    }

    const prefs = loadPrefs();
    totalSeconds = prefs.defaultTime || 90;

    const widget = document.createElement('div');
    widget.id = 'deadryxRestTimer';
    widget.className = 'rest-timer-widget';
    widget.innerHTML = `
      <div class="timer-collapsed-bar" title="Click to expand rest timer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="timer-collapsed-time">${formatTime(totalSeconds)}</span>
      </div>
      <div class="timer-expanded-panel">
        <div class="timer-ring-container">
          <svg class="timer-progress-svg" viewBox="0 0 80 80">
            <circle class="timer-progress-ring-bg" cx="40" cy="40" r="36" />
            <circle class="timer-progress-ring-fill" cx="40" cy="40" r="36" />
          </svg>
          <div class="timer-ring-inner">
            <span class="timer-time">${formatTime(totalSeconds)}</span>
            <span class="timer-status">Ready</span>
          </div>
        </div>
        <div class="timer-controls">
          <button class="timer-ctrl-btn timer-minus-btn" title="−15s">−15</button>
          <button class="timer-ctrl-btn timer-play-btn" title="Start / Pause">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="timer-ctrl-btn timer-reset-btn" title="Reset">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
          <button class="timer-ctrl-btn timer-plus-btn" title="+15s">+15</button>
        </div>
        <div class="timer-presets">
          ${PRESETS.map(p => `<button class="timer-preset-btn" data-seconds="${p}">${p < 60 ? p + 's' : (p / 60) + (p % 60 ? ':' + (p % 60).toString().padStart(2, '0') : 'm')}</button>`).join('')}
        </div>
        <button class="timer-minimize-btn" title="Minimize timer">▾</button>
      </div>
    `;

    document.body.appendChild(widget);
    timerEl = widget;

    // Event Listeners
    const collapsedBar = widget.querySelector('.timer-collapsed-bar');
    const minimizeBtn = widget.querySelector('.timer-minimize-btn');
    const playBtn = widget.querySelector('.timer-play-btn');
    const resetBtn = widget.querySelector('.timer-reset-btn');
    const minusBtn = widget.querySelector('.timer-minus-btn');
    const plusBtn = widget.querySelector('.timer-plus-btn');

    collapsedBar.addEventListener('click', () => {
      widget.classList.add('expanded');
    });

    minimizeBtn.addEventListener('click', () => {
      widget.classList.remove('expanded');
    });

    playBtn.addEventListener('click', () => {
      if (!isRunning) {
        start(totalSeconds);
      } else {
        togglePause();
      }
    });

    resetBtn.addEventListener('click', () => {
      reset();
    });

    minusBtn.addEventListener('click', () => adjustTime(-15));
    plusBtn.addEventListener('click', () => adjustTime(15));

    widget.querySelectorAll('.timer-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const seconds = parseInt(btn.dataset.seconds);
        totalSeconds = seconds;
        savePrefs({ defaultTime: seconds });
        if (!isRunning) {
          remainingSeconds = seconds;
          updateDisplay();
        }
        // Highlight active preset
        widget.querySelectorAll('.timer-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Set the default preset as active
    const defaultBtn = widget.querySelector(`.timer-preset-btn[data-seconds="${totalSeconds}"]`);
    if (defaultBtn) defaultBtn.classList.add('active');

    updateDisplay();
    return widget;
  }

  return {
    createWidget: createTimerWidget,
    start,
    reset,
    togglePause,
    adjustTime,
    get isRunning() { return isRunning; }
  };
})();


// ==================== BARBELL PLATE CALCULATOR ====================
const PlateCalculator = (() => {
  // Standard metric plate weights (kg) and their display colors
  const STANDARD_PLATES = [
    { weight: 25,    color: '#ef4444', label: '25 kg' },
    { weight: 20,    color: '#3b82f6', label: '20 kg' },
    { weight: 15,    color: '#fbbf24', label: '15 kg' },
    { weight: 10,    color: '#22c55e', label: '10 kg' },
    { weight: 5,     color: '#f8fafc', label: '5 kg', textColor: '#1e293b' },
    { weight: 2.5,   color: '#1e293b', label: '2.5 kg', textColor: '#e2e8f0', border: '#475569' },
    { weight: 1.25,  color: '#94a3b8', label: '1.25 kg', textColor: '#1e293b' }
  ];

  const BAR_WEIGHTS = [
    { label: 'Olympic Bar (20 kg)', weight: 20 },
    { label: "Women's Bar (15 kg)", weight: 15 },
    { label: 'Smith Machine (10 kg)', weight: 10 },
    { label: 'EZ Curl Bar (10 kg)', weight: 10 },
    { label: 'No Bar (0 kg)', weight: 0 }
  ];

  function calculatePlates(targetWeight, barWeight = 20) {
    let perSide = (targetWeight - barWeight) / 2;
    if (perSide < 0) return { error: `Target weight must be greater than bar weight (${barWeight} kg)`, plates: [], perSide: 0 };
    
    const plates = [];
    for (const plate of STANDARD_PLATES) {
      while (perSide >= plate.weight - 0.001) { // floating point tolerance
        plates.push(plate);
        perSide -= plate.weight;
        perSide = Math.round(perSide * 100) / 100;
      }
    }

    if (perSide > 0.01) {
      return { error: `Cannot make exact weight. ${perSide} kg per side unaccounted.`, plates, perSide };
    }

    return { error: null, plates, perSide: 0 };
  }

  function renderPlateVisual(plates) {
    if (!plates.length) return '<div class="plate-visual-empty">No plates needed — just the bar!</div>';
    
    let html = '<div class="plate-visual">';
    html += '<div class="plate-bar-end"></div>';
    html += '<div class="plate-collar"></div>';
    
    // Render plates from heaviest (closest to collar) outward
    plates.forEach(plate => {
      const h = Math.max(24, Math.min(56, plate.weight * 2.2));
      const textColor = plate.textColor || '#fff';
      const border = plate.border ? `border: 1px solid ${plate.border};` : '';
      html += `<div class="plate-disc" style="background:${plate.color}; height:${h}px; color:${textColor}; ${border}" title="${plate.label}">${plate.weight}</div>`;
    });
    
    html += '<div class="plate-sleeve-end"></div>';
    html += '</div>';
    return html;
  }

  function createModal() {
    if (document.getElementById('plateCalcModal')) return;

    const modal = document.createElement('div');
    modal.id = 'plateCalcModal';
    modal.className = 'modal-overlay tools-modal';
    modal.innerHTML = `
      <div class="modal-content tools-modal-content" style="max-width:480px;">
        <div class="tools-modal-header">
          <h3>🏋️ Plate Calculator</h3>
          <button class="close-modal-btn" id="closePlateCalcBtn">&times;</button>
        </div>
        <div class="tools-modal-body">
          <div class="tools-input-group">
            <label>Target Weight (kg)</label>
            <input type="number" id="plateTargetWeight" class="field-input" placeholder="e.g. 100" min="0" step="0.5" />
          </div>
          <div class="tools-input-group">
            <label>Bar Type</label>
            <select id="plateBarType" class="field-input">
              ${BAR_WEIGHTS.map(b => `<option value="${b.weight}" ${b.weight === 20 ? 'selected' : ''}>${b.label}</option>`).join('')}
            </select>
          </div>
          <button class="primary-btn tools-calc-btn" id="calcPlatesBtn" style="width:100%;">Calculate Plates</button>
          <div id="plateResult" class="tools-result"></div>
        </div>

        <div class="tools-divider"></div>
        <div class="tools-modal-body">
          <h4 style="margin:0 0 0.75rem; color: var(--green);">🔥 Warmup Ladder Generator</h4>
          <p class="muted-text" style="font-size:0.78rem; margin-bottom: 0.75rem;">Generates a progressive warmup ramp to your working weight.</p>
          <div class="tools-input-group">
            <label>Working Weight (kg)</label>
            <input type="number" id="warmupTargetWeight" class="field-input" placeholder="e.g. 100" min="0" step="0.5" />
          </div>
          <button class="primary-btn tools-calc-btn" id="calcWarmupBtn" style="width:100%; background: var(--accent2);">Generate Warmup</button>
          <div id="warmupResult" class="tools-result"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Listeners
    document.getElementById('closePlateCalcBtn').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

    document.getElementById('calcPlatesBtn').addEventListener('click', () => {
      const target = parseFloat(document.getElementById('plateTargetWeight').value);
      const bar = parseFloat(document.getElementById('plateBarType').value);
      const resultDiv = document.getElementById('plateResult');

      if (!target || target <= 0) {
        resultDiv.innerHTML = '<p class="tools-error">Please enter a valid target weight.</p>';
        return;
      }

      const result = calculatePlates(target, bar);
      if (result.error) {
        resultDiv.innerHTML = `<p class="tools-error">${result.error}</p>`;
        if (result.plates.length) resultDiv.innerHTML += renderPlateVisual(result.plates);
        return;
      }

      const perSideKg = (target - bar) / 2;
      resultDiv.innerHTML = `
        <div class="plate-result-summary">
          <span class="plate-result-label">Per side:</span>
          <span class="plate-result-value">${perSideKg} kg</span>
        </div>
        <div class="plate-result-summary">
          <span class="plate-result-label">Plates per side:</span>
          <span class="plate-result-value">${result.plates.map(p => p.weight + ' kg').join(' + ')}</span>
        </div>
        ${renderPlateVisual(result.plates)}
      `;
    });

    document.getElementById('calcWarmupBtn').addEventListener('click', () => {
      const working = parseFloat(document.getElementById('warmupTargetWeight').value);
      const resultDiv = document.getElementById('warmupResult');
      if (!working || working <= 0) {
        resultDiv.innerHTML = '<p class="tools-error">Please enter a valid working weight.</p>';
        return;
      }
      resultDiv.innerHTML = WarmupGenerator.generate(working);
    });
  }

  function openModal(prefillWeight) {
    createModal();
    const modal = document.getElementById('plateCalcModal');
    if (prefillWeight) {
      document.getElementById('plateTargetWeight').value = prefillWeight;
    }
    modal.classList.add('active');
  }

  return { calculatePlates, openModal, renderPlateVisual };
})();


// ==================== WARMUP LADDER GENERATOR ====================
const WarmupGenerator = (() => {
  function roundToNearest(value, step) {
    return Math.round(value / step) * step;
  }

  function generate(workingWeight, barWeight = 20) {
    if (workingWeight <= barWeight) {
      return '<p class="tools-info">Working weight is at or below bar weight — no warmup needed.</p>';
    }

    const steps = [];

    // Step 1: Empty bar × 10 (if working weight is significantly above bar)
    if (workingWeight > barWeight * 1.5) {
      steps.push({ weight: barWeight, reps: 10, label: 'Empty Bar', pct: Math.round((barWeight / workingWeight) * 100) });
    }

    // Step 2: ~50% × 5
    const w50 = roundToNearest(workingWeight * 0.5, 2.5);
    if (w50 > barWeight) {
      steps.push({ weight: w50, reps: 5, pct: 50 });
    }

    // Step 3: ~70% × 3
    const w70 = roundToNearest(workingWeight * 0.7, 2.5);
    if (w70 > (steps[steps.length - 1]?.weight || barWeight)) {
      steps.push({ weight: w70, reps: 3, pct: 70 });
    }

    // Step 4: ~85% × 2
    const w85 = roundToNearest(workingWeight * 0.85, 2.5);
    if (w85 > (steps[steps.length - 1]?.weight || barWeight) && w85 < workingWeight) {
      steps.push({ weight: w85, reps: 2, pct: 85 });
    }

    // Step 5: ~92% × 1 (potentiation single for heavy lifters)
    if (workingWeight >= 80) {
      const w92 = roundToNearest(workingWeight * 0.92, 2.5);
      if (w92 > (steps[steps.length - 1]?.weight || barWeight) && w92 < workingWeight) {
        steps.push({ weight: w92, reps: 1, pct: 92, label: 'Potentiation' });
      }
    }

    if (!steps.length) {
      return '<p class="tools-info">Working weight is too light for a structured warmup ramp.</p>';
    }

    let html = '<div class="warmup-ladder">';
    steps.forEach((step, i) => {
      const labelExtra = step.label ? ` <span class="warmup-label">(${step.label})</span>` : '';
      html += `
        <div class="warmup-step">
          <span class="warmup-step-num">${i + 1}</span>
          <div class="warmup-step-info">
            <strong>${step.weight} kg</strong> × ${step.reps} reps${labelExtra}
            <span class="warmup-pct">${step.pct}%</span>
          </div>
        </div>
      `;
    });
    html += `
      <div class="warmup-step warmup-step-working">
        <span class="warmup-step-num">🏋️</span>
        <div class="warmup-step-info">
          <strong>${workingWeight} kg</strong> — <em>Working sets!</em>
          <span class="warmup-pct">100%</span>
        </div>
      </div>
    `;
    html += '</div>';
    return html;
  }

  return { generate };
})();


// ==================== 1RM & STRENGTH SCORE ENGINE ====================
const StrengthEngine = (() => {
  // Brzycki Formula: 1RM = w / (1.0278 − 0.0278 × r)
  function brzycki1RM(weight, reps) {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (reps > 36) return weight; // formula breaks down
    return Math.round(weight / (1.0278 - 0.0278 * reps) * 10) / 10;
  }

  // Epley Formula: 1RM = w × (1 + r/30)
  function epley1RM(weight, reps) {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
  }

  // Average of both
  function estimated1RM(weight, reps) {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return Math.round(((brzycki1RM(weight, reps) + epley1RM(weight, reps)) / 2) * 10) / 10;
  }

  // DOTS Score for powerlifting (unisex simplified)
  // Coefficients for males (simplified)
  function dotsScore(bodyWeight, total, isMale = true) {
    // DOTS coefficients (male)
    const maleCoeffs = [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093];
    const femaleCoeffs = [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706];
    const coeffs = isMale ? maleCoeffs : femaleCoeffs;
    
    const bw = Math.max(40, Math.min(bodyWeight, 210));
    const denominator = coeffs[0] + coeffs[1] * bw + coeffs[2] * Math.pow(bw, 2) + coeffs[3] * Math.pow(bw, 3) + coeffs[4] * Math.pow(bw, 4);
    
    if (denominator <= 0) return 0;
    return Math.round((500 / denominator) * total * 100) / 100;
  }

  function createModal() {
    if (document.getElementById('strengthCalcModal')) return;

    const modal = document.createElement('div');
    modal.id = 'strengthCalcModal';
    modal.className = 'modal-overlay tools-modal';
    modal.innerHTML = `
      <div class="modal-content tools-modal-content" style="max-width:480px;">
        <div class="tools-modal-header">
          <h3>💪 Strength Calculator</h3>
          <button class="close-modal-btn" id="closeStrengthCalcBtn">&times;</button>
        </div>

        <div class="tools-modal-body">
          <h4 style="margin:0 0 0.75rem; color: var(--green);">Estimated 1RM</h4>
          <p class="muted-text" style="font-size:0.78rem; margin-bottom: 0.75rem;">Calculate your estimated one-rep max from any set.</p>
          <div style="display:flex; gap:0.5rem;">
            <div class="tools-input-group" style="flex:1">
              <label>Weight (kg)</label>
              <input type="number" id="e1rmWeight" class="field-input" placeholder="80" min="0" step="0.5" />
            </div>
            <div class="tools-input-group" style="flex:1">
              <label>Reps</label>
              <input type="number" id="e1rmReps" class="field-input" placeholder="8" min="1" max="36" step="1" />
            </div>
          </div>
          <button class="primary-btn tools-calc-btn" id="calcE1rmBtn" style="width:100%;">Calculate 1RM</button>
          <div id="e1rmResult" class="tools-result"></div>
        </div>

        <div class="tools-divider"></div>

        <div class="tools-modal-body">
          <h4 style="margin:0 0 0.75rem; color: var(--yellow);">Powerlifting Total & DOTS Score</h4>
          <p class="muted-text" style="font-size:0.78rem; margin-bottom: 0.75rem;">Enter your best lifts to get your Big 3 total and DOTS score.</p>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <div class="tools-input-group" style="flex:1; min-width:80px;">
              <label>Squat (kg)</label>
              <input type="number" id="dotsSquat" class="field-input" placeholder="140" min="0" step="0.5" />
            </div>
            <div class="tools-input-group" style="flex:1; min-width:80px;">
              <label>Bench (kg)</label>
              <input type="number" id="dotsBench" class="field-input" placeholder="100" min="0" step="0.5" />
            </div>
            <div class="tools-input-group" style="flex:1; min-width:80px;">
              <label>Deadlift (kg)</label>
              <input type="number" id="dotsDeadlift" class="field-input" placeholder="180" min="0" step="0.5" />
            </div>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <div class="tools-input-group" style="flex:1">
              <label>Body Weight (kg)</label>
              <input type="number" id="dotsBodyWeight" class="field-input" placeholder="80" min="30" step="0.5" />
            </div>
            <div class="tools-input-group" style="flex:1">
              <label>Gender</label>
              <select id="dotsGender" class="field-input">
                <option value="male" selected>Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <button class="primary-btn tools-calc-btn" id="calcDotsBtn" style="width:100%; background: var(--yellow); color: #0b0f16;">Calculate DOTS</button>
          <div id="dotsResult" class="tools-result"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('closeStrengthCalcBtn').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

    document.getElementById('calcE1rmBtn').addEventListener('click', () => {
      const w = parseFloat(document.getElementById('e1rmWeight').value);
      const r = parseInt(document.getElementById('e1rmReps').value);
      const resultDiv = document.getElementById('e1rmResult');

      if (!w || w <= 0 || !r || r <= 0) {
        resultDiv.innerHTML = '<p class="tools-error">Enter valid weight and reps.</p>';
        return;
      }

      const brz = brzycki1RM(w, r);
      const epl = epley1RM(w, r);
      const avg = estimated1RM(w, r);

      resultDiv.innerHTML = `
        <div class="e1rm-result-grid">
          <div class="e1rm-card e1rm-primary">
            <span class="e1rm-label">Estimated 1RM</span>
            <span class="e1rm-value">${avg} kg</span>
          </div>
          <div class="e1rm-card">
            <span class="e1rm-label">Brzycki</span>
            <span class="e1rm-value">${brz} kg</span>
          </div>
          <div class="e1rm-card">
            <span class="e1rm-label">Epley</span>
            <span class="e1rm-value">${epl} kg</span>
          </div>
        </div>
        <div class="e1rm-percentages">
          <p class="muted-text" style="font-size:0.75rem; margin:0.75rem 0 0.4rem;">Training Percentages:</p>
          <div class="e1rm-pct-grid">
            ${[95,90,85,80,75,70,65,60].map(pct => `<div class="e1rm-pct-item"><span>${pct}%</span><strong>${Math.round(avg * pct / 100 * 10) / 10} kg</strong></div>`).join('')}
          </div>
        </div>
      `;
    });

    document.getElementById('calcDotsBtn').addEventListener('click', () => {
      const sq = parseFloat(document.getElementById('dotsSquat').value) || 0;
      const bp = parseFloat(document.getElementById('dotsBench').value) || 0;
      const dl = parseFloat(document.getElementById('dotsDeadlift').value) || 0;
      const bw = parseFloat(document.getElementById('dotsBodyWeight').value);
      const gender = document.getElementById('dotsGender').value;
      const resultDiv = document.getElementById('dotsResult');

      if (!bw || bw <= 0) {
        resultDiv.innerHTML = '<p class="tools-error">Enter your body weight.</p>';
        return;
      }

      const total = sq + bp + dl;
      if (total <= 0) {
        resultDiv.innerHTML = '<p class="tools-error">Enter at least one lift.</p>';
        return;
      }

      const dots = dotsScore(bw, total, gender === 'male');

      resultDiv.innerHTML = `
        <div class="dots-result-card">
          <div class="dots-total">
            <span class="dots-label">Big 3 Total</span>
            <span class="dots-value">${total} kg</span>
          </div>
          <div class="dots-score">
            <span class="dots-label">DOTS Score</span>
            <span class="dots-value dots-highlight">${dots}</span>
          </div>
          <div class="dots-breakdown">
            <span>SQ: ${sq} kg</span>
            <span>BP: ${bp} kg</span>
            <span>DL: ${dl} kg</span>
            <span>BW: ${bw} kg</span>
          </div>
        </div>
      `;
    });
  }

  function openModal() {
    createModal();
    document.getElementById('strengthCalcModal').classList.add('active');
  }

  return { brzycki1RM, epley1RM, estimated1RM, dotsScore, openModal };
})();


// ==================== SET TYPE TAGS ====================
const SET_TYPES = [
  { key: 'N', label: 'Normal',   color: 'var(--green)',  bg: 'var(--green-soft)' },
  { key: 'W', label: 'Warmup',   color: 'var(--muted)',  bg: 'rgba(134,148,169,0.12)' },
  { key: 'D', label: 'Drop',     color: 'var(--yellow)', bg: 'rgba(251,191,36,0.12)' },
  { key: 'F', label: 'Failure',  color: 'var(--red)',    bg: 'rgba(248,113,113,0.12)' }
];

function getSetTypeByKey(key) {
  return SET_TYPES.find(t => t.key === key) || SET_TYPES[0];
}

function cycleSetType(currentKey) {
  const idx = SET_TYPES.findIndex(t => t.key === currentKey);
  return SET_TYPES[(idx + 1) % SET_TYPES.length].key;
}


// ==================== RPE / RIR UTILITIES ====================
const RPE_OPTIONS = [
  { value: '',    label: '—' },
  { value: '6',   label: 'RPE 6 (4 RIR)' },
  { value: '6.5', label: 'RPE 6.5 (3-4 RIR)' },
  { value: '7',   label: 'RPE 7 (3 RIR)' },
  { value: '7.5', label: 'RPE 7.5 (2-3 RIR)' },
  { value: '8',   label: 'RPE 8 (2 RIR)' },
  { value: '8.5', label: 'RPE 8.5 (1-2 RIR)' },
  { value: '9',   label: 'RPE 9 (1 RIR)' },
  { value: '9.5', label: 'RPE 9.5 (0-1 RIR)' },
  { value: '10',  label: 'RPE 10 (0 RIR)' }
];

function getRPESelectHTML(currentValue, dataAttrs) {
  const attrs = dataAttrs || '';
  let html = `<select class="rpe-select" ${attrs}>`;
  RPE_OPTIONS.forEach(opt => {
    const selected = opt.value === String(currentValue || '') ? 'selected' : '';
    html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
  });
  html += '</select>';
  return html;
}


// ==================== CSV EXPORT ====================
function exportHistoryToCSV() {
  const HISTORICAL_KEY = 'deadryx-historical-log-v1';
  const SPLIT_KEY = 'deadryx-split-config-v1';

  let historicalLog = {};
  let splitConfig = [];
  try {
    historicalLog = JSON.parse(localStorage.getItem(HISTORICAL_KEY)) || {};
    splitConfig = JSON.parse(localStorage.getItem(SPLIT_KEY)) || [];
  } catch { /* fallback */ }

  // Build a muscle lookup from all available exercise data
  const muscleLookup = {};
  const allExercises = typeof exerciseSource !== 'undefined' ? exerciseSource : [];
  const customs = JSON.parse(localStorage.getItem('deadryx-custom-exercises-v1') || '[]');
  [...allExercises, ...customs].forEach(ex => {
    muscleLookup[ex.name.toLowerCase()] = ex.muscle || '';
  });

  // Build day-of-week lookup from historical date
  function getDayOfWeek(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' });
  }

  const rows = [['Date', 'Day', 'Exercise', 'Muscle Group', 'Set #', 'Set Type', 'Weight (kg)', 'Reps', 'RPE', 'Est. 1RM (kg)']];

  const sortedDates = Object.keys(historicalLog).sort();
  sortedDates.forEach(date => {
    const dayExercises = historicalLog[date];
    const dayName = getDayOfWeek(date);

    Object.keys(dayExercises).forEach(exerciseName => {
      const sets = dayExercises[exerciseName];
      const muscle = muscleLookup[exerciseName.toLowerCase()] || '';
      
      Object.keys(sets).sort((a, b) => parseInt(a) - parseInt(b)).forEach(setNum => {
        const set = sets[setNum];
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps) || 0;
        const tag = set.tag || 'N';
        const rpe = set.rpe || '';
        const e1rm = (w > 0 && r > 0) ? StrengthEngine.estimated1RM(w, r) : '';

        rows.push([date, dayName, exerciseName, muscle, setNum, tag, w, r, rpe, e1rm]);
      });
    });
  });

  if (rows.length <= 1) {
    alert('No workout history found to export.');
    return;
  }

  const csvContent = rows.map(row => row.map(cell => {
    const str = String(cell);
    return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `deadryx-history-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// ==================== FAB (FLOATING ACTION BUTTONS) ====================
function createToolsFAB() {
  if (document.getElementById('toolsFAB')) return;

  const fab = document.createElement('div');
  fab.id = 'toolsFAB';
  fab.className = 'tools-fab-container';
  fab.innerHTML = `
    <div class="tools-fab-menu" id="toolsFabMenu">
      <button class="tools-fab-item" id="fabPlateCalc" title="Plate Calculator">
        <span>🏋️</span> Plates
      </button>
      <button class="tools-fab-item" id="fabStrengthCalc" title="1RM & DOTS Calculator">
        <span>💪</span> 1RM
      </button>
      <button class="tools-fab-item" id="fabCSVExport" title="Export to CSV">
        <span>📊</span> CSV
      </button>
    </div>
    <button class="tools-fab-trigger" id="toolsFabTrigger" title="Pro Tools">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    </button>
  `;
  document.body.appendChild(fab);

  const trigger = document.getElementById('toolsFabTrigger');
  const menu = document.getElementById('toolsFabMenu');

  trigger.addEventListener('click', () => {
    fab.classList.toggle('open');
  });

  // Close when clicking outside
  document.addEventListener('click', e => {
    if (!fab.contains(e.target)) {
      fab.classList.remove('open');
    }
  });

  document.getElementById('fabPlateCalc').addEventListener('click', () => {
    fab.classList.remove('open');
    PlateCalculator.openModal();
  });

  document.getElementById('fabStrengthCalc').addEventListener('click', () => {
    fab.classList.remove('open');
    StrengthEngine.openModal();
  });

  document.getElementById('fabCSVExport').addEventListener('click', () => {
    fab.classList.remove('open');
    exportHistoryToCSV();
  });
}


// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Create the floating rest timer widget
  DeadryxTimer.createWidget();

  // Create the floating action buttons for tools
  createToolsFAB();
});
