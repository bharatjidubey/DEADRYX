const DEFAULT_WORKOUT_PLAN = [
  { day: "Monday", muscles: ["Chest", "Biceps"] },
  { day: "Tuesday", muscles: ["Shoulders", "Legs"] },
  { day: "Wednesday", muscles: ["Back", "Triceps"] },
  { day: "Thursday", muscles: ["Chest", "Biceps"] },
  { day: "Friday", muscles: ["Legs", "Abs"] },
  { day: "Saturday", muscles: ["Back", "Triceps"] },
  { day: "Sunday", muscles: ["Rest"] }
];
const SPLIT_CONFIG_KEY = "deadryx-split-config-v1";

function loadWorkoutPlan() {
  try {
    const raw = localStorage.getItem(SPLIT_CONFIG_KEY);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_WORKOUT_PLAN));
  } catch (error) {
    return JSON.parse(JSON.stringify(DEFAULT_WORKOUT_PLAN));
  }
}

function persistWorkoutPlan() {
  localStorage.setItem(SPLIT_CONFIG_KEY, JSON.stringify(workoutPlan));
}

let workoutPlan = loadWorkoutPlan();
const exerciseSource = [
  { name: "Bench Press", muscle: "Chest" },
  { name: "Incline Dumbbell Press", muscle: "Chest" },
  { name: "Barbell Curl", muscle: "Biceps" },
  { name: "Hammer Curl", muscle: "Biceps" },
  { name: "Overhead Press", muscle: "Shoulders" },
  { name: "Lateral Raise", muscle: "Shoulders" },
  { name: "Barbell Squat", muscle: "Legs" },
  { name: "Walking Lunges", muscle: "Legs" },
  { name: "Lat Pulldown", muscle: "Back" },
  { name: "Barbell Row", muscle: "Back" },
  { name: "Tricep Pushdown", muscle: "Triceps" },
  { name: "Skull Crushers", muscle: "Triceps" },
  { name: "Cable Crunch", muscle: "Abs" },
  { name: "Plank", muscle: "Abs" }
];

const STORAGE_KEY = "deadryx-workout-history-v1";
const ATTENDANCE_KEY = "deadryx-attendance-v1";
const HISTORICAL_KEY = "deadryx-historical-log-v1";
const CUSTOM_EXERCISES_KEY = "deadryx-custom-exercises-v1";
const HIDDEN_EXERCISES_KEY = "deadryx-hidden-exercises-v1";
const EXERCISE_ORDER_KEY = "deadryx-exercise-order-v1";

const calendarGrid = document.getElementById("calendarGrid");
const selectedDayTitle = document.getElementById("selectedDayTitle");
const selectedMuscles = document.getElementById("selectedMuscles");
const exerciseList = document.getElementById("exerciseList");
const saveWorkoutBtn = document.getElementById("saveWorkoutBtn");
const saveMessage = document.getElementById("saveMessage");
const todayDay = document.getElementById("todayDay");
const todayDate = document.getElementById("todayDate");
const attendanceMonths = document.getElementById("attendanceMonths");
const attendanceGrid = document.getElementById("attendanceGrid");

let selectedDayIndex = 0;
let workoutHistory = loadHistory();
let attendanceHistory = loadAttendanceHistory();
let historicalLog = loadHistoricalLog();
let customExercises = loadCustomExercises();
let hiddenExercises = loadHiddenExercises();
let exerciseOrder = loadExerciseOrder();
let isDeleteMode = false;

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) { return {}; }
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workoutHistory));
}

function loadAttendanceHistory() {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) { return {}; }
}

function persistAttendanceHistory() {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendanceHistory));
}

