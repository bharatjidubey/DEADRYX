const NOTES_KEY = "deadryx-notes-v1";
const exerciseTitle = document.getElementById("exerciseTitle");
const notesArea = document.getElementById("notesArea");
const editNotesBtn = document.getElementById("editNotesBtn");
const saveIndicator = document.getElementById("saveIndicator");

const params = new URLSearchParams(window.location.search);
let exerciseName = params.get("exercise") || "";

function getAllAvailableExercises() {
  const set = new Set();
  
  // 1. Existing notes
  const notes = loadNotes();
  Object.keys(notes).forEach(k => { if (k && k !== "Exercise") set.add(k); });

  // 2. Historical log
  try {
    const rawHist = JSON.parse(localStorage.getItem("deadryx-historical-log-v1") || "{}");
    Object.keys(rawHist).forEach(d => {
      Object.keys(rawHist[d] || {}).forEach(ex => { if (ex && ex !== "Exercise") set.add(ex); });
    });
  } catch {}

  // 3. Standard popular list
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

  if (!exerciseName) {
    // Pick first note that has content, or first in list
    const notes = loadNotes();
    const hasNote = Object.keys(notes).find(k => notes[k] && notes[k].trim() && k !== "Exercise");
    exerciseName = hasNote || "Barbell Bench Press";
  }

  if (exerciseTitle) {
    exerciseTitle.textContent = `${exerciseName} Notes`;
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
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    saveNotes();
  }
  exerciseName = newName;
  if (exerciseTitle) {
    exerciseTitle.textContent = `${exerciseName} Notes`;
  }
  const newUrl = new URL(window.location);
  newUrl.searchParams.set("exercise", exerciseName);
  window.history.replaceState({}, "", newUrl);

  initNotes();
}

let isEditing = false;
let autoSaveTimeout = null;

function initNotes() {
  const allNotes = loadNotes();
  const currentNote = allNotes[exerciseName] || "";
  notesArea.value = currentNote;
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) { return {}; }
}

function saveNotes() {
  const allNotes = loadNotes();
  allNotes[exerciseName] = notesArea.value;
  localStorage.setItem(NOTES_KEY, JSON.stringify(allNotes));
  triggerSync();

  saveIndicator.textContent = "Saved";
  saveIndicator.className = "save-indicator visible saved";

  setTimeout(() => {
    saveIndicator.classList.remove("visible");
  }, 2000);
}

editNotesBtn.addEventListener("click", () => {
  isEditing = !isEditing;

  if (isEditing) {
    notesArea.disabled = false;
    notesArea.classList.add("editable");
    notesArea.focus();

    if (notesArea.value.trim() === "") {
      notesArea.value = "💪 ";
    }

    editNotesBtn.textContent = "Done Editing";
    editNotesBtn.style.background = "linear-gradient(135deg, var(--green), #5ceda2)";
    editNotesBtn.style.color = "#0b1119";
  } else {
    notesArea.disabled = true;
    notesArea.classList.remove("editable");
    editNotesBtn.textContent = "Edit Notes";
    editNotesBtn.style.background = "";
    editNotesBtn.style.color = "";

    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    saveNotes();
  }
});

notesArea.addEventListener("input", () => {
  saveIndicator.textContent = "Saving...";
  saveIndicator.className = "save-indicator visible saving";

  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(() => {
    saveNotes();
  }, 750);
});

notesArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const cursorPos = notesArea.selectionStart;
    const textBeforeCursor = notesArea.value.substring(0, cursorPos);
    const textAfterCursor = notesArea.value.substring(notesArea.selectionEnd);

    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];

    if (currentLine.trim() === "💪") {
      const newTextBefore = textBeforeCursor.substring(0, cursorPos - currentLine.length);
      notesArea.value = newTextBefore + "\n" + textAfterCursor;
      notesArea.selectionStart = notesArea.selectionEnd = newTextBefore.length + 1;
    } else {
      notesArea.value = textBeforeCursor + "\n💪 " + textAfterCursor;
      notesArea.selectionStart = notesArea.selectionEnd = cursorPos + 4;
    }

    saveNotes();
  }
});

initExerciseSelect();
initNotes();