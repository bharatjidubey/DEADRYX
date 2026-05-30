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

function getCurrentDayIndex() {
  const today = new Date().getDay();
  const map = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
  return map[today] ?? 0;
}

function getExercisesForDay(dayConfig) {
  const lowerHidden = hiddenExercises.map(x => x.toLowerCase());
  let filteredSource = exerciseSource.filter((exercise) => dayConfig.muscles.includes(exercise.muscle) && !lowerHidden.includes(exercise.name.toLowerCase()));

  let filteredCustom = customExercises.filter(exercise => {
    if (lowerHidden.includes(exercise.name.toLowerCase())) return false;
    if (exercise.specificDay) {
      return exercise.specificDay === dayConfig.day;
    }
    return dayConfig.muscles.includes(exercise.muscle);
  });

  // Deduplicate by name, preferring custom exercises which may override sets or specification
  const uniqueMap = new Map();
  filteredSource.forEach(ex => uniqueMap.set(ex.name.toLowerCase(), ex));
  filteredCustom.forEach(ex => uniqueMap.set(ex.name.toLowerCase(), ex));
  
  let filtered = Array.from(uniqueMap.values());

  filtered.sort((a, b) => {
    let orderA = dayConfig.muscles.indexOf(a.muscle);
    let orderB = dayConfig.muscles.indexOf(b.muscle);
    if (orderA === -1) orderA = 999;
    if (orderB === -1) orderB = 999;
    return orderA - orderB;
  });

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

  dayExercises.forEach((exercise) => {
    const card = document.createElement("article");
    card.className = "exercise-card";

    const setsCount = parseInt(exercise.sets, 10) || 3;
    const rows = Array.from({ length: setsCount }, (_, index) => {
      const setNumber = index + 1;
      const logData = workoutHistory?.[dayConfig.day]?.[exercise.name]?.[setNumber];

      let displayWeight = "";
      let displayReps = "";
      let previousText = "No previous data";

      if (logData) {
        if (logData.dateStamp === todayStr) {
          displayWeight = logData.weight === "0" ? "" : logData.weight;
          displayReps = logData.reps === "0" ? "" : logData.reps;
          if (logData.prevWeight || logData.prevReps) {
            previousText = `${logData.prevWeight || "-"} kg × ${logData.prevReps || "-"} reps`;
          }
        } else {
          if (logData.weight || logData.reps) {
            previousText = `${logData.weight || "-"} kg × ${logData.reps || "-"} reps`;
          }
        }
      }

      return `
        <div class="set-row">
          <div class="set-badge">Set ${setNumber}</div>
          <div class="previous-display">${previousText}</div>
          <input
            class="field-input js-weight-input"
            type="number"
            min="0"
            step="0.5"
            placeholder="New weight"
            value="${displayWeight}"
            data-day="${dayConfig.day}"
            data-exercise="${exercise.name}"
            data-set="${setNumber}"
          />
          <input
            class="field-input js-reps-input"
            type="number"
            min="0"
            step="1"
            placeholder="New reps"
            value="${displayReps}"
            data-day="${dayConfig.day}"
            data-exercise="${exercise.name}"
            data-set="${setNumber}"
          />
        </div>
      `;
    }).join("");

    card.innerHTML = `
      <div class="exercise-top">
        <div>
          <h3 class="exercise-title">${exercise.name}</h3>
        </div>
        <div>
          <span class="exercise-tag">${exercise.muscle}</span>
          <button class="analysis-btn" onclick="window.location.href='analysis.html?exercise=${encodeURIComponent(exercise.name)}'">Analysis</button>
          <button class="notes-btn" onclick="window.location.href='notes.html?exercise=${encodeURIComponent(exercise.name)}'">Notes</button>
          <button class="delete-icon-btn" data-ex-name="${exercise.name}">🗑️</button>
        </div>
      </div>
      <div class="sets-table">
        <div class="table-grid">
          <div class="table-head">
            <span>Set</span>
            <span>Previous Data</span>
            <span>New Weight</span>
            <span>New Reps</span>
          </div>
          ${rows}
        </div>
      </div>
    `;

    exerciseList.appendChild(card);
  });
}