function loadHistoricalLog() {
  try {
    const raw = localStorage.getItem(HISTORICAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) { return {}; }
}

function persistHistoricalLog() {
  localStorage.setItem(HISTORICAL_KEY, JSON.stringify(historicalLog));
}

function loadCustomExercises() {
  try {
    const raw = localStorage.getItem(CUSTOM_EXERCISES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) { return []; }
}

function persistCustomExercises() {
  localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(customExercises));
}

function loadHiddenExercises() {
  try {
    const raw = localStorage.getItem(HIDDEN_EXERCISES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) { return []; }
}

function persistHiddenExercises() {
  localStorage.setItem(HIDDEN_EXERCISES_KEY, JSON.stringify(hiddenExercises));
}

function loadExerciseOrder() {
  try {
    const raw = localStorage.getItem(EXERCISE_ORDER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) { return {}; }
}

function persistExerciseOrder() {
  localStorage.setItem(EXERCISE_ORDER_KEY, JSON.stringify(exerciseOrder));
}

function getCurrentDayIndex() {
  const today = new Date().getDay();
  const map = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
  return map[today] ?? 0;
}

function getExercisesForDay(dayConfig) {
  const lowerHidden = hiddenExercises.map(x => x.toLowerCase());
  const targetDayLower = dayConfig.day ? dayConfig.day.toLowerCase() : "";

  // 1. Day-specific custom exercises configured for this specific day
  const dayCustoms = customExercises.filter(exercise => {
    if (lowerHidden.includes(exercise.name.toLowerCase())) return false;
    return exercise.specificDay && exercise.specificDay.toLowerCase() === targetDayLower;
  });

  // 2. Default catalog exercises: only used as a fallback if this day has NO day-specific custom exercises
  let filteredSource = [];
  if (dayCustoms.length === 0) {
    filteredSource = exerciseSource.filter((exercise) =>
      dayConfig.muscles.includes(exercise.muscle) && !lowerHidden.includes(exercise.name.toLowerCase())
    );
  }

  // 3. General custom exercises (not pinned to a specific day) matching day's muscles
  const generalCustoms = customExercises.filter(exercise => {
    if (lowerHidden.includes(exercise.name.toLowerCase())) return false;
    return !exercise.specificDay && dayConfig.muscles.includes(exercise.muscle);
  });

  // Deduplicate by name: default source -> general customs -> day-specific customs (highest precedence)
  const uniqueMap = new Map();
  filteredSource.forEach(ex => uniqueMap.set(ex.name.toLowerCase(), ex));
  generalCustoms.forEach(ex => uniqueMap.set(ex.name.toLowerCase(), ex));
  dayCustoms.forEach(ex => uniqueMap.set(ex.name.toLowerCase(), ex));

  let filtered = Array.from(uniqueMap.values());

  const dayOrder = exerciseOrder[dayConfig.day];
  if (dayOrder && dayOrder.length > 0) {
    filtered.sort((a, b) => {
      let idxA = dayOrder.indexOf(a.name.toLowerCase());
      let idxB = dayOrder.indexOf(b.name.toLowerCase());
      if (idxA === -1 && idxB === -1) {
        let orderA = dayConfig.muscles.indexOf(a.muscle);
        let orderB = dayConfig.muscles.indexOf(b.muscle);
        if (orderA === -1) orderA = 999;
        if (orderB === -1) orderB = 999;
        return orderA - orderB;
      }
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  } else {
    filtered.sort((a, b) => {
      let orderA = dayConfig.muscles.indexOf(a.muscle);
      let orderB = dayConfig.muscles.indexOf(b.muscle);
      if (orderA === -1) orderA = 999;
      if (orderB === -1) orderB = 999;
      return orderA - orderB;
    });
  }

  return filtered;
}

function renderTodayCard() {
  const now = new Date();
  if (todayDay) {
    todayDay.textContent = now.toLocaleDateString("en-US", { weekday: "long" });
  }
  if (todayDate) {
    todayDate.textContent = now.toLocaleDateString("en-US", {
      day: "numeric", month: "long", year: "numeric"
    });
  }
}

function renderSidebarSplit() {
  const list = document.getElementById("sidebarSplitList");
  if (!list) return;
  list.innerHTML = "";
  workoutPlan.forEach(config => {
    let muscleStr = config.muscles.length === 0 || config.muscles.includes("Rest") ? "Rest" : config.muscles.join(" + ");
    let shortDay = config.day.substr(0, 3);
    list.innerHTML += `<li><strong>${shortDay}</strong><span>${muscleStr}</span></li>`;
  });
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  workoutPlan.forEach((item, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `day-tile${index === selectedDayIndex ? " active" : ""}`;
    tile.innerHTML = `
      <p class="day-label">${item.day}</p>
      <p class="day-subtitle">${item.muscles.join(" + ")}</p>
    `;
    tile.addEventListener("click", () => {
      selectedDayIndex = index;
      saveMessage.textContent = "";
      renderCalendar();
      renderWorkoutDay();
    });
    calendarGrid.appendChild(tile);
  });
}

/**
 * Look up the most recent recorded lift for a specific exercise & set prior to a given date.
 * Matches exercises strictly by name (case-insensitive & trimmed) across ANY day of the week,
 * so exercises appearing on multiple days (e.g. Lat Pulldown on Tuesday & Friday) seamlessly interconnect.
 */
function getMostRecentPreviousLift(exerciseName, setNumber, beforeDateStr) {
  if (!historicalLog || !exerciseName) return null;
  const cleanTarget = exerciseName.trim().toLowerCase();

  const validDates = Object.keys(historicalLog)
    .filter(d => {
      if (beforeDateStr && d >= beforeDateStr) return false;
      const dayLog = historicalLog[d];
      if (!dayLog) return false;
      let matchingKey = dayLog[exerciseName] ? exerciseName : null;
      if (!matchingKey) {
        matchingKey = Object.keys(dayLog).find(k => k.trim().toLowerCase() === cleanTarget);
      }
      return matchingKey && dayLog[matchingKey] && dayLog[matchingKey][setNumber];
    })
    .sort()
    .reverse();

  if (validDates.length > 0) {
    const lastDate = validDates[0];
    const dayLog = historicalLog[lastDate];
    let matchingKey = dayLog[exerciseName] ? exerciseName : null;
    if (!matchingKey) {
      matchingKey = Object.keys(dayLog).find(k => k.trim().toLowerCase() === cleanTarget);
    }
    const entry = matchingKey ? dayLog[matchingKey][setNumber] : null;
    if (entry && (entry.weight !== "0" || entry.reps !== "0")) {
      const parts = lastDate.split("-");
      const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const dateLabel = dObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return {
        weight: entry.weight,
        reps: entry.reps,
        dateStamp: lastDate,
        dateLabel: dateLabel
      };
    }
  }
  return null;
}

function renderWorkoutDay() {
  const dayConfig = workoutPlan[selectedDayIndex];
  const dayExercises = getExercisesForDay(dayConfig);

  selectedDayTitle.textContent = dayConfig.day;
  selectedMuscles.textContent = dayConfig.muscles.join(" + ");

  const dayNotesBtn = document.getElementById("dayNotesBtn");
  if (dayNotesBtn) {
    dayNotesBtn.onclick = () => window.location.href = `notes.html?exercise=${encodeURIComponent(dayConfig.day + " - " + dayConfig.muscles.join(" + "))}`;
  }

  exerciseList.innerHTML = "";

  if (!dayExercises.length) {
    if (dayConfig.day === "Sunday" || dayConfig.muscles.includes("Rest")) {
      exerciseList.innerHTML = '<p class="empty-note">Enjoy your Rest Day! Take some time to recover.</p>';
    } else {
      exerciseList.innerHTML = '<p class="empty-note">No exercises found for this day.</p>';
    }
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const isTodaySelected = (dayConfig.day === todayDayName);
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  const cardFragment = document.createDocumentFragment();

  dayExercises.forEach((exercise) => {
    const card = document.createElement("article");
    card.className = "exercise-card";

    const setsCount = parseInt(exercise.sets, 10) || 3;
    let isDayLocked = !isTodaySelected;
    let minElapsedMins = 999;
    let hasLoggedToday = false;

    const rows = Array.from({ length: setsCount }, (_, index) => {
      const setNumber = index + 1;
      const logData = workoutHistory?.[dayConfig.day]?.[exercise.name]?.[setNumber];

      let displayWeight = "";
      let displayReps = "";
      let previousText = "No previous data";

      // 1. Determine Previous Data by querying historicalLog for most recent past lift
      // If today is active, query strictly before today; if inspecting another day, show most recent lift up to today
      const cutoffDate = isTodaySelected ? todayStr : null;
      const prevLift = getMostRecentPreviousLift(exercise.name, setNumber, cutoffDate);
      if (prevLift) {
        previousText = `${prevLift.weight} kg × ${prevLift.reps} reps (${prevLift.dateLabel})`;
      }

      let setDisabled = isDayLocked;

      if (logData && logData.dateStamp === todayStr) {
        hasLoggedToday = true;
        displayWeight = logData.weight === "0" ? "" : logData.weight;
        displayReps = logData.reps === "0" ? "" : logData.reps;

        if (!prevLift && (logData.prevWeight || logData.prevReps)) {
          previousText = `${logData.prevWeight || "-"} kg × ${logData.prevReps || "-"} reps`;
        }

        // 2. 10-Minute Lock Check
        const savedTime = logData.saveTimestamp || logData.timestamp;
        if (savedTime) {
          const elapsedMs = Date.now() - savedTime;
          const elapsedMins = elapsedMs / (1000 * 60);
          if (elapsedMins < minElapsedMins) minElapsedMins = elapsedMins;

          if (elapsedMins >= 10) {
            setDisabled = true; // Locked after 10 mins!
          } else {
            setDisabled = false; // Within 10 min window -> Editable!
          }
        } else {
          setDisabled = true;
        }
      }

      // Set type tag (W=Warmup, N=Normal, D=Drop, F=Failure)
      const currentTag = logData?.tag || 'N';
      const tagInfo = (typeof getSetTypeByKey === 'function') ? getSetTypeByKey(currentTag) : { key: 'N', label: 'Set' };

      // RPE value with accessible aria-label (WCAG compliance)
      const currentRPE = logData?.rpe || '';
      const rpeAriaLabel = `RPE for ${exercise.name} set ${setNumber}`;
      const rpeSelectHTML = (typeof getRPESelectHTML === 'function')
        ? getRPESelectHTML(currentRPE, `data-day="${dayConfig.day}" data-exercise="${exercise.name}" data-set="${setNumber}" ${setDisabled ? 'disabled' : ''}`, rpeAriaLabel)
        : '';

      // Live e1RM preview
      const e1rmVal = (displayWeight && displayReps && typeof StrengthEngine !== 'undefined')
        ? StrengthEngine.estimated1RM(parseFloat(displayWeight), parseInt(displayReps))
        : 0;
      const e1rmVisible = e1rmVal > 0 ? 'visible' : '';

      return `
        <div class="set-row" data-set-type="${currentTag}">
          <div class="set-badge" data-type="${currentTag}" data-day="${dayConfig.day}" data-exercise="${exercise.name}" data-set="${setNumber}" title="Click to change set type: Warmup / Normal / Drop / Failure">${tagInfo.label}&nbsp;${setNumber}</div>
          <div class="previous-display" title="Previous recorded lift">${previousText}</div>
          <div style="display:flex; align-items:center; gap:0.25rem;">
            <input
              class="field-input js-weight-input"
              type="number"
              min="0"
              step="0.5"
              placeholder="Weight"
              value="${displayWeight}"
              ${setDisabled ? "disabled" : ""}
              data-day="${dayConfig.day}"
              data-exercise="${exercise.name}"
              data-set="${setNumber}"
            />
            <button type="button" class="plate-calc-inline-btn" title="Open Plate Calculator with this weight" data-weight="${displayWeight}" ${setDisabled ? 'disabled' : ''}>🏋️</button>
          </div>
          <input
            class="field-input js-reps-input"
            type="number"
            min="0"
            step="1"
            placeholder="Reps"
            value="${displayReps}"
            ${setDisabled ? "disabled" : ""}
            data-day="${dayConfig.day}"
            data-exercise="${exercise.name}"
            data-set="${setNumber}"
          />
          ${rpeSelectHTML}
          <span class="e1rm-inline ${e1rmVisible}" data-exercise="${exercise.name}" data-set="${setNumber}">e1RM: ${e1rmVal ? e1rmVal + ' kg' : ''}</span>
        </div>
      `;
    }).join("");

    // Lock status pill
    let exerciseStatusPillHtml = "";
    if (!isTodaySelected) {
      exerciseStatusPillHtml = `<span class="lock-status-pill locked" title="Log is locked until ${dayConfig.day}">🔒 Locked (${dayConfig.day})</span>`;
    } else if (hasLoggedToday) {
      if (minElapsedMins >= 10) {
        exerciseStatusPillHtml = `<span class="lock-status-pill locked" title="Logged & locked after 10 minutes">🔒 Logged & Locked</span>`;
      } else {
        const minsLeft = Math.max(1, Math.ceil(10 - minElapsedMins));
        exerciseStatusPillHtml = `<span class="lock-status-pill editing" title="Editable for 10 minutes after saving">⏱️ Editable (${minsLeft}m left)</span>`;
      }
    } else {
      exerciseStatusPillHtml = `<span class="lock-status-pill active" title="Ready to record today's workout">💪 Ready for today</span>`;
    }

    card.innerHTML = `
      <div class="exercise-top">
        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
          <h3 class="exercise-title">${exercise.name}</h3>
          ${exerciseStatusPillHtml}
        </div>
        <div class="exercise-header-actions">
          <span class="exercise-tag">${exercise.muscle}</span>
          <div class="exercise-menu-container">
            <button type="button" class="exercise-menu-trigger" aria-label="Exercise options for ${exercise.name}" title="More options">···</button>
            <div class="exercise-dropdown-menu">
              <button type="button" class="dropdown-menu-item" onclick="window.location.href='analysis.html?exercise=${encodeURIComponent(exercise.name)}'">
                <span class="menu-item-icon">📊</span>
                <span>Analysis</span>
              </button>
              <button type="button" class="dropdown-menu-item" onclick="window.location.href='notes.html?exercise=${encodeURIComponent(exercise.name)}'">
                <span class="menu-item-icon">📝</span>
                <span>Notes</span>
              </button>
            </div>
          </div>
          <button class="delete-icon-btn" data-ex-name="${exercise.name}" title="Delete exercise">🗑️</button>
        </div>
      </div>
      <div class="sets-table">
        <div class="table-grid">
          <div class="table-head">
            <span>Set</span>
            <span>Previous Data</span>
            <span>New Weight</span>
            <span>New Reps</span>
            <span>RPE</span>
            <span>e1RM</span>
          </div>
          ${rows}
        </div>
      </div>
    `;

    cardFragment.appendChild(card);
  });

  exerciseList.appendChild(cardFragment);

  // Ensure delegated events are wired up once on exerciseList
  initExerciseListDelegation();
}

/**
 * Event delegation for exerciseList — set-badge cycling, plate calc trigger, and live e1RM
 */
function initExerciseListDelegation() {
  if (!exerciseList || exerciseList._hasDelegatedEvents) return;
  exerciseList._hasDelegatedEvents = true;

  // Delegated clicks for set badges & plate calculator buttons
  exerciseList.addEventListener("click", (e) => {
    // 1. Set type badge cycling (Warmup -> Normal -> Drop -> Failure)
    const badge = e.target.closest(".set-badge[data-type]");
    if (badge && exerciseList.contains(badge)) {
      if (badge.closest(".set-row input:disabled") || badge.closest("[disabled]")) return;
      const currentType = badge.getAttribute("data-type");
      const newType = (typeof cycleSetType === "function") ? cycleSetType(currentType) : "N";
      const newInfo = (typeof getSetTypeByKey === "function") ? getSetTypeByKey(newType) : { label: "Set" };
      badge.setAttribute("data-type", newType);
      badge.textContent = newInfo.label + "\u00A0" + (badge.dataset.set || "");
      const row = badge.closest(".set-row");
      if (row) row.setAttribute("data-set-type", newType);
      return;
    }

    // 2. Plate Calculator inline button
    const plateBtn = e.target.closest(".plate-calc-inline-btn");
    if (plateBtn && exerciseList.contains(plateBtn)) {
      const weightInput = plateBtn.closest(".set-row")?.querySelector(".js-weight-input");
      const weight = weightInput ? weightInput.value : "";
      if (typeof PlateCalculator !== "undefined") {
        PlateCalculator.openModal(weight || "");
      }
      return;
    }

    // 3. Exercise card overflow menu toggle (Consolidated actions)
    const menuTrigger = e.target.closest(".exercise-menu-trigger");
    if (menuTrigger && exerciseList.contains(menuTrigger)) {
      e.stopPropagation();
      const container = menuTrigger.closest(".exercise-menu-container");
      const dropdown = container?.querySelector(".exercise-dropdown-menu");
      const wasOpen = dropdown?.classList.contains("open");

      // Close all other open dropdowns
      document.querySelectorAll(".exercise-dropdown-menu.open").forEach(m => m.classList.remove("open"));

      if (!wasOpen && dropdown) {
        dropdown.classList.add("open");
      }
      return;
    }
  });

  // Global listener to close exercise overflow menus when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".exercise-menu-container")) {
      document.querySelectorAll(".exercise-dropdown-menu.open").forEach(m => m.classList.remove("open"));
    }
  });

  // Delegated input for live e1RM calculation
  exerciseList.addEventListener("input", (e) => {
    const input = e.target;
    if (!input.classList.contains("js-weight-input") && !input.classList.contains("js-reps-input")) return;
    const row = input.closest(".set-row");
    if (!row) return;
    const wInput = row.querySelector(".js-weight-input");
    const rInput = row.querySelector(".js-reps-input");
    const e1rmSpan = row.querySelector(".e1rm-inline");
    if (!wInput || !rInput || !e1rmSpan || typeof StrengthEngine === "undefined") return;
    const w = parseFloat(wInput.value);
    const r = parseInt(rInput.value);
    if (w > 0 && r > 0) {
      const est = StrengthEngine.estimated1RM(w, r);
      e1rmSpan.textContent = "e1RM: " + est + " kg";
      e1rmSpan.classList.add("visible");
    } else {
      e1rmSpan.textContent = "";
      e1rmSpan.classList.remove("visible");
    }
  });
}

function saveWorkout() {
  const dayConfig = workoutPlan[selectedDayIndex];
  const setRows = document.querySelectorAll(".set-row");

  // Guard: Only allow saving on today's day
  const todayDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  if (dayConfig.day !== todayDayName) {
    saveMessage.textContent = `Cannot save — today is ${todayDayName}, not ${dayConfig.day}.`;
    saveMessage.style.color = "var(--red)";
    return;
  }

  if (!workoutHistory[dayConfig.day]) {
    workoutHistory[dayConfig.day] = {};
  }

  const prsDetected = [];
  const saveTime = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  setRows.forEach((row) => {
    const weightInput = row.querySelector(".js-weight-input");
    const repsInput = row.querySelector(".js-reps-input");

    if (!weightInput || !repsInput) return;

    const exerciseName = weightInput.dataset.exercise;
    const setNumber = weightInput.dataset.set;
    const weight = weightInput.value.trim();
    const reps = repsInput.value.trim();

    // Collect set type tag from the badge
    const badge = row.querySelector('.set-badge[data-type]');
    const setTag = badge ? badge.getAttribute('data-type') : 'N';

    // Collect RPE value
    const rpeSelect = row.querySelector('.rpe-select');
    const rpeValue = rpeSelect ? rpeSelect.value : '';

    if (!exerciseName || !setNumber || (!weight && !reps)) return;

    if (!workoutHistory[dayConfig.day][exerciseName]) {
      workoutHistory[dayConfig.day][exerciseName] = {};
    }

    let currentLog = workoutHistory[dayConfig.day][exerciseName][setNumber];
    const prevLift = getMostRecentPreviousLift(exerciseName, setNumber, todayStr);
    let prevW = prevLift ? prevLift.weight : (currentLog?.prevWeight || currentLog?.weight || null);
    let prevR = prevLift ? prevLift.reps : (currentLog?.prevReps || currentLog?.reps || null);

    if (!prevLift && currentLog && currentLog.dateStamp && currentLog.dateStamp !== todayStr) {
      prevW = currentLog.weight;
      prevR = currentLog.reps;
    }

    workoutHistory[dayConfig.day][exerciseName][setNumber] = {
      dateStamp: todayStr,
      weight: weight || "0",
      reps: reps || "0",
      saveTimestamp: saveTime,
      prevWeight: prevW,
      prevReps: prevR,
      tag: setTag,
      rpe: rpeValue
    };

    if (!historicalLog[todayStr]) historicalLog[todayStr] = {};
    if (!historicalLog[todayStr][exerciseName]) historicalLog[todayStr][exerciseName] = {};
    historicalLog[todayStr][exerciseName][setNumber] = {
      weight: weight || "0",
      reps: reps || "0",
      saveTimestamp: saveTime,
      tag: setTag,
      rpe: rpeValue
    };

    // Attendance: only count genuinely new set entries (not re-saves)
    const wasNewEntry = !(currentLog && currentLog.dateStamp === todayStr);
    if (wasNewEntry) {
      if (!attendanceHistory[todayStr]) attendanceHistory[todayStr] = 0;
      attendanceHistory[todayStr] += 1;
    }

    // 🏆 PR DETECTION
    if (typeof detectAndRecordPR === "function") {
      const pr = detectAndRecordPR(exerciseName, weight, reps);
      if (pr) prsDetected.push(pr);
    }
  });

  persistHistory();
  persistHistoricalLog();
  persistAttendanceHistory();
  saveMessage.textContent = `Workout saved! Entry can be edited for 10 mins. Afterwards, it will lock until your next ${dayConfig.day} session.`;
  saveMessage.style.color = "#36e28a";
  renderWorkoutDay();

  // Celebrate best PR
  if (prsDetected.length > 0 && typeof celebratePR === "function") {
    const best = prsDetected.reduce((a, b) => (b.current.weight > a.current.weight ? b : a));
    celebratePR(best);
  }

  // Refresh stats if available
  if (typeof renderStats === "function") renderStats();

  // Auto-start rest timer after saving
  if (typeof DeadryxTimer !== 'undefined' && !DeadryxTimer.isRunning) {
    DeadryxTimer.start();
  }

  // Trigger Google Drive Cloud Sync
  triggerSync();
}

// Auto-refresh lock status countdown every 30 seconds (guarded against interrupting typing/modals)
setInterval(() => {
  if (!document.hidden) {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "SELECT" || active.tagName === "TEXTAREA")) {
      return; // Do not disrupt active input
    }
    const modalOpen = document.querySelector(".modal-overlay.active, .modal-overlay.show, .tools-modal.active");
    if (modalOpen) return;

    const todayDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    if (workoutPlan[selectedDayIndex] && workoutPlan[selectedDayIndex].day === todayDayName) {
      renderWorkoutDay();
    }
  }
}, 30000);

if (saveWorkoutBtn) {
  saveWorkoutBtn.addEventListener("click", saveWorkout);
}

// --- Searchable Exercise Database ---
const POPULAR_EXERCISES = [
  { name: "Barbell Bench Press", muscle: "Chest" },
  { name: "Incline Dumbbell Press", muscle: "Chest" },
  { name: "Cable Crossover", muscle: "Chest" },
  { name: "Push-ups", muscle: "Chest" },
  { name: "Barbell Squat", muscle: "Legs" },
  { name: "Leg Press", muscle: "Legs" },
  { name: "Romanian Deadlift", muscle: "Legs" },
  { name: "Bulgarian Split Squat", muscle: "Legs" },
  { name: "Calf Raises", muscle: "Legs" },
  { name: "Deadlift", muscle: "Back" },
  { name: "Pull-up", muscle: "Back" },
  { name: "Lat Pulldown", muscle: "Back" },
  { name: "Barbell Row", muscle: "Back" },
  { name: "Seated Cable Row", muscle: "Back" },
  { name: "Overhead Press", muscle: "Shoulders" },
  { name: "Lateral Raise", muscle: "Shoulders" },
  { name: "Front Raise", muscle: "Shoulders" },
  { name: "Face Pulls", muscle: "Shoulders" },
  { name: "Barbell Curl", muscle: "Biceps" },
  { name: "Dumbbell Curl", muscle: "Biceps" },
  { name: "Hammer Curl", muscle: "Biceps" },
  { name: "Preacher Curl", muscle: "Biceps" },
  { name: "Tricep Pushdown", muscle: "Triceps" },
  { name: "Skull Crushers", muscle: "Triceps" },
  { name: "Overhead Tricep Extension", muscle: "Triceps" },
  { name: "Cable Crunch", muscle: "Abs" },
  { name: "Hanging Leg Raise", muscle: "Abs" },
  { name: "Plank", muscle: "Abs" },
  { name: "Russian Twist", muscle: "Abs" }
];

// Redesigned Edit Log Modal Logic
const addExerciseModal = document.getElementById("addExerciseModal");
const openAddExerciseBtn = document.getElementById("openAddExerciseBtn");
const cancelAddExerciseBtn = document.getElementById("cancelAddExerciseBtn");
const confirmAddExerciseBtn = document.getElementById("confirmAddExerciseBtn");
const modalMuscleSelect = document.getElementById("modalMuscleSelect");
const modalExercisesSection = document.getElementById("modalExercisesSection");
const exerciseRowsContainer = document.getElementById("exerciseRowsContainer");

// New input references for adding new exercises in Edit Log
const modalNewExerciseName = document.getElementById("modalNewExerciseName");
const modalNewExerciseSets = document.getElementById("modalNewExerciseSets");
const modalAddNewExerciseBtn = document.getElementById("modalAddNewExerciseBtn");

// Input references for Copy Exercises feature
const modalCopySourceDay = document.getElementById("modalCopySourceDay");
const modalCopyMuscleFilter = document.getElementById("modalCopyMuscleFilter");
const modalCopyExercisesBtn = document.getElementById("modalCopyExercisesBtn");

let localExercises = []; // Holds current exercises: { name, muscle, sets, originalName }

function syncLocalExercisesInputs() {
  if (!exerciseRowsContainer) return;
  const rows = exerciseRowsContainer.querySelectorAll(".edit-log-row");
  rows.forEach(row => {
    const idx = parseInt(row.dataset.index, 10);
    const nameInput = row.querySelector(".js-modal-exercise-name");
    const setsInput = row.querySelector(".js-modal-exercise-sets");
    if (nameInput && setsInput && localExercises[idx]) {
      localExercises[idx].name = nameInput.value.trim();
      localExercises[idx].sets = parseInt(setsInput.value, 10) || 3;
    }
  });
}

function renderModalExercises() {
  if (!exerciseRowsContainer) return;
  exerciseRowsContainer.innerHTML = "";

  if (localExercises.length === 0) {
    exerciseRowsContainer.innerHTML = '<p class="empty-note" style="text-align: center; margin: 1rem 0; width: 100%;">No exercises on this day yet.</p>';
    return;
  }

  localExercises.forEach((ex, idx) => {
    const safeName = ex.name.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const row = document.createElement("div");
    row.className = "edit-log-row";
    row.dataset.index = idx;
    
    row.innerHTML = `
      <div class="sort-btn-group">
        <button type="button" class="sort-btn js-move-up" title="Move Up" ${idx === 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>▲</button>
        <button type="button" class="sort-btn js-move-down" title="Move Down" ${idx === localExercises.length - 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>▼</button>
      </div>
      <span class="modal-muscle-badge" data-muscle="${ex.muscle}">${ex.muscle}</span>
      <div class="input-group" style="flex: 3; margin: 0;">
        <input type="text" class="field-input js-modal-exercise-name" placeholder="Exercise name" list="popularExercisesDatalist" autocomplete="off" value="${safeName}" style="width: 100%;">
      </div>
      <div class="input-group" style="flex: 0.8; margin: 0; min-width: 50px;">
        <input type="number" class="field-input js-modal-exercise-sets" placeholder="Sets" min="1" max="15" value="${ex.sets || 3}" style="width: 100%; text-align: center;">
      </div>
      <button type="button" class="js-modal-remove-row-btn" aria-label="Remove exercise" style="margin-left: auto;">
        🗑️
      </button>
    `;

    // Reordering actions
    row.querySelector(".js-move-up").addEventListener("click", () => {
      if (idx > 0) {
        syncLocalExercisesInputs();
        const temp = localExercises[idx];
        localExercises[idx] = localExercises[idx - 1];
        localExercises[idx - 1] = temp;
        renderModalExercises();
      }
    });

    row.querySelector(".js-move-down").addEventListener("click", () => {
      if (idx < localExercises.length - 1) {
        syncLocalExercisesInputs();
        const temp = localExercises[idx];
        localExercises[idx] = localExercises[idx + 1];
        localExercises[idx + 1] = temp;
        renderModalExercises();
      }
    });

    // Remove action
    row.querySelector(".js-modal-remove-row-btn").addEventListener("click", () => {
      syncLocalExercisesInputs();
      localExercises.splice(idx, 1);
      renderModalExercises();
    });

    exerciseRowsContainer.appendChild(row);
  });
}

function updateDatalistOptions(selectedMuscle) {
  const datalist = document.getElementById("popularExercisesDatalist");
  if (!datalist) return;
  datalist.innerHTML = "";
  
  const filtered = POPULAR_EXERCISES.filter(ex => ex.muscle.toLowerCase() === selectedMuscle.toLowerCase());
  filtered.forEach(ex => {
    const opt = document.createElement("option");
    opt.value = ex.name;
    datalist.appendChild(opt);
  });
}

if (modalMuscleSelect) {
  modalMuscleSelect.addEventListener("change", (e) => {
    const muscle = e.target.value;
    if (muscle) {
      updateDatalistOptions(muscle);
    }
  });
}

if (modalAddNewExerciseBtn) {
  modalAddNewExerciseBtn.addEventListener("click", () => {
    const muscle = modalMuscleSelect ? modalMuscleSelect.value : "";
    const name = modalNewExerciseName ? modalNewExerciseName.value.trim() : "";
    const sets = modalNewExerciseSets ? parseInt(modalNewExerciseSets.value, 10) : 3;

    if (!muscle) {
      alert("Please select a muscle group.");
      return;
    }
    if (!name) {
      alert("Please enter an exercise name.");
      return;
    }

    syncLocalExercisesInputs();

    localExercises.push({
      name: name,
      muscle: muscle,
      sets: sets || 3,
      originalName: ""
    });

    if (modalNewExerciseName) modalNewExerciseName.value = "";
    if (modalNewExerciseSets) modalNewExerciseSets.value = "3";
    if (modalMuscleSelect) modalMuscleSelect.selectedIndex = 0;

    renderModalExercises();
  });
}

if (openAddExerciseBtn && addExerciseModal) {
  openAddExerciseBtn.addEventListener("click", () => {
    const dayConfig = workoutPlan[selectedDayIndex];
    if (dayConfig.day === "Sunday" || dayConfig.muscles.includes("Rest")) {
      alert("Cannot edit exercises on a Rest day. Select another day.");
      return;
    }

    // Dynamic Title
    const titleEl = document.getElementById("modalEditLogTitle");
    if (titleEl) {
      titleEl.textContent = `Edit Log - ${dayConfig.day}`;
    }

    // Reset inputs
    if (modalMuscleSelect) modalMuscleSelect.selectedIndex = 0;
    if (modalNewExerciseName) modalNewExerciseName.value = "";
    if (modalNewExerciseSets) modalNewExerciseSets.value = "3";

    // Load day exercises
    const dayExercises = getExercisesForDay(dayConfig);
    localExercises = dayExercises.map(ex => ({
      name: ex.name,
      muscle: ex.muscle,
      sets: parseInt(ex.sets, 10) || 3,
      originalName: ex.name
    }));

    renderModalExercises();

    // Populate copy source days (excluding current day and rest days)
    if (modalCopySourceDay) {
      modalCopySourceDay.innerHTML = '<option value="" disabled selected>-- Select Day --</option>';
      workoutPlan.forEach(plan => {
        if (plan.day !== dayConfig.day && !plan.muscles.includes("Rest")) {
          const muscleStr = plan.muscles.join(" + ");
          const opt = document.createElement("option");
          opt.value = plan.day;
          opt.textContent = `${plan.day} (${muscleStr})`;
          modalCopySourceDay.appendChild(opt);
        }
      });
    }
    if (modalCopyMuscleFilter) {
      modalCopyMuscleFilter.innerHTML = '<option value="ALL" selected>All Muscles</option>';
    }
    
    addExerciseModal.classList.add("active");
  });

  // Dynamic Muscle filtering when a source day is selected
  if (modalCopySourceDay) {
    modalCopySourceDay.addEventListener("change", (e) => {
      const sourceDay = e.target.value;
      if (modalCopyMuscleFilter) {
        modalCopyMuscleFilter.innerHTML = '<option value="ALL" selected>All Muscles</option>';
        
        const sourcePlan = workoutPlan.find(p => p.day === sourceDay);
        if (sourcePlan && sourcePlan.muscles) {
          sourcePlan.muscles.forEach(muscle => {
            if (muscle !== "Rest") {
              const opt = document.createElement("option");
              opt.value = muscle;
              opt.textContent = `${muscle} only`;
              modalCopyMuscleFilter.appendChild(opt);
            }
          });
        }
      }
    });
  }

  // Copy exercises click event
  if (modalCopyExercisesBtn) {
    modalCopyExercisesBtn.addEventListener("click", () => {
      const sourceDay = modalCopySourceDay ? modalCopySourceDay.value : "";
      const muscleFilter = modalCopyMuscleFilter ? modalCopyMuscleFilter.value : "ALL";

      if (!sourceDay) {
        alert("Please select a training day to copy from.");
        return;
      }

      const sourcePlan = workoutPlan.find(p => p.day === sourceDay);
      if (!sourcePlan) return;

      const sourceExercises = getExercisesForDay(sourcePlan);
      if (sourceExercises.length === 0) {
        alert(`No exercises found on ${sourceDay} to copy.`);
        return;
      }

      syncLocalExercisesInputs();

      let copyCount = 0;
      const existingNamesLower = localExercises.map(ex => ex.name.toLowerCase());

      sourceExercises.forEach(ex => {
        // Apply muscle filter if specified
        if (muscleFilter !== "ALL" && ex.muscle.toLowerCase() !== muscleFilter.toLowerCase()) {
          return;
        }

        // Avoid adding duplicate exercises
        if (!existingNamesLower.includes(ex.name.toLowerCase())) {
          localExercises.push({
            name: ex.name,
            muscle: ex.muscle,
            sets: parseInt(ex.sets, 10) || 3,
            originalName: "" // Newly copied, treat as new for this day
          });
          copyCount++;
        }
      });

      if (copyCount > 0) {
        renderModalExercises();
        alert(`Successfully copied ${copyCount} exercise(s) from ${sourceDay}!`);
      } else {
        alert(`No new exercises were copied (they might already be in your active log).`);
      }
    });
  }

  cancelAddExerciseBtn.addEventListener("click", () => {
    addExerciseModal.classList.remove("active");
  });

  confirmAddExerciseBtn.addEventListener("click", () => {
    syncLocalExercisesInputs();

    // Validation
    const hasEmpty = localExercises.some(ex => !ex.name);
    if (hasEmpty) {
      alert("Please ensure all exercise names are filled in.");
      return;
    }

    const targetDay = workoutPlan[selectedDayIndex].day;

    // 1. Detect Deleted Exercises
    const initialExercises = getExercisesForDay(workoutPlan[selectedDayIndex]);
    const finalNamesLower = localExercises.map(ex => ex.name.toLowerCase());

    initialExercises.forEach(initEx => {
      if (!finalNamesLower.includes(initEx.name.toLowerCase())) {
        const isDefault = exerciseSource.some(dEx => dEx.name.toLowerCase() === initEx.name.toLowerCase());
        if (isDefault) {
          // Default exercises hide globally (same muscle group on all days)
          if (!hiddenExercises.includes(initEx.name)) {
            hiddenExercises.push(initEx.name);
          }
        } else {
          // Custom exercises: only remove the entry that belongs to THIS day.
          // An entry belongs to this day if it has specificDay === targetDay,
          // OR if it has no specificDay (muscle-matched legacy entry).
          // Never delete a custom entry that belongs to a different specific day.
          customExercises = customExercises.filter(cEx => {
            if (cEx.name.toLowerCase() !== initEx.name.toLowerCase()) return true; // keep — different exercise
            if (cEx.specificDay && cEx.specificDay !== targetDay) return true;      // keep — belongs to another day
            return false;                                                            // remove — belongs to this day
          });
        }
      }
    });

    // 2. Process Renamed and Updated Exercises
    localExercises.forEach(ex => {
      // Unhide if it was hidden
      hiddenExercises = hiddenExercises.filter(x => x.toLowerCase() !== ex.name.toLowerCase());

      const A = ex.originalName;
      const B = ex.name;

      if (A && A.toLowerCase() !== B.toLowerCase()) {
        // Exercise was RENAMED!
        // A. Custom Exercises list
        const isDefault = exerciseSource.some(dEx => dEx.name.toLowerCase() === A.toLowerCase());
        if (isDefault) {
          // Hide old default
          if (!hiddenExercises.includes(A)) {
            hiddenExercises.push(A);
          }
          // Register new as custom exercise
          customExercises.push({
            name: B,
            muscle: ex.muscle,
            specificDay: targetDay,
            sets: ex.sets
          });
        } else {
          // Update custom exercise name and sets for this specific day
          const idx = customExercises.findIndex(cEx => 
            cEx.name.toLowerCase() === A.toLowerCase() &&
            (!cEx.specificDay || cEx.specificDay.toLowerCase() === targetDay.toLowerCase())
          );
          if (idx !== -1) {
            customExercises[idx].name = B;
            customExercises[idx].sets = ex.sets;
            // specificDay is intentionally NOT changed — the exercise stays on its original day
          }
        }

        // B. Workout History Keys migration
        for (const day in workoutHistory) {
          if (workoutHistory[day][A]) {
            workoutHistory[day][B] = workoutHistory[day][A];
            delete workoutHistory[day][A];
          }
        }

        // C. Historical Log Keys migration
        for (const date in historicalLog) {
          if (historicalLog[date][A]) {
            historicalLog[date][B] = historicalLog[date][A];
            delete historicalLog[date][A];
          }
        }

        // D. PR Records Migration
        if (typeof loadPRRecords === 'function' && typeof savePRRecords === 'function') {
          const prs = loadPRRecords();
          if (prs[A]) {
            prs[B] = prs[A];
            delete prs[A];
            savePRRecords(prs);
          }
        }

        // E. Notes Migration
        try {
          const rawNotes = localStorage.getItem("deadryx-notes-v1");
          if (rawNotes) {
            const notes = JSON.parse(rawNotes);
            if (notes[A]) {
              notes[B] = notes[A];
              delete notes[A];
              localStorage.setItem("deadryx-notes-v1", JSON.stringify(notes));
            }
          }
        } catch (err) {
          console.error("Notes migration error:", err);
        }

        // F. Targets Migration
        try {
          const rawTargets = localStorage.getItem("deadryx-targets-v1");
          if (rawTargets) {
            const targets = JSON.parse(rawTargets);
            if (targets[A]) {
              targets[B] = targets[A];
              delete targets[A];
              localStorage.setItem("deadryx-targets-v1", JSON.stringify(targets));
            }
          }
        } catch (err) {
          console.error("Targets migration error:", err);
        }

        // G. Exercise Order configurations migration
        for (const day in exerciseOrder) {
          const list = exerciseOrder[day];
          if (Array.isArray(list)) {
            const index = list.indexOf(A.toLowerCase());
            if (index !== -1) {
              list[index] = B.toLowerCase();
            }
          }
        }
      } else {
        // Exercise was NOT renamed, but maybe sets changed or it is NEW
        if (!A) {
          // BRAND NEW exercise
          customExercises.push({
            name: B,
            muscle: ex.muscle,
            specificDay: targetDay,
            sets: ex.sets
          });
        } else {
          // Check sets updates for existing entry on THIS specific day
          const cIdx = customExercises.findIndex(cEx => 
            cEx.name.toLowerCase() === B.toLowerCase() &&
            (!cEx.specificDay || cEx.specificDay.toLowerCase() === targetDay.toLowerCase())
          );
          if (cIdx !== -1) {
            customExercises[cIdx].sets = ex.sets;
          } else {
            // New day-specific custom exercise entry for this day (allows same exercise on multiple days)
            customExercises.push({
              name: B,
              muscle: ex.muscle,
              specificDay: targetDay,
              sets: ex.sets
            });
          }
        }
      }
    });

    // 3. Save Custom Exercises sorting order for the day
    exerciseOrder[targetDay] = localExercises.map(ex => ex.name.toLowerCase());

    // 4. Persist and Sync
    persistHiddenExercises();
    persistCustomExercises();
    persistHistory();
    persistHistoricalLog();
    persistExerciseOrder();
    
    triggerSync();

    addExerciseModal.classList.remove("active");
    saveMessage.textContent = "Log structure saved successfully!";
    saveMessage.style.color = "var(--green)";
    renderWorkoutDay();
  });
}

// Edit Split Modal Logic
const editSplitModal = document.getElementById("editSplitModal");
const openEditSplitBtn = document.getElementById("openEditSplitBtn");
const cancelEditSplitBtn = document.getElementById("cancelEditSplitBtn");
const confirmEditSplitBtn = document.getElementById("confirmEditSplitBtn");
const editSplitDays = document.getElementById("editSplitDays");

if (openEditSplitBtn && editSplitModal) {
  openEditSplitBtn.addEventListener("click", () => {
    editSplitDays.innerHTML = "";
    const allMuscles = ["Chest", "Biceps", "Shoulders", "Legs", "Back", "Triceps", "Abs"];

    workoutPlan.forEach((config, index) => {
      let checkboxesHTML = allMuscles.map(m => {
        const isChecked = config.muscles.includes(m) ? "checked" : "";
        return `
          <label class="muscle-chip-label">
            <input type="checkbox" value="${m}" data-day="${index}" ${isChecked}>
            <span>${m}</span>
          </label>
        `;
      }).join('');

      editSplitDays.innerHTML += `
        <div class="split-day-row" data-day-index="${index}">
          <strong>${config.day}</strong>
          <div class="muscle-checkboxes" style="margin-top: 0;">
            ${checkboxesHTML}
          </div>
        </div>
      `;
    });

    editSplitModal.classList.add("active");
  });

  cancelEditSplitBtn.addEventListener("click", () => {
    editSplitModal.classList.remove("active");
  });

  confirmEditSplitBtn.addEventListener("click", () => {
    const containerRows = editSplitDays.querySelectorAll(".split-day-row");
    let newPlan = [];

    containerRows.forEach(row => {
      const idx = row.getAttribute("data-day-index");
      const dayName = workoutPlan[idx].day;
      const checkedBoxes = Array.from(row.querySelectorAll("input:checked")).map(cb => cb.value);

      newPlan.push({
        day: dayName,
        muscles: checkedBoxes.length > 0 ? checkedBoxes : ["Rest"]
      });
    });

    workoutPlan = newPlan;
    persistWorkoutPlan();
    triggerSync();

    editSplitModal.classList.remove("active");
    saveMessage.textContent = "Your weekly split has been updated!";
    saveMessage.style.color = "var(--green)";

    renderSidebarSplit();
    renderCalendar();
    renderWorkoutDay();
  });
}

selectedDayIndex = getCurrentDayIndex();
renderSidebarSplit();
renderTodayCard();
renderCalendar();
renderWorkoutDay();
renderAttendance();

function renderAttendance() {
  if (!attendanceMonths || !attendanceGrid) return;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  attendanceMonths.innerHTML = months.map(m => `<span>${m}</span>`).join("");
  attendanceGrid.innerHTML = "";

  const year = new Date().getFullYear();
  const startDate = new Date(year, 0, 1); // Jan 1
  const endDate = new Date(year, 11, 31); // Dec 31
  const totalDays = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;

  const gridFragment = document.createDocumentFragment();

  // Add empty cells to align Jan 1 to the correct day-of-week row
  const startDayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon, ...
  for (let i = 0; i < startDayOfWeek; i++) {
    const empty = document.createElement("div");
    empty.className = "attendance-cell";
    empty.style.visibility = "hidden";
    gridFragment.appendChild(empty);
  }

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(year, 0, 1 + i);
    const locDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const dateStr = locDate.toISOString().split("T")[0];

    const activity = attendanceHistory[dateStr] || 0;
    const cell = document.createElement("div");
    cell.className = "attendance-cell";
    if (activity >= 6) {
      cell.classList.add("level-3");
    } else if (activity >= 3) {
      cell.classList.add("level-2");
    } else if (activity >= 1) {
      cell.classList.add("level-1");
    }

    const formattedDate = locDate.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).replace(" ", " - ");
    cell.dataset.date = formattedDate;
    cell.dataset.activity = activity;
    gridFragment.appendChild(cell);
  }

  attendanceGrid.appendChild(gridFragment);

  requestAnimationFrame(() => {
    const wrapper = document.getElementById("attendanceScrollWrapper");
    if (wrapper) wrapper.scrollLeft = wrapper.scrollWidth;
  });
}

