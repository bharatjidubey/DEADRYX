// gdrive-sync.js - Google Drive Sync Integration
// Ensure you replace YOUR_CLIENT_ID with an actual Client ID from Google Cloud Console.

const CLIENT_ID = "195627152960-c2orf2tnpj53fvep8f20ms3abqppbsf6.apps.googleusercontent.com";
const API_KEY = ""; // Not strictly required if using OAuth token flow for Drive REST API, but good to have if querying public data
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile";

let tokenClient;
let gapiInited = false;
let gisInited = false;
let syncFileId = null;

const SYNC_FILENAME = "deadryx_sync_data.json";

function gapiLoaded() {
  gapi.load('client', intializeGapiClient);
}

async function intializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    const btn = document.getElementById("gdriveConnectBtn");
    if (btn) btn.disabled = false;

    // Check if we have an existing token
    let token = gapi.client.getToken();
    if (!token) {
      try {
        const saved = localStorage.getItem("gdrive_access_token");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Date.now() < parsed.expires_at) {
            gapi.client.setToken({ access_token: parsed.access_token });
            token = gapi.client.getToken();
          } else {
            localStorage.removeItem("gdrive_access_token");
          }
        }
      } catch (e) {
        console.error("Error reading saved token", e);
      }
    }

    if (token) {
      updateSyncStatus("Connected");
      fetchUserInfo();
      fetchAndSyncFromDrive();
    }
  }
}

function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    
    // Save token to localStorage
    localStorage.setItem("gdrive_access_token", JSON.stringify({
      access_token: resp.access_token,
      expires_at: Date.now() + (resp.expires_in * 1000)
    }));

    document.getElementById("gdriveConnectBtn").style.display = "none";
    document.getElementById("gdriveDisconnectBtn").style.display = "inline-flex";
    updateSyncStatus("Connected");
    await fetchUserInfo();
    await fetchAndSyncFromDrive();
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    localStorage.removeItem("gdrive_access_token");
    document.getElementById("gdriveConnectBtn").style.display = "inline-flex";
    document.getElementById("gdriveDisconnectBtn").style.display = "none";

    // Hide profile info
    const profileDiv = document.getElementById("gdriveProfileInfo");
    if (profileDiv) profileDiv.style.display = "none";

    updateSyncStatus("Disconnected");
    syncFileId = null;
  }
}

async function fetchUserInfo() {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }
    });
    if (res.ok) {
      const data = await res.json();
      const profileDiv = document.getElementById("gdriveProfileInfo");
      if (profileDiv) {
        profileDiv.style.display = "flex";
        document.getElementById("gdriveProfileName").textContent = data.name || "User";
        if (data.picture) {
          document.getElementById("gdriveProfilePic").src = data.picture;
        }
      }
      document.getElementById("gdriveConnectBtn").style.display = "none";
      document.getElementById("gdriveDisconnectBtn").style.display = "inline-flex";
    }
  } catch (err) {
    console.error("Failed to fetch user info", err);
  }
}

function updateSyncStatus(msg) {
  const statusEl = document.getElementById("syncStatusMsg");
  if (statusEl) statusEl.textContent = msg;
}

// Transform app state -> Drive format
function getDriveStructuredData() {
  // Muscle -> Exercise -> Date -> Sets
  const structured = {};

  // Try to load exercises to map muscles
  let allExercises = [];
  try {
    if (typeof exerciseSource !== 'undefined') {
      allExercises = [...exerciseSource];
    }
    const customEx = JSON.parse(localStorage.getItem("deadryx-custom-exercises-v1")) || [];
    allExercises = [...allExercises, ...customEx];
  } catch (e) {
    console.error(e);
  }

  const muscleMap = {};
  allExercises.forEach(ex => {
    muscleMap[ex.name] = ex.muscle || "Other";
  });

  const historicalLog = JSON.parse(localStorage.getItem("deadryx-historical-log-v1")) || {};

  for (const date in historicalLog) {
    const exercisesForDate = historicalLog[date];
    for (const exName in exercisesForDate) {
      const muscle = muscleMap[exName] || "Other";
      if (!structured[muscle]) structured[muscle] = {};
      if (!structured[muscle][exName]) structured[muscle][exName] = {};
      structured[muscle][exName][date] = exercisesForDate[exName];
    }
  }

  // We also bundle other app state under a special _appState key so we don't lose config
  const appState = {};
  const BACKUP_KEYS = [
    "deadryx-workout-history-v1",
    "deadryx-attendance-v1",
    "deadryx-custom-exercises-v1",
    "deadryx-hidden-exercises-v1",
    "deadryx-split-config-v1",
    "deadryx-targets-v1",
    "deadryx-notes-v1",
    "deadryx-pr-records-v1",
    "deadryx-theme-v1"
  ];

  BACKUP_KEYS.forEach(k => {
    const val = localStorage.getItem(k);
    if (val) appState[k] = val;
  });

  return {
    _meta: { version: 1, lastSync: new Date().toISOString() },
    workoutData: structured,
    _appState: appState
  };
}

