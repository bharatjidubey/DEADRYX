// seed-data.js — Temporary fake data for testing. Remove after use.
(function seedData() {
  if (localStorage.getItem("deadryx-seed-applied")) {
    console.log("Seed data already applied. Clear localStorage to re-seed.");
    return;
  }

  // ===== HISTORICAL LOG (last 10 days) =====
  const historicalLog = {
    "2026-05-16": {
      "Barbell Squat":     { "1": { weight: "70", reps: "10" }, "2": { weight: "75", reps: "8" }, "3": { weight: "80", reps: "6" } },
      "Walking Lunges":    { "1": { weight: "20", reps: "12" }, "2": { weight: "22", reps: "10" }, "3": { weight: "22", reps: "10" } },
      "Cable Crunch":      { "1": { weight: "30", reps: "15" }, "2": { weight: "32", reps: "12" }, "3": { weight: "35", reps: "10" } },
      "Plank":             { "1": { weight: "0", reps: "60" }, "2": { weight: "0", reps: "45" }, "3": { weight: "0", reps: "45" } }
    },
    "2026-05-17": {
      "Lat Pulldown":      { "1": { weight: "45", reps: "12" }, "2": { weight: "50", reps: "10" }, "3": { weight: "50", reps: "8" } },
      "Barbell Row":       { "1": { weight: "45", reps: "10" }, "2": { weight: "50", reps: "8" }, "3": { weight: "50", reps: "8" } },
      "Tricep Pushdown":   { "1": { weight: "22", reps: "12" }, "2": { weight: "25", reps: "10" }, "3": { weight: "27", reps: "8" } },
      "Skull Crushers":    { "1": { weight: "15", reps: "10" }, "2": { weight: "17", reps: "8" }, "3": { weight: "17", reps: "8" } }
    },
    "2026-05-19": {
      "Bench Press":           { "1": { weight: "55", reps: "12" }, "2": { weight: "60", reps: "10" }, "3": { weight: "65", reps: "7" } },
      "Incline Dumbbell Press": { "1": { weight: "18", reps: "12" }, "2": { weight: "20", reps: "10" }, "3": { weight: "22", reps: "8" } },
      "Barbell Curl":          { "1": { weight: "22", reps: "12" }, "2": { weight: "25", reps: "10" }, "3": { weight: "27", reps: "8" } },
      "Hammer Curl":           { "1": { weight: "12", reps: "12" }, "2": { weight: "14", reps: "10" }, "3": { weight: "14", reps: "10" } }
    },
    "2026-05-20": {
      "Overhead Press":    { "1": { weight: "30", reps: "12" }, "2": { weight: "35", reps: "10" }, "3": { weight: "37", reps: "7" } },
      "Lateral Raise":     { "1": { weight: "8", reps: "15" }, "2": { weight: "10", reps: "12" }, "3": { weight: "10", reps: "12" } },
      "Barbell Squat":     { "1": { weight: "72", reps: "10" }, "2": { weight: "77", reps: "8" }, "3": { weight: "82", reps: "6" } },
      "Walking Lunges":    { "1": { weight: "22", reps: "12" }, "2": { weight: "24", reps: "10" }, "3": { weight: "24", reps: "10" } }
    },
    "2026-05-21": {
      "Lat Pulldown":      { "1": { weight: "48", reps: "12" }, "2": { weight: "52", reps: "10" }, "3": { weight: "55", reps: "8" } },
      "Barbell Row":       { "1": { weight: "48", reps: "10" }, "2": { weight: "52", reps: "8" }, "3": { weight: "55", reps: "7" } },
      "Tricep Pushdown":   { "1": { weight: "25", reps: "12" }, "2": { weight: "27", reps: "10" }, "3": { weight: "30", reps: "8" } },
      "Skull Crushers":    { "1": { weight: "17", reps: "10" }, "2": { weight: "18", reps: "8" }, "3": { weight: "20", reps: "7" } }
    },
    "2026-05-22": {
      "Bench Press":           { "1": { weight: "57", reps: "12" }, "2": { weight: "62", reps: "10" }, "3": { weight: "67", reps: "7" } },
      "Incline Dumbbell Press": { "1": { weight: "20", reps: "12" }, "2": { weight: "22", reps: "10" }, "3": { weight: "24", reps: "8" } },
      "Barbell Curl":          { "1": { weight: "25", reps: "12" }, "2": { weight: "27", reps: "10" }, "3": { weight: "30", reps: "8" } },
      "Hammer Curl":           { "1": { weight: "14", reps: "12" }, "2": { weight: "14", reps: "10" }, "3": { weight: "16", reps: "8" } }
    },
    "2026-05-23": {
      "Barbell Squat":     { "1": { weight: "75", reps: "10" }, "2": { weight: "80", reps: "8" }, "3": { weight: "85", reps: "6" } },
      "Walking Lunges":    { "1": { weight: "24", reps: "12" }, "2": { weight: "24", reps: "10" }, "3": { weight: "26", reps: "10" } },
      "Cable Crunch":      { "1": { weight: "32", reps: "15" }, "2": { weight: "35", reps: "12" }, "3": { weight: "37", reps: "10" } },
      "Plank":             { "1": { weight: "0", reps: "60" }, "2": { weight: "0", reps: "50" }, "3": { weight: "0", reps: "50" } }
    },
    "2026-05-24": {
      "Lat Pulldown":      { "1": { weight: "50", reps: "12" }, "2": { weight: "55", reps: "10" }, "3": { weight: "57", reps: "8" } },
      "Barbell Row":       { "1": { weight: "50", reps: "10" }, "2": { weight: "55", reps: "8" }, "3": { weight: "57", reps: "7" } },
      "Tricep Pushdown":   { "1": { weight: "27", reps: "12" }, "2": { weight: "30", reps: "10" }, "3": { weight: "32", reps: "8" } },
      "Skull Crushers":    { "1": { weight: "18", reps: "10" }, "2": { weight: "20", reps: "8" }, "3": { weight: "22", reps: "7" } }
    }
  };

  // ===== WORKOUT HISTORY (latest per day/exercise/set) =====
  const workoutHistory = {
    "Friday": {
      "Barbell Squat":  { "1": { dateStamp: "2026-05-23", weight: "75", reps: "10", prevWeight: "70", prevReps: "10" }, "2": { dateStamp: "2026-05-23", weight: "80", reps: "8", prevWeight: "75", prevReps: "8" }, "3": { dateStamp: "2026-05-23", weight: "85", reps: "6", prevWeight: "80", prevReps: "6" } },
      "Walking Lunges": { "1": { dateStamp: "2026-05-23", weight: "24", reps: "12", prevWeight: "20", prevReps: "12" }, "2": { dateStamp: "2026-05-23", weight: "24", reps: "10", prevWeight: "22", prevReps: "10" }, "3": { dateStamp: "2026-05-23", weight: "26", reps: "10", prevWeight: "22", prevReps: "10" } },
      "Cable Crunch":   { "1": { dateStamp: "2026-05-23", weight: "32", reps: "15", prevWeight: "30", prevReps: "15" }, "2": { dateStamp: "2026-05-23", weight: "35", reps: "12", prevWeight: "32", prevReps: "12" }, "3": { dateStamp: "2026-05-23", weight: "37", reps: "10", prevWeight: "35", prevReps: "10" } },
      "Plank":          { "1": { dateStamp: "2026-05-23", weight: "0", reps: "60", prevWeight: "0", prevReps: "60" }, "2": { dateStamp: "2026-05-23", weight: "0", reps: "50", prevWeight: "0", prevReps: "45" }, "3": { dateStamp: "2026-05-23", weight: "0", reps: "50", prevWeight: "0", prevReps: "45" } }
    },
    "Saturday": {
      "Lat Pulldown":    { "1": { dateStamp: "2026-05-24", weight: "50", reps: "12", prevWeight: "48", prevReps: "12" }, "2": { dateStamp: "2026-05-24", weight: "55", reps: "10", prevWeight: "52", prevReps: "10" }, "3": { dateStamp: "2026-05-24", weight: "57", reps: "8", prevWeight: "55", prevReps: "8" } },
      "Barbell Row":     { "1": { dateStamp: "2026-05-24", weight: "50", reps: "10", prevWeight: "48", prevReps: "10" }, "2": { dateStamp: "2026-05-24", weight: "55", reps: "8", prevWeight: "52", prevReps: "8" }, "3": { dateStamp: "2026-05-24", weight: "57", reps: "7", prevWeight: "55", prevReps: "7" } },
      "Tricep Pushdown": { "1": { dateStamp: "2026-05-24", weight: "27", reps: "12", prevWeight: "25", prevReps: "12" }, "2": { dateStamp: "2026-05-24", weight: "30", reps: "10", prevWeight: "27", prevReps: "10" }, "3": { dateStamp: "2026-05-24", weight: "32", reps: "8", prevWeight: "30", prevReps: "8" } },
      "Skull Crushers":  { "1": { dateStamp: "2026-05-24", weight: "18", reps: "10", prevWeight: "17", prevReps: "10" }, "2": { dateStamp: "2026-05-24", weight: "20", reps: "8", prevWeight: "18", prevReps: "8" }, "3": { dateStamp: "2026-05-24", weight: "22", reps: "7", prevWeight: "20", prevReps: "7" } }
    },
    "Monday": {
      "Bench Press":           { "1": { dateStamp: "2026-05-19", weight: "55", reps: "12", prevWeight: null, prevReps: null }, "2": { dateStamp: "2026-05-19", weight: "60", reps: "10", prevWeight: null, prevReps: null }, "3": { dateStamp: "2026-05-19", weight: "65", reps: "7", prevWeight: null, prevReps: null } },
      "Incline Dumbbell Press": { "1": { dateStamp: "2026-05-19", weight: "18", reps: "12", prevWeight: null, prevReps: null }, "2": { dateStamp: "2026-05-19", weight: "20", reps: "10", prevWeight: null, prevReps: null }, "3": { dateStamp: "2026-05-19", weight: "22", reps: "8", prevWeight: null, prevReps: null } },
      "Barbell Curl":          { "1": { dateStamp: "2026-05-19", weight: "22", reps: "12", prevWeight: null, prevReps: null }, "2": { dateStamp: "2026-05-19", weight: "25", reps: "10", prevWeight: null, prevReps: null }, "3": { dateStamp: "2026-05-19", weight: "27", reps: "8", prevWeight: null, prevReps: null } },
      "Hammer Curl":           { "1": { dateStamp: "2026-05-19", weight: "12", reps: "12", prevWeight: null, prevReps: null }, "2": { dateStamp: "2026-05-19", weight: "14", reps: "10", prevWeight: null, prevReps: null }, "3": { dateStamp: "2026-05-19", weight: "14", reps: "10", prevWeight: null, prevReps: null } }
    },
    "Tuesday": {
      "Overhead Press":  { "1": { dateStamp: "2026-05-20", weight: "30", reps: "12", prevWeight: null, prevReps: null }, "2": { dateStamp: "2026-05-20", weight: "35", reps: "10", prevWeight: null, prevReps: null }, "3": { dateStamp: "2026-05-20", weight: "37", reps: "7", prevWeight: null, prevReps: null } },
      "Lateral Raise":   { "1": { dateStamp: "2026-05-20", weight: "8", reps: "15", prevWeight: null, prevReps: null }, "2": { dateStamp: "2026-05-20", weight: "10", reps: "12", prevWeight: null, prevReps: null }, "3": { dateStamp: "2026-05-20", weight: "10", reps: "12", prevWeight: null, prevReps: null } },
      "Barbell Squat":   { "1": { dateStamp: "2026-05-20", weight: "72", reps: "10", prevWeight: null, prevReps: null }, "2": { dateStamp: "2026-05-20", weight: "77", reps: "8", prevWeight: null, prevReps: null }, "3": { dateStamp: "2026-05-20", weight: "82", reps: "6", prevWeight: null, prevReps: null } },
      "Walking Lunges":  { "1": { dateStamp: "2026-05-20", weight: "22", reps: "12", prevWeight: null, prevReps: null }, "2": { dateStamp: "2026-05-20", weight: "24", reps: "10", prevWeight: null, prevReps: null }, "3": { dateStamp: "2026-05-20", weight: "24", reps: "10", prevWeight: null, prevReps: null } }
    },
    "Wednesday": {
      "Lat Pulldown":    { "1": { dateStamp: "2026-05-21", weight: "48", reps: "12", prevWeight: "45", prevReps: "12" }, "2": { dateStamp: "2026-05-21", weight: "52", reps: "10", prevWeight: "50", prevReps: "10" }, "3": { dateStamp: "2026-05-21", weight: "55", reps: "8", prevWeight: "50", prevReps: "8" } },
      "Barbell Row":     { "1": { dateStamp: "2026-05-21", weight: "48", reps: "10", prevWeight: "45", prevReps: "10" }, "2": { dateStamp: "2026-05-21", weight: "52", reps: "8", prevWeight: "50", prevReps: "8" }, "3": { dateStamp: "2026-05-21", weight: "55", reps: "7", prevWeight: "50", prevReps: "8" } },
      "Tricep Pushdown": { "1": { dateStamp: "2026-05-21", weight: "25", reps: "12", prevWeight: "22", prevReps: "12" }, "2": { dateStamp: "2026-05-21", weight: "27", reps: "10", prevWeight: "25", prevReps: "10" }, "3": { dateStamp: "2026-05-21", weight: "30", reps: "8", prevWeight: "27", prevReps: "8" } },
      "Skull Crushers":  { "1": { dateStamp: "2026-05-21", weight: "17", reps: "10", prevWeight: "15", prevReps: "10" }, "2": { dateStamp: "2026-05-21", weight: "18", reps: "8", prevWeight: "17", prevReps: "8" }, "3": { dateStamp: "2026-05-21", weight: "20", reps: "7", prevWeight: "17", prevReps: "8" } }
    },
    "Thursday": {
      "Bench Press":           { "1": { dateStamp: "2026-05-22", weight: "57", reps: "12", prevWeight: "55", prevReps: "12" }, "2": { dateStamp: "2026-05-22", weight: "62", reps: "10", prevWeight: "60", prevReps: "10" }, "3": { dateStamp: "2026-05-22", weight: "67", reps: "7", prevWeight: "65", prevReps: "7" } },
      "Incline Dumbbell Press": { "1": { dateStamp: "2026-05-22", weight: "20", reps: "12", prevWeight: "18", prevReps: "12" }, "2": { dateStamp: "2026-05-22", weight: "22", reps: "10", prevWeight: "20", prevReps: "10" }, "3": { dateStamp: "2026-05-22", weight: "24", reps: "8", prevWeight: "22", prevReps: "8" } },
      "Barbell Curl":          { "1": { dateStamp: "2026-05-22", weight: "25", reps: "12", prevWeight: "22", prevReps: "12" }, "2": { dateStamp: "2026-05-22", weight: "27", reps: "10", prevWeight: "25", prevReps: "10" }, "3": { dateStamp: "2026-05-22", weight: "30", reps: "8", prevWeight: "27", prevReps: "8" } },
      "Hammer Curl":           { "1": { dateStamp: "2026-05-22", weight: "14", reps: "12", prevWeight: "12", prevReps: "12" }, "2": { dateStamp: "2026-05-22", weight: "14", reps: "10", prevWeight: "14", prevReps: "10" }, "3": { dateStamp: "2026-05-22", weight: "16", reps: "8", prevWeight: "14", prevReps: "10" } }
    }
  };

  // ===== ATTENDANCE (exercises logged per day) =====
  const attendance = {
    "2026-05-16": 12, "2026-05-17": 12,
    "2026-05-19": 12, "2026-05-20": 12,
    "2026-05-21": 12, "2026-05-22": 12,
    "2026-05-23": 12, "2026-05-24": 12
  };

  // ===== PR RECORDS =====
  const prRecords = {
    "Bench Press":           { weight: 67, reps: 7, date: "2026-05-22" },
    "Incline Dumbbell Press": { weight: 24, reps: 8, date: "2026-05-22" },
    "Barbell Curl":          { weight: 30, reps: 8, date: "2026-05-22" },
    "Hammer Curl":           { weight: 16, reps: 8, date: "2026-05-22" },
    "Overhead Press":        { weight: 37, reps: 7, date: "2026-05-20" },
    "Lateral Raise":         { weight: 10, reps: 12, date: "2026-05-20" },
    "Barbell Squat":         { weight: 85, reps: 6, date: "2026-05-23" },
    "Walking Lunges":        { weight: 26, reps: 10, date: "2026-05-23" },
    "Lat Pulldown":          { weight: 57, reps: 8, date: "2026-05-24" },
    "Barbell Row":           { weight: 57, reps: 7, date: "2026-05-24" },
    "Tricep Pushdown":       { weight: 32, reps: 8, date: "2026-05-24" },
    "Skull Crushers":        { weight: 22, reps: 7, date: "2026-05-24" },
    "Cable Crunch":          { weight: 37, reps: 10, date: "2026-05-23" }
  };

  // ===== BMI HISTORY (5 entries over past 10 days) =====
  const bmiHistory = [
    { date: "2026-05-16", weightKg: 71.2, heightM: 1.75, bmi: 23.24 },
    { date: "2026-05-18", weightKg: 70.8, heightM: 1.75, bmi: 23.11 },
    { date: "2026-05-20", weightKg: 70.5, heightM: 1.75, bmi: 23.02 },
    { date: "2026-05-22", weightKg: 70.3, heightM: 1.75, bmi: 22.96 },
    { date: "2026-05-25", weightKg: 70.0, heightM: 1.75, bmi: 22.86 }
  ];

  const bmiProfile = {
    weight: "70", weightUnit: "kg",
    height: "175", heightUnit: "cm",
    heightInches: "", age: "20"
  };

  const bmiTarget = { weight: 72 };

  // ===== WRITE TO LOCALSTORAGE =====
  localStorage.setItem("deadryx-historical-log-v1", JSON.stringify(historicalLog));
  localStorage.setItem("deadryx-workout-history-v1", JSON.stringify(workoutHistory));
  localStorage.setItem("deadryx-attendance-v1", JSON.stringify(attendance));
  localStorage.setItem("deadryx-pr-records-v1", JSON.stringify(prRecords));
  localStorage.setItem("deadryx-bmi-history-v1", JSON.stringify(bmiHistory));
  localStorage.setItem("deadryx-bmi-profile-v1", JSON.stringify(bmiProfile));
  localStorage.setItem("deadryx-bmi-target-v1", JSON.stringify(bmiTarget));
  localStorage.setItem("deadryx-seed-applied", "true");

  console.log("✅ DEADRYX seed data applied! 8 workout days, 5 BMI entries, 13 PR records.");
  console.log("💡 To clear seed data: localStorage.clear() then refresh.");
})();