// Tooltip Logic
let coolTooltip = document.getElementById("coolTooltip");
let tooltipTimeout;
let isTooltipLocked = false;

if (!coolTooltip) {
  coolTooltip = document.createElement("div");
  coolTooltip.id = "coolTooltip";
  coolTooltip.className = "cool-tooltip";
  coolTooltip.innerHTML = `<span class="tt-date"></span><span class="tt-details"></span>`;
  document.body.appendChild(coolTooltip);
}

function showTooltip(e, cell) {
  const dateStr = cell.dataset.date;
  const activity = cell.dataset.activity;

  coolTooltip.querySelector(".tt-date").textContent = dateStr;
  coolTooltip.querySelector(".tt-details").textContent = `${activity} exercises`;

  const rect = cell.getBoundingClientRect();
  const ttWidth = 110;
  coolTooltip.style.left = `${rect.left + window.scrollX - (ttWidth / 2) + (rect.width / 2)}px`;
  coolTooltip.style.top = `${rect.top + window.scrollY - 65}px`;
  coolTooltip.classList.add("visible");
}

function hideTooltip() {
  if (isTooltipLocked) return;
  coolTooltip.classList.remove("visible");
}

if (attendanceGrid) {
  attendanceGrid.addEventListener("mouseover", (e) => {
    if (e.target.classList.contains("attendance-cell")) {
      showTooltip(e, e.target);
    }
  });
  attendanceGrid.addEventListener("mouseout", (e) => {
    if (e.target.classList.contains("attendance-cell")) {
      hideTooltip();
    }
  });
  attendanceGrid.addEventListener("click", (e) => {
    if (e.target.classList.contains("attendance-cell")) {
      showTooltip(e, e.target);
      isTooltipLocked = true;
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        isTooltipLocked = false;
        hideTooltip();
        coolTooltip.classList.remove("visible");
      }, 3000);
    }
  });
}