// Transform Drive format -> app state
function processDriveDataAndSaveLocal(driveData) {
  if (!driveData || !driveData.workoutData) return;

  const localHistoricalLog = JSON.parse(localStorage.getItem("deadryx-historical-log-v1")) || {};

  // Merge Drive data into local
  const wData = driveData.workoutData;
  for (const muscle in wData) {
    for (const exName in wData[muscle]) {
      for (const date in wData[muscle][exName]) {
        if (!localHistoricalLog[date]) localHistoricalLog[date] = {};
        // Last write wins per exercise-date
        localHistoricalLog[date][exName] = wData[muscle][exName][date];
      }
    }
  }

  localStorage.setItem("deadryx-historical-log-v1", JSON.stringify(localHistoricalLog));

  // Restore app state
  if (driveData._appState) {
    for (const k in driveData._appState) {
      localStorage.setItem(k, driveData._appState[k]);
    }
  }
}

async function findSyncFile() {
  try {
    const response = await gapi.client.drive.files.list({
      q: `name='${SYNC_FILENAME}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }
    return null;
  } catch (err) {
    console.error("Error finding sync file", err);
    return null;
  }
}

async function fetchAndSyncFromDrive() {
  updateSyncStatus("Syncing...");
  try {
    syncFileId = await findSyncFile();
    if (syncFileId) {
      const response = await gapi.client.drive.files.get({
        fileId: syncFileId,
        alt: 'media'
      });
      const data = response.result;
      processDriveDataAndSaveLocal(data);
      updateSyncStatus("Synced: " + new Date().toLocaleTimeString());

      // Refresh UI if functions are available
      if (typeof renderCalendar === 'function') renderCalendar();
      if (typeof updateStatsPanels === 'function') updateStatsPanels();
    } else {
      updateSyncStatus("No cloud data. Will create on save.");
    }
  } catch (err) {
    console.error(err);
    updateSyncStatus("Sync Error");
  }
}

async function uploadToDrive() {
  if (!gapi.client.getToken()) return; // Not logged in

  updateSyncStatus("Uploading...");
  try {
    const fileContent = JSON.stringify(getDriveStructuredData(), null, 2);
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = {
      name: SYNC_FILENAME,
      mimeType: 'application/json'
    };

    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (!syncFileId) {
      syncFileId = await findSyncFile();
    }

    if (syncFileId) {
      url = `https://www.googleapis.com/upload/drive/v3/files/${syncFileId}?uploadType=multipart`;
      method = 'PATCH';
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const res = await fetch(url, {
      method: method,
      headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
      body: form
    });

    if (res.ok) {
      const data = await res.json();
      syncFileId = data.id;
      updateSyncStatus("Synced: " + new Date().toLocaleTimeString());
    } else {
      updateSyncStatus("Upload Error");
    }
  } catch (err) {
    console.error(err);
    updateSyncStatus("Upload Error");
  }
}

// ================== AUTO-SYNC ON RECONNECT ==================
window.addEventListener('online', () => {
  if (localStorage.getItem("gdrive_access_token") && gapi.client && gapi.client.getToken()) {
    console.log("Internet reconnected. Syncing to Drive...");
    uploadToDrive();
  }
});