function saveWorkout() {
  const dayConfig = workoutPlan[selectedDayIndex];
  const setRows = document.querySelectorAll(".set-row");

  if (!workoutHistory[dayConfig.day]) {
    workoutHistory[dayConfig.day] = {};
  }

  const prsDetected = [];

  setRows.forEach((row) => {
    const weightInput = row.querySelector(".js-weight-input");
    const repsInput = row.querySelector(".js-reps-input");

    if (!weightInput || !repsInput) return;

    const exerciseName = weightInput.dataset.exercise;
    const setNumber = weightInput.dataset.set;
    const weight = weightInput.value.trim();
    const reps = repsInput.value.trim();

    if (!exerciseName || !setNumber || (!weight && !reps)) return;

    const todayStr = new Date().toISOString().split("T")[0];

    if (!workoutHistory[dayConfig.day][exerciseName]) {
      workoutHistory[dayConfig.day][exerciseName] = {};
    }

    let currentLog = workoutHistory[dayConfig.day][exerciseName][setNumber];
    let prevW = currentLog?.prevWeight || currentLog?.weight || null;
    let prevR = currentLog?.prevReps || currentLog?.reps || null;

    if (currentLog && currentLog.dateStamp && currentLog.dateStamp !== todayStr) {
      prevW = currentLog.weight;
      prevR = currentLog.reps;
    }

    workoutHistory[dayConfig.day][exerciseName][setNumber] = {
      dateStamp: todayStr,
      weight: weight || "0",
      reps: reps || "0",
      prevWeight: prevW,
      prevReps: prevR
    };

    if (!historicalLog[todayStr]) historicalLog[todayStr] = {};
    if (!historicalLog[todayStr][exerciseName]) historicalLog[todayStr][exerciseName] = {};
    historicalLog[todayStr][exerciseName][setNumber] = {
      weight: weight || "0",
      reps: reps || "0"
    };

    if (!attendanceHistory[todayStr]) attendanceHistory[todayStr] = 0;
    attendanceHistory[todayStr] += 1;

    // 🏆 PR DETECTION
    if (typeof detectAndRecordPR === "function") {
      const pr = detectAndRecordPR(exerciseName, weight, reps);
      if (pr) prsDetected.push(pr);
    }
  });

  persistHistory();
  persistHistoricalLog();
  persistAttendanceHistory();
  saveMessage.textContent = `Workout saved for ${dayConfig.day}. New data will appear as previous data next time.`;
  saveMessage.style.color = "#36e28a";
  renderWorkoutDay();

  // Celebrate best PR
  if (prsDetected.length > 0 && typeof celebratePR === "function") {
    const best = prsDetected.reduce((a, b) => (b.current.weight > a.current.weight ? b : a));
    celebratePR(best);
  }

  // Refresh stats if available
  if (typeof renderStats === "function") renderStats();

  // Trigger Google Drive Cloud Sync
  triggerSync();
}

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

// Redesigned Add Exercise Modal Logic
const addExerciseModal = document.getElementById("addExerciseModal");
const openAddExerciseBtn = document.getElementById("openAddExerciseBtn");
const cancelAddExerciseBtn = document.getElementById("cancelAddExerciseBtn");
const confirmAddExerciseBtn = document.getElementById("confirmAddExerciseBtn");
const modalMuscleSelect = document.getElementById("modalMuscleSelect");
const modalExercisesSection = document.getElementById("modalExercisesSection");
const exerciseRowsContainer = document.getElementById("exerciseRowsContainer");
const modalAddRowBtn = document.getElementById("modalAddRowBtn");

function addExerciseRow(name = "", sets = 3) {
  if (!exerciseRowsContainer) return;
  
  // Escape HTML special chars to prevent breakage with quotes in names
  const safeName = name.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  const row = document.createElement("div");
  row.className = "exercise-entry-row";
  row.innerHTML = `
    <div class="input-group" style="flex: 3; margin: 0; position: relative;">
      <input type="text" class="field-input js-modal-exercise-name" placeholder="e.g. Incline Machine Press" list="popularExercisesDatalist" autocomplete="off" value="${safeName}" style="width: 100%;">
    </div>
    <div class="input-group" style="flex: 1; margin: 0;">
      <input type="number" class="field-input js-modal-exercise-sets" placeholder="Sets" min="1" max="15" value="${sets}" style="width: 100%; text-align: center;">
    </div>
    <button type="button" class="js-modal-remove-row-btn" aria-label="Remove exercise row">
      🗑️
    </button>
  `;
  
  // Wire up remove button
  const removeBtn = row.querySelector(".js-modal-remove-row-btn");
  removeBtn.addEventListener("click", () => {
    row.remove();
    // Always keep at least one row
    if (exerciseRowsContainer.children.length === 0) {
      addExerciseRow("", 3);
    }
  });
  
  exerciseRowsContainer.appendChild(row);
}

function updateDatalistOptions(selectedMuscle) {
  const datalist = document.getElementById("popularExercisesDatalist");
  if (!datalist) return;
  datalist.innerHTML = "";
  
  // Filter popular exercises matching selectedMuscle
  const filtered = POPULAR_EXERCISES.filter(ex => ex.muscle.toLowerCase() === selectedMuscle.toLowerCase());
  filtered.forEach(ex => {
    const opt = document.createElement("option");
    opt.value = ex.name;
    datalist.appendChild(opt);
  });
}

if (modalMuscleSelect && modalExercisesSection) {
  modalMuscleSelect.addEventListener("change", (e) => {
    const muscle = e.target.value;
    if (muscle) {
      modalExercisesSection.classList.remove("blocked");
      updateDatalistOptions(muscle);
    } else {
      modalExercisesSection.classList.add("blocked");
    }
  });
}