// Delete Mode Logic
let deleteModeTimeout;
const toggleDeleteModeBtn = document.getElementById("toggleDeleteModeBtn");
if (toggleDeleteModeBtn) {
  toggleDeleteModeBtn.addEventListener("click", () => {
    isDeleteMode = !isDeleteMode;

    if (deleteModeTimeout) clearTimeout(deleteModeTimeout);

    if (isDeleteMode) {
      exerciseList.classList.add("delete-mode-active");
      toggleDeleteModeBtn.classList.add("active");
      toggleDeleteModeBtn.style.background = "var(--red)";
      toggleDeleteModeBtn.style.color = "#fff";

      deleteModeTimeout = setTimeout(() => {
        isDeleteMode = false;
        exerciseList.classList.remove("delete-mode-active");
        toggleDeleteModeBtn.classList.remove("active");
        toggleDeleteModeBtn.style.background = "";
        toggleDeleteModeBtn.style.color = "";
      }, 30000);
    } else {
      exerciseList.classList.remove("delete-mode-active");
      toggleDeleteModeBtn.classList.remove("active");
      toggleDeleteModeBtn.style.background = "";
      toggleDeleteModeBtn.style.color = "";
    }
  });

  exerciseList.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-icon-btn");
    if (!btn) return;

    const exName = btn.dataset.exName;
    if (confirm(`Are you sure you want to delete '${exName}' from your workout plan?`)) {
      const currentDay = workoutPlan[selectedDayIndex].day;
      // Find the custom entry that specifically belongs to the currently viewed day.
      // An entry "belongs" here if its specificDay matches, or if it has no specificDay.
      const customIndex = customExercises.findIndex(ex =>
        ex.name === exName &&
        (!ex.specificDay || ex.specificDay === currentDay)
      );
      if (customIndex !== -1) {
        customExercises.splice(customIndex, 1);
        persistCustomExercises();
      } else {
        // It's a default (exerciseSource) exercise — hide it globally
        if (!hiddenExercises.includes(exName)) {
          hiddenExercises.push(exName);
          persistHiddenExercises();
        }
      }
      triggerSync();
      renderWorkoutDay();
      saveMessage.textContent = `'${exName}' has been removed.`;
      saveMessage.style.color = "var(--red)";
    }
  });
}

