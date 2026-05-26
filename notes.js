const NOTES_KEY = "deadryx-notes-v1";
const exerciseTitle = document.getElementById("exerciseTitle");
const notesArea = document.getElementById("notesArea");
const editNotesBtn = document.getElementById("editNotesBtn");
const saveIndicator = document.getElementById("saveIndicator");

const params = new URLSearchParams(window.location.search);
const exerciseName = params.get("exercise") || "Exercise";

exerciseTitle.textContent = `${exerciseName} Notes`;

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

initNotes();