if (openAddExerciseBtn && addExerciseModal) {
  openAddExerciseBtn.addEventListener("click", () => {
    const dayConfig = workoutPlan[selectedDayIndex];
    if (dayConfig.day === "Sunday" || dayConfig.muscles.includes("Rest")) {
      alert("Cannot add exercise on a Rest day. Select another day.");
      return;
    }

    // Reset modal states
    if (modalMuscleSelect) modalMuscleSelect.selectedIndex = 0;
    if (modalExercisesSection) modalExercisesSection.classList.add("blocked");
    if (exerciseRowsContainer) {
      exerciseRowsContainer.innerHTML = "";
      addExerciseRow("", 3);
    }
    
    addExerciseModal.classList.add("active");
  });

  if (modalAddRowBtn) {
    modalAddRowBtn.addEventListener("click", () => {
      addExerciseRow("", 3);
    });
  }

  cancelAddExerciseBtn.addEventListener("click", () => {
    addExerciseModal.classList.remove("active");
  });

  confirmAddExerciseBtn.addEventListener("click", () => {
    const muscle = modalMuscleSelect ? modalMuscleSelect.value : "";
    if (!muscle) {
      alert("Please select a muscle group.");
      return;
    }

    const rows = exerciseRowsContainer ? exerciseRowsContainer.querySelectorAll(".exercise-entry-row") : [];
    const entries = [];
    rows.forEach(row => {
      const nameInput = row.querySelector(".js-modal-exercise-name");
      const setsInput = row.querySelector(".js-modal-exercise-sets");
      if (nameInput && setsInput) {
        const name = nameInput.value.trim();
        const sets = parseInt(setsInput.value, 10) || 3;
        if (name) {
          entries.push({ name, sets });
        }
      }
    });

    if (entries.length === 0) {
      alert("Please enter at least one exercise name.");
      return;
    }

    const targetDay = workoutPlan[selectedDayIndex].day;
    entries.forEach(entry => {
      // Unhide exercise if it was previously hidden/deleted
      hiddenExercises = hiddenExercises.filter(ex => ex.toLowerCase() !== entry.name.toLowerCase());
      
      // Add or update custom exercise — single lookup instead of some + find
      const existingIdx = customExercises.findIndex(ex => 
        ex.name.toLowerCase() === entry.name.toLowerCase() && 
        ex.specificDay === targetDay && 
        ex.muscle === muscle
      );
      
      if (existingIdx === -1) {
        customExercises.push({
          name: entry.name,
          muscle: muscle,
          specificDay: targetDay,
          sets: entry.sets
        });
      } else {
        customExercises[existingIdx].sets = entry.sets;
      }
    });

    persistHiddenExercises();
    persistCustomExercises();
    triggerSync();
    addExerciseModal.classList.remove("active");
    saveMessage.textContent = "Exercises saved to workout day!";
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

  attendanceMonths.innerHTML = "";
  attendanceGrid.innerHTML = "";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  months.forEach((m) => {
    attendanceMonths.innerHTML += `<span>${m}</span>`;
  });

  const year = new Date().getFullYear();
  const startDate = new Date(year, 0, 1); // Jan 1
  const endDate = new Date(year, 11, 31); // Dec 31
  const totalDays = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;

  // Add empty cells to align Jan 1 to the correct day-of-week row
  const startDayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon, ...
  for (let i = 0; i < startDayOfWeek; i++) {
    const empty = document.createElement("div");
    empty.className = "attendance-cell";
    empty.style.visibility = "hidden";
    attendanceGrid.appendChild(empty);
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
    attendanceGrid.appendChild(cell);
  }

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
      toggleDeleteModeBtn.style.background = "var(--red)";
      toggleDeleteModeBtn.style.color = "#fff";

      deleteModeTimeout = setTimeout(() => {
        isDeleteMode = false;
        exerciseList.classList.remove("delete-mode-active");
        toggleDeleteModeBtn.style.background = "transparent";
        toggleDeleteModeBtn.style.color = "var(--red)";
      }, 30000);
    } else {
      exerciseList.classList.remove("delete-mode-active");
      toggleDeleteModeBtn.style.background = "transparent";
      toggleDeleteModeBtn.style.color = "var(--red)";
    }
  });

  exerciseList.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-icon-btn");
    if (!btn) return;

    const exName = btn.dataset.exName;
    if (confirm(`Are you sure you want to delete '${exName}' from your workout plan?`)) {
      const customIndex = customExercises.findIndex(ex => ex.name === exName);
      if (customIndex !== -1) {
        customExercises.splice(customIndex, 1);
        persistCustomExercises();
      } else {
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

if (importBtn && importFile) {
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("Importing will overwrite your current data. Continue?")) {
      importFile.value = "";
      return;
    }
    try {
      const count = await importAllData(file);
      alert(`Successfully restored ${count} data entries. Reloading...`);
      location.reload();
    } catch (err) {
      alert("Import failed: " + err.message);
    }
    importFile.value = "";
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