// (Mobile Sidebar Drawer is now centrally handled in shared.js)

// ============ DATA BACKUP WIRING ============
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    if (typeof exportAllData === "function") {
      exportAllData();
      saveMessage.textContent = "Backup file downloaded!";
      saveMessage.style.color = "var(--green)";
    }
  });
}

// Helper to process backup file from input change or drag-and-drop
async function processBackupFile(file) {
  if (!file) return;
  if (!confirm("Importing will overwrite your current data with this backup. Continue?")) {
    if (importFile) importFile.value = "";
    return;
  }
  try {
    const count = await importAllData(file);
    alert(`Successfully restored ${count} data entries. Reloading...`);
    location.reload();
  } catch (err) {
    alert("Import failed: " + err.message);
  }
  if (importFile) importFile.value = "";
}

if (importBtn && importFile) {
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      processBackupFile(e.target.files[0]);
    }
  });

  // Enable drag-and-drop directly onto Import button and backup area
  const backupZone = importBtn.closest(".backup-actions") || importBtn;
  [importBtn, backupZone].forEach(elem => {
    if (!elem) return;
    elem.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      elem.classList.add("dragover");
    });

    elem.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      elem.classList.add("dragover");
    });

    elem.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget && elem.contains(e.relatedTarget)) return;
      elem.classList.remove("dragover");
    });

    elem.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      elem.classList.remove("dragover");
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        processBackupFile(file);
      }
    });
  });
}

// ============ AI WORKOUT PLAN MERGE IMPORT ============
const importAIPlanBtn = document.getElementById("importAIPlanBtn");
const importAIPlanFile = document.getElementById("importAIPlanFile");

function mergeAIWorkoutPlan(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid file format. Expected a JSON object.");
  }

  const result = { splitUpdated: 0, exercisesAdded: 0, bmiUpdated: false };

  // 1. Merge Split Configuration (if provided)
  if (Array.isArray(data.split) && data.split.length > 0) {
    const dayMap = {};
    data.split.forEach(s => {
      if (s && s.day && Array.isArray(s.muscles)) {
        dayMap[s.day.trim().toLowerCase()] = s.muscles.map(m => m.trim());
      }
    });

    workoutPlan.forEach(planDay => {
      const dayKey = planDay.day.trim().toLowerCase();
      if (dayMap[dayKey]) {
        const newMuscles = dayMap[dayKey];
        if (planDay.muscles.length === 1 && planDay.muscles[0] === "Rest") {
          planDay.muscles = [...newMuscles];
          result.splitUpdated++;
        } else {
          const merged = new Set([...planDay.muscles, ...newMuscles]);
          if (merged.size > 1 && merged.has("Rest")) {
            merged.delete("Rest");
          }
          planDay.muscles = Array.from(merged);
          result.splitUpdated++;
        }
        delete dayMap[dayKey];
      }
    });

    // Add any days from imported split not currently in workoutPlan (e.g. Saturday/Sunday)
    for (const dKey in dayMap) {
      const matchSplit = data.split.find(s => s && s.day && s.day.trim().toLowerCase() === dKey);
      if (matchSplit) {
        workoutPlan.push({
          day: matchSplit.day.trim(),
          muscles: Array.isArray(matchSplit.muscles) ? matchSplit.muscles.map(m => m.trim()) : []
        });
        result.splitUpdated++;
      }
    }
    persistWorkoutPlan();
  }

  // 2. Merge Custom Exercises (additive merge, scoped per day)
  if (Array.isArray(data.customExercises) && data.customExercises.length > 0) {
    // Unhide exercises if they were previously hidden
    const toUnhideLower = data.customExercises.map(e => e.name ? e.name.toLowerCase().trim() : "");
    hiddenExercises = hiddenExercises.filter(h => !toUnhideLower.includes(h.toLowerCase()));
    persistHiddenExercises();

    data.customExercises.forEach(ex => {
      if (!ex.name) return;
      const cleanName = ex.name.trim();
      const cleanMuscle = ex.muscle ? ex.muscle.trim() : "Other";
      const sets = parseInt(ex.sets, 10) || 3;
      const specificDay = ex.specificDay ? ex.specificDay.trim() : null;

      // Match by name AND specificDay so same exercise on another day is preserved
      const existingIdx = customExercises.findIndex(c =>
        c.name.toLowerCase() === cleanName.toLowerCase() &&
        (c.specificDay === specificDay || (!c.specificDay && !specificDay))
      );

      if (existingIdx !== -1) {
        customExercises[existingIdx].sets = sets;
        if (cleanMuscle && cleanMuscle !== "Other") {
          customExercises[existingIdx].muscle = cleanMuscle;
        }
      } else {
        customExercises.push({
          name: cleanName,
          muscle: cleanMuscle,
          specificDay: specificDay,
          sets: sets
        });
        result.exercisesAdded++;

        // Add to exerciseOrder for that day if present
        if (specificDay && exerciseOrder[specificDay]) {
          const lowerName = cleanName.toLowerCase();
          if (!exerciseOrder[specificDay].includes(lowerName)) {
            exerciseOrder[specificDay].push(lowerName);
          }
        }
      }
    });

    persistCustomExercises();
    persistExerciseOrder();
  }

  // 3. Merge Body Metrics / BMI Profile (optional)
  if (data.bmiProfile && typeof data.bmiProfile === "object") {
    const p = data.bmiProfile;
    try {
      const existingProfile = JSON.parse(localStorage.getItem("deadryx-bmi-profile-v1")) || {};
      if (p.age) existingProfile.age = parseInt(p.age, 10);
      if (p.heightCm) {
        existingProfile.height = parseFloat(p.heightCm);
        existingProfile.heightUnit = "cm";
      }
      if (p.weightKg) {
        existingProfile.weight = parseFloat(p.weightKg);
        existingProfile.weightUnit = "kg";
      }
      localStorage.setItem("deadryx-bmi-profile-v1", JSON.stringify(existingProfile));

      if (p.targetWeightKg) {
        const targetObj = {
          targetWeight: parseFloat(p.targetWeightKg),
          targetUnit: "kg",
          deadlineDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        };
        localStorage.setItem("deadryx-bmi-target-v1", JSON.stringify(targetObj));
      }

      if (p.weightKg && p.heightCm) {
        const heightM = parseFloat(p.heightCm) / 100;
        const weightKg = parseFloat(p.weightKg);
        const bmi = weightKg / (heightM * heightM);
        const bmiHistory = JSON.parse(localStorage.getItem("deadryx-bmi-history-v1")) || [];
        const todayStr = new Date().toISOString().split("T")[0];
        if (!bmiHistory.some(h => h.date === todayStr)) {
          bmiHistory.push({
            date: todayStr,
            weightKg: weightKg,
            heightM: heightM,
            bmi: parseFloat(bmi.toFixed(1))
          });
          localStorage.setItem("deadryx-bmi-history-v1", JSON.stringify(bmiHistory));
        }
      }
      result.bmiUpdated = true;
    } catch (err) {
      console.warn("BMI merge note:", err);
    }
  }

  // 3b. Merge Workout History & Logs if present
  const fileHist = data["deadryx-historical-log-v1"] || data.historicalLog;
  if (fileHist && typeof fileHist === "object") {
    const parsedHist = typeof fileHist === "string" ? JSON.parse(fileHist) : fileHist;
    historicalLog = { ...historicalLog, ...parsedHist };
    localStorage.setItem(HISTORICAL_KEY, JSON.stringify(historicalLog));
  }

  const fileWork = data["deadryx-workout-history-v1"] || data.workoutHistory;
  if (fileWork && typeof fileWork === "object") {
    const parsedWork = typeof fileWork === "string" ? JSON.parse(fileWork) : fileWork;
    for (const day in parsedWork) {
      if (!workoutHistory[day]) workoutHistory[day] = {};
      workoutHistory[day] = { ...workoutHistory[day], ...parsedWork[day] };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workoutHistory));
  }

  const fileAtt = data["deadryx-attendance-v1"] || data.attendance;
  if (fileAtt && typeof fileAtt === "object") {
    const parsedAtt = typeof fileAtt === "string" ? JSON.parse(fileAtt) : fileAtt;
    attendanceHistory = { ...attendanceHistory, ...parsedAtt };
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendanceHistory));
  }

  const filePRs = data["deadryx-pr-records-v1"] || data.prRecords;
  if (filePRs && typeof filePRs === "object") {
    try {
      const existingPRs = JSON.parse(localStorage.getItem("deadryx-pr-records-v1")) || {};
      const parsedPRs = typeof filePRs === "string" ? JSON.parse(filePRs) : filePRs;
      localStorage.setItem("deadryx-pr-records-v1", JSON.stringify({ ...existingPRs, ...parsedPRs }));
    } catch (e) {}
  }

  // 4. Update sync state and push to Drive
  triggerSync();

  // 5. Re-render UI
  if (typeof renderCalendar === "function") renderCalendar();
  if (typeof renderSidebarSplit === "function") renderSidebarSplit();
  if (typeof renderWorkoutDay === "function") renderWorkoutDay();
  if (typeof renderBMIPanel === "function") renderBMIPanel();

  return result;
}

// ============ AI WORKOUT PLAN MODAL & IMPORT ENGINE ============
const DEADRYX_AI_PROMPT_TEXT = `You are a fitness onboarding assistant for the DEADRYX workout tracker app (https://deadryx.me). Your job is to gather the user's workout plan through a friendly conversation, then produce a machine-readable JSON file in the exact DEADRYX format.

## Step 1 — Gather Workout Plan Information

Ask the user the following questions ONE AT A TIME (wait for each answer before continuing):

1. What is your name or what should I call you? (optional, for a friendly greeting)

2. What type of training split do you follow?
   Common options: Push/Pull/Legs, Upper/Lower, Bro Split (chest day, back day, etc.), Full Body, Custom
   (Note: If the user provides/uploads an image, photo, or document of their gym routine or timetable, read it and extract their split directly!)

3. For each training day, what muscle groups do you train?
   Map their answer to these exact muscle group names DEADRYX understands:
   - Chest, Back, Shoulders, Biceps, Triceps, Legs, Abs, Rest
   - Standard defaults: Push = Chest + Shoulders + Triceps; Pull = Back + Biceps; Legs = Legs + Abs.
   Get the assignment for all 7 days (Monday through Sunday). If a day is rest, use Rest.

4. For each day, what specific exercises do you do? (and how many sets?)
   - Accept exercise names in any format — you will normalize them.
   - If they uploaded a routine image/document, extract the exercises and sets from it.
   - Default to 3 sets if not specified.
   - Identify the primary muscle group for each exercise.

5. (Optional) Do you want to set up your body metrics?
   If yes, ask:
   - Current body weight (kg or lbs)
   - Height (cm or ft/in)
   - Target / goal weight (optional)
   - Age (optional)

## Step 2 — Produce the DEADRYX Import JSON

Once you have all the information, produce a JSON object in EXACTLY this format. Output only the raw JSON:

\`\`\`json
{
  "_meta": {
    "app": "DEADRYX",
    "type": "ai-workout-plan",
    "version": 1,
    "generatedAt": "2026-11-23T17:00:00Z",
    "generatedBy": "AI Onboarding Assistant"
  },
  "split": [
    { "day": "Monday",    "muscles": ["Chest", "Triceps"] },
    { "day": "Tuesday",   "muscles": ["Back", "Biceps"] },
    { "day": "Wednesday", "muscles": ["Legs", "Abs"] },
    { "day": "Thursday",  "muscles": ["Shoulders"] },
    { "day": "Friday",    "muscles": ["Chest", "Triceps"] },
    { "day": "Saturday",  "muscles": ["Back", "Biceps"] },
    { "day": "Sunday",    "muscles": ["Rest"] }
  ],
  "customExercises": [
    {
      "name": "Barbell Bench Press",
      "muscle": "Chest",
      "sets": 3,
      "specificDay": "Monday"
    },
    {
      "name": "Incline Dumbbell Press",
      "muscle": "Chest",
      "sets": 3,
      "specificDay": "Monday"
    }
  ],
  "bmiProfile": {
    "weightKg": 75,
    "heightCm": 178,
    "targetWeightKg": 80,
    "age": 24
  }
}
\`\`\`

## Rules for Producing the JSON:
- Always include all 7 days (Monday through Sunday) in the split array.
- In customExercises, set specificDay to the day name string (e.g. "Monday") for each exercise.
- If an exercise is performed on multiple days, include separate entries with their respective specificDay.
- If body metrics were skipped, omit the bmiProfile key.
- Tell the user: "Your DEADRYX workout plan is ready! Save this as a .json file and import it into DEADRYX using 'Setup Workout Plan with AI' in Settings."`;

const openAIPlanModalBtn = document.getElementById("openAIPlanModalBtn");
const aiPlanModal = document.getElementById("aiPlanModal");
const closeAIPlanModalBtn = document.getElementById("closeAIPlanModalBtn");
const cancelAIPlanModalBtn = document.getElementById("cancelAIPlanModalBtn");
const downloadAIPromptBtn = document.getElementById("downloadAIPromptBtn");
const copyAIPromptBtn = document.getElementById("copyAIPromptBtn");
const copyBtnText = document.getElementById("copyBtnText");

const aiDropzone = document.getElementById("aiDropzone");
const aiPlanFileInput = document.getElementById("aiPlanFileInput");
const aiDropzoneText = document.getElementById("aiDropzoneText");
const aiFileSelectedNotice = document.getElementById("aiFileSelectedNotice");
const aiSelectedFileName = document.getElementById("aiSelectedFileName");
const aiClearFileBtn = document.getElementById("aiClearFileBtn");
const aiFileErrorNotice = document.getElementById("aiFileErrorNotice");
const executeAIPlanImportBtn = document.getElementById("executeAIPlanImportBtn");

let parsedAIPlanData = null;

// Modal Open & Close
if (openAIPlanModalBtn && aiPlanModal) {
  openAIPlanModalBtn.addEventListener("click", () => {
    aiPlanModal.classList.add("active");
  });
}

function closeAIPlanModal() {
  if (aiPlanModal) aiPlanModal.classList.remove("active");
}

if (closeAIPlanModalBtn) closeAIPlanModalBtn.addEventListener("click", closeAIPlanModal);
if (cancelAIPlanModalBtn) cancelAIPlanModalBtn.addEventListener("click", closeAIPlanModal);
window.addEventListener("click", (e) => {
  if (e.target === aiPlanModal) {
    closeAIPlanModal();
  }
});

// Download Prompt File
if (downloadAIPromptBtn) {
  downloadAIPromptBtn.addEventListener("click", () => {
    const blob = new Blob([DEADRYX_AI_PROMPT_TEXT], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "DEADRYX_AI_PROMPT.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Copy Prompt to Clipboard
if (copyAIPromptBtn) {
  copyAIPromptBtn.addEventListener("click", () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(DEADRYX_AI_PROMPT_TEXT).then(() => {
        if (copyBtnText) copyBtnText.textContent = "✓ Copied!";
        setTimeout(() => { if (copyBtnText) copyBtnText.textContent = "Copy Prompt Text"; }, 2000);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      const textarea = document.createElement("textarea");
      textarea.value = DEADRYX_AI_PROMPT_TEXT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      if (copyBtnText) copyBtnText.textContent = "✓ Copied!";
      setTimeout(() => { if (copyBtnText) copyBtnText.textContent = "Copy Prompt Text"; }, 2000);
    }
  });
}

// Mode Selection Cards (Merge vs Reset)
const modeCards = document.querySelectorAll(".import-mode-card");
modeCards.forEach(card => {
  card.addEventListener("click", () => {
    modeCards.forEach(c => c.classList.remove("active"));
    card.classList.add("active");
  });
});

// Prevent default browser behavior of opening dropped files in tab
window.addEventListener("dragover", (e) => e.preventDefault(), false);
window.addEventListener("drop", (e) => e.preventDefault(), false);

// Dropzone & File Handling
if (aiDropzone && aiPlanFileInput) {
  aiDropzone.addEventListener("click", () => aiPlanFileInput.click());

  aiDropzone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    aiDropzone.classList.add("dragover");
  });

  aiDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    aiDropzone.classList.add("dragover");
  });

  aiDropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && aiDropzone.contains(e.relatedTarget)) return;
    aiDropzone.classList.remove("dragover");
  });

  aiDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    aiDropzone.classList.remove("dragover");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      handleUploadedAIPlanFile(file);
    }
  });

  // Also support dropping anywhere on modal content while modal is open
  const aiModalContent = aiPlanModal?.querySelector(".ai-modal-content");
  if (aiModalContent) {
    aiModalContent.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    });
    aiModalContent.addEventListener("drop", (e) => {
      // If dropped outside aiDropzone but inside modal, still handle file
      if (e.target !== aiDropzone && !aiDropzone.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) {
          handleUploadedAIPlanFile(file);
        }
      }
    });
  }

  aiPlanFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadedAIPlanFile(e.target.files[0]);
    }
  });
}

if (aiClearFileBtn) {
  aiClearFileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    parsedAIPlanData = null;
    if (aiPlanFileInput) aiPlanFileInput.value = "";
    if (aiFileSelectedNotice) aiFileSelectedNotice.style.display = "none";
    if (aiDropzone) aiDropzone.style.display = "flex";
    if (aiFileErrorNotice) {
      aiFileErrorNotice.style.display = "none";
      aiFileErrorNotice.textContent = "";
    }
    if (executeAIPlanImportBtn) executeAIPlanImportBtn.disabled = true;
  });
}

async function handleUploadedAIPlanFile(file) {
  if (!file) return;

  if (aiFileErrorNotice) {
    aiFileErrorNotice.style.display = "none";
    aiFileErrorNotice.textContent = "";
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate structure & normalize backup or AI plan keys
    const splitData = data.split || data["deadryx-split-config-v1"];
    const customExData = data.customExercises || data["deadryx-custom-exercises-v1"];
    const hasHistory = data.workoutHistory || data["deadryx-workout-history-v1"] || data.historicalLog || data["deadryx-historical-log-v1"];

    if (!data || typeof data !== "object" || (!splitData && !customExData && !hasHistory)) {
      throw new Error("File does not contain a valid DEADRYX workout plan JSON (missing 'split' or 'customExercises').");
    }

    if (!data.split && splitData) data.split = splitData;
    if (!data.customExercises && customExData) data.customExercises = customExData;

    parsedAIPlanData = data;

    if (aiSelectedFileName) aiSelectedFileName.textContent = file.name;
    if (aiFileSelectedNotice) aiFileSelectedNotice.style.display = "flex";
    if (aiDropzone) aiDropzone.style.display = "none";
    if (executeAIPlanImportBtn) executeAIPlanImportBtn.disabled = false;
  } catch (err) {
    parsedAIPlanData = null;
    if (executeAIPlanImportBtn) executeAIPlanImportBtn.disabled = true;
    if (aiFileErrorNotice) {
      aiFileErrorNotice.textContent = "Error: " + err.message;
      aiFileErrorNotice.style.display = "block";
    }
  }
}

// Reset / Clean Slate Application
function resetAndApplyAIWorkoutPlan(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid plan data.");
  }

  // 1. Restore workout history from file if included, otherwise wipe for a clean slate
  const fileWorkoutHistory = data["deadryx-workout-history-v1"] || data.workoutHistory;
  const fileHistoricalLog = data["deadryx-historical-log-v1"] || data.historicalLog;
  const fileAttendance = data["deadryx-attendance-v1"] || data.attendance;
  const filePRs = data["deadryx-pr-records-v1"] || data.prRecords;
  const fileTargets = data["deadryx-targets-v1"] || data.targets;
  const fileNotes = data["deadryx-notes-v1"] || data.notes;

  if (fileWorkoutHistory || fileHistoricalLog) {
    workoutHistory = (typeof fileWorkoutHistory === "string" ? JSON.parse(fileWorkoutHistory) : fileWorkoutHistory) || {};
    historicalLog = (typeof fileHistoricalLog === "string" ? JSON.parse(fileHistoricalLog) : fileHistoricalLog) || {};
    attendanceHistory = (typeof fileAttendance === "string" ? JSON.parse(fileAttendance) : fileAttendance) || {};
    customExercises = [];
    hiddenExercises = [];
    exerciseOrder = {};

    localStorage.setItem(STORAGE_KEY, JSON.stringify(workoutHistory));
    localStorage.setItem(HISTORICAL_KEY, JSON.stringify(historicalLog));
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendanceHistory));
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify([]));
    localStorage.setItem(HIDDEN_EXERCISES_KEY, JSON.stringify([]));
    localStorage.setItem(EXERCISE_ORDER_KEY, JSON.stringify({}));

    if (filePRs) {
      localStorage.setItem("deadryx-pr-records-v1", typeof filePRs === "string" ? filePRs : JSON.stringify(filePRs));
    }
    if (fileTargets) {
      localStorage.setItem("deadryx-targets-v1", typeof fileTargets === "string" ? fileTargets : JSON.stringify(fileTargets));
    }
    if (fileNotes) {
      localStorage.setItem("deadryx-notes-v1", typeof fileNotes === "string" ? fileNotes : JSON.stringify(fileNotes));
    }
  } else {
    workoutHistory = {};
    historicalLog = {};
    attendanceHistory = {};
    customExercises = [];
    hiddenExercises = [];
    exerciseOrder = {};

    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    localStorage.setItem(HISTORICAL_KEY, JSON.stringify({}));
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify({}));
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify([]));
    localStorage.setItem(HIDDEN_EXERCISES_KEY, JSON.stringify([]));
    localStorage.setItem(EXERCISE_ORDER_KEY, JSON.stringify({}));
    localStorage.setItem("deadryx-pr-records-v1", JSON.stringify({}));
  }

  // 2. Set new split configuration
  if (Array.isArray(data.split) && data.split.length > 0) {
    workoutPlan = data.split.map(s => ({
      day: s.day ? s.day.trim() : "Unknown",
      muscles: Array.isArray(s.muscles) ? s.muscles.map(m => m.trim()) : []
    }));
    persistWorkoutPlan();
  }

  // Ensure selectedDayIndex remains in bounds
  if (typeof selectedDayIndex !== "undefined" && selectedDayIndex >= workoutPlan.length) {
    selectedDayIndex = 0;
  }

  // 3. Set custom exercises
  if (Array.isArray(data.customExercises)) {
    data.customExercises.forEach(ex => {
      if (!ex.name) return;
      const cleanName = ex.name.trim();
      const specificDay = ex.specificDay ? ex.specificDay.trim() : null;
      customExercises.push({
        name: cleanName,
        muscle: ex.muscle ? ex.muscle.trim() : "Other",
        specificDay: specificDay,
        sets: parseInt(ex.sets, 10) || 3
      });
      if (specificDay) {
        if (!exerciseOrder[specificDay]) exerciseOrder[specificDay] = [];
        exerciseOrder[specificDay].push(cleanName.toLowerCase());
      }
    });
    persistCustomExercises();
    persistExerciseOrder();
  }

  // 4. Set BMI metrics if provided
  if (data.bmiProfile && typeof data.bmiProfile === "object") {
    const p = data.bmiProfile;
    try {
      const profile = {};
      if (p.age) profile.age = parseInt(p.age, 10);
      if (p.heightCm) {
        profile.height = parseFloat(p.heightCm);
        profile.heightUnit = "cm";
      }
      if (p.weightKg) {
        profile.weight = parseFloat(p.weightKg);
        profile.weightUnit = "kg";
      }
      localStorage.setItem("deadryx-bmi-profile-v1", JSON.stringify(profile));

      if (p.targetWeightKg) {
        const targetObj = {
          targetWeight: parseFloat(p.targetWeightKg),
          targetUnit: "kg",
          deadlineDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        };
        localStorage.setItem("deadryx-bmi-target-v1", JSON.stringify(targetObj));
      }

      if (p.weightKg && p.heightCm) {
        const heightM = parseFloat(p.heightCm) / 100;
        const weightKg = parseFloat(p.weightKg);
        const bmi = weightKg / (heightM * heightM);
        const history = [{
          date: new Date().toISOString().split("T")[0],
          weightKg: weightKg,
          heightM: heightM,
          bmi: parseFloat(bmi.toFixed(1))
        }];
        localStorage.setItem("deadryx-bmi-history-v1", JSON.stringify(history));
      }
    } catch (e) {
      console.warn("BMI profile reset note:", e);
    }
  }

  // 5. Sync to Drive
  try {
    triggerSync();
  } catch (syncErr) {
    console.warn("[Drive Sync] Non-blocking sync error on import:", syncErr);
  }

  // 6. Refresh UI
  if (typeof renderCalendar === "function") renderCalendar();
  if (typeof renderSidebarSplit === "function") renderSidebarSplit();
  if (typeof renderWorkoutDay === "function") renderWorkoutDay();
  if (typeof renderAttendance === "function") renderAttendance();
  if (typeof renderBMIPanel === "function") renderBMIPanel();
}

// Execute Import (Merge vs Reset)
if (executeAIPlanImportBtn) {
  executeAIPlanImportBtn.addEventListener("click", () => {
    if (!parsedAIPlanData) return;

    const selectedMode = document.querySelector('input[name="aiImportMode"]:checked')?.value || "merge";

    try {
      if (selectedMode === "reset") {
        if (!confirm("Are you sure you want to start fresh? This will remove all previous workout records and set up only this new plan.")) {
          return;
        }
        resetAndApplyAIWorkoutPlan(parsedAIPlanData);
        const msg = "Clean slate applied! Past workout logs cleared, and your new AI plan is ready.";
        if (typeof showToast === "function") {
          showToast(msg, "success");
        } else {
          alert(msg);
        }
        if (saveMessage) {
          saveMessage.textContent = msg;
          saveMessage.style.color = "var(--green)";
        }
      } else {
        // Merge / Overwrite without wiping history
        const res = mergeAIWorkoutPlan(parsedAIPlanData);
        let msg = `Plan updated! Added ${res.exercisesAdded} exercise(s)`;
        if (res.splitUpdated > 0) msg += `, updated split for ${res.splitUpdated} day(s)`;
        if (res.bmiUpdated) msg += `, saved body metrics`;
        msg += ". Past workout records preserved!";

        if (typeof showToast === "function") {
          showToast(msg, "success");
        } else {
          alert(msg);
        }
        if (saveMessage) {
          saveMessage.textContent = msg;
          saveMessage.style.color = "var(--green)";
        }
      }

      // Close modal & reset file state
      closeAIPlanModal();
      parsedAIPlanData = null;
      if (aiPlanFileInput) aiPlanFileInput.value = "";
      if (aiFileSelectedNotice) aiFileSelectedNotice.style.display = "none";
      if (aiDropzone) aiDropzone.style.display = "flex";
      executeAIPlanImportBtn.disabled = true;
    } catch (err) {
      alert("Failed to apply plan: " + err.message);
    }
  });
}

// ============ MOTIVATIONAL QUOTES ============
const QUOTES = [
  `<div class="q-sub"><span class="q-dim">Motivation. Discipline.</span> <span class="q-glow-red">OBSESSION.</span><br>Do it <strong style="color: var(--text)">ALONE.</strong> Do it <strong style="color: var(--text)">TIRED.</strong> Do it <strong style="color: var(--text)">BROKE.</strong> Do it <strong style="color: var(--text)">SCARED.</strong><br>Just keep <span class="q-glow-red">DOING IT.</span></div>`,

  `<div class="q-sub">To become a star, you must first <span class="q-glow-red">BURN.</span><br><strong style="color: var(--text)">Comfort is the WORST addiction you will ever feed.</strong></div>`,

  `<div class="q-sub">Getting your body in shape is one of the <strong style="color: var(--text)">GREATEST</strong> gifts<br>you will ever give <span class="q-glow-red">YOURSELF.</span><br><span class="q-author" style="margin-top:0.2rem">No one else will do it for you. That is the point.</span></div>`,

  `<div class="q-sub">Ego will take you where raw potential <span class="q-glow-red">NEVER COULD.</span><br><strong style="color: var(--text)">Let them doubt you. That is the FUEL.</strong></div>`,

  `<div class="q-sub">Love the ego. Embrace the pain. Unleash the <span class="q-glow-red">RAGE.</span><br><strong style="color: var(--text)">That is what separates a man who TRIES from a man who <span class="q-glow-red">WINS.</span></strong></div>`,

  `<div class="q-sub">I refuse to believe in <span class="q-dim">limits.</span><br>Limits are not real — they live only in the <strong style="color: var(--text)">MIND.</strong><br><strong style="color: var(--text)">You either <span class="q-glow-red">WIN</span>, or you are not done yet.</strong></div>`,

  `<div class="q-hero">"Maybe God is on his side —<br>but he is NOT <span class="q-glow-red">GOD.</span>"</div><span class="q-author">— Max Verstappen</span>`,

  `<div class="q-sub">The worst part: <span class="q-dim">it will not happen overnight.</span><br>The best part: <span class="q-glow-red">IT WILL HAPPEN.</span><br><strong style="color: var(--text)">Keep moving. The result is ALREADY waiting for you.</strong></div>`,

  `<div class="q-hero"><span class="q-glow-blue">STAY HUMBLE.</span> | <span class="q-glow-blue">STAY CALM.</span></div><div class="q-author" style="text-align:center; font-size:0.92rem; margin-top:0.4rem">The fire inside does not need to burn on the outside.</div>`
];

(function initQuotes() {
  const quoteText = document.getElementById("quoteText");
  const progressBar = document.getElementById("quoteProgressBar");
  if (!quoteText || !progressBar) return;

  let currentIndex = Math.floor(Math.random() * QUOTES.length);
  const INTERVAL = 21000;

  function showQuote(index) {
    quoteText.innerHTML = QUOTES[index];
    quoteText.classList.remove("q-exit");
    quoteText.classList.add("q-enter");

    // Reset progress bar
    progressBar.classList.remove("running");
    progressBar.style.width = "0%";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progressBar.classList.add("running");
      });
    });

    setTimeout(() => {
      quoteText.classList.remove("q-enter");
    }, 850);
  }

  function cycleQuote() {
    quoteText.classList.add("q-exit");
    progressBar.classList.remove("running");

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % QUOTES.length;
      showQuote(currentIndex);
    }, 750);
  }

  // Initial quote
  showQuote(currentIndex);

  // Cycle every 21 seconds
  setInterval(cycleQuote, INTERVAL);
})();

// Settings Dropdown Modal Toggle
document.addEventListener("DOMContentLoaded", () => {
  const profileToggle = document.getElementById("profileToggle");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const settingsModal = document.getElementById("settingsModal");

  if (profileToggle && settingsModal) {
    profileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      settingsModal.classList.add("active");
    });
  }
  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener("click", () => {
      settingsModal.classList.remove("active");
    });
  }
  // Click outside to close modal
  window.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove("active");
    }
  });
});

// ==================== WELCOME ONBOARDING MODAL ====================
const WELCOME_SEEN_KEY = "deadryx-welcome-seen-v1";

function isUserSignedIn() {
  try {
    const saved = localStorage.getItem("gdrive_access_token");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (!parsed.expires_at || Date.now() < parsed.expires_at)) {
        return true;
      }
    }
    const userInfo = localStorage.getItem("gdrive_user_info");
    if (userInfo) return true;
    if (typeof gapi !== "undefined" && gapi.client && typeof gapi.client.getToken === "function" && gapi.client.getToken()) {
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

function openWelcomeModal() {
  const modal = document.getElementById("welcomeModal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeWelcomeModal(shouldPersist = true) {
  const modal = document.getElementById("welcomeModal");
  if (modal) {
    modal.classList.remove("active");
  }
  if (shouldPersist) {
    const dontShow = document.getElementById("welcomeDontShowAgainCheckbox");
    if (!dontShow || dontShow.checked) {
      localStorage.setItem(WELCOME_SEEN_KEY, "true");
    }
  }
}

window.openWelcomeModal = openWelcomeModal;
window.closeWelcomeModal = closeWelcomeModal;

document.addEventListener("DOMContentLoaded", () => {
  const welcomeModal = document.getElementById("welcomeModal");
  const closeWelcomeModalBtn = document.getElementById("closeWelcomeModalBtn");
  const welcomeGetStartedBtn = document.getElementById("welcomeGetStartedBtn");
  const welcomeConnectGDriveBtn = document.getElementById("welcomeConnectGDriveBtn");
  const welcomeImportAIBtn = document.getElementById("welcomeImportAIBtn");
  const sidebarWelcomeGuideBtn = document.getElementById("sidebarWelcomeGuideBtn");

  // Re-open from sidebar
  if (sidebarWelcomeGuideBtn) {
    sidebarWelcomeGuideBtn.addEventListener("click", () => {
      openWelcomeModal();
    });
  }

  // Close button
  if (closeWelcomeModalBtn) {
    closeWelcomeModalBtn.addEventListener("click", () => {
      closeWelcomeModal(true);
    });
  }

  // Get Started button
  if (welcomeGetStartedBtn) {
    welcomeGetStartedBtn.addEventListener("click", () => {
      closeWelcomeModal(true);
    });
  }

  // Connect Google Drive button
  if (welcomeConnectGDriveBtn) {
    welcomeConnectGDriveBtn.addEventListener("click", () => {
      closeWelcomeModal(true);
      if (typeof handleAuthClick === "function") {
        handleAuthClick();
      }
    });
  }

  // Import AI Plan button
  if (welcomeImportAIBtn) {
    welcomeImportAIBtn.addEventListener("click", () => {
      closeWelcomeModal(true);
      const aiModal = document.getElementById("aiPlanModal");
      if (aiModal) {
        aiModal.classList.add("active");
      }
    });
  }

  // Click outside modal backdrop to close
  if (welcomeModal) {
    welcomeModal.addEventListener("click", (e) => {
      if (e.target === welcomeModal) {
        closeWelcomeModal(true);
      }
    });
  }

  // Automatic Trigger: Show when user lands on site if NOT signed in and NOT previously seen
  if (!isUserSignedIn() && localStorage.getItem(WELCOME_SEEN_KEY) !== "true") {
    // Small delay (700ms) after landing for smooth entrance
    setTimeout(() => {
      if (!isUserSignedIn() && localStorage.getItem(WELCOME_SEEN_KEY) !== "true") {
        openWelcomeModal();
      }
    }, 700);
  }
});
