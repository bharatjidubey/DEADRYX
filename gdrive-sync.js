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
let memoriesFolderId = null;

const SYNC_FILENAME = "deadryx_sync_data.json";
const MEMORIES_FOLDER_NAME = "DEADRYX_Memories";

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

    const connectBtn = document.getElementById("gdriveConnectBtn");
    if (connectBtn) connectBtn.style.display = "none";
    const disconnectBtn = document.getElementById("gdriveDisconnectBtn");
    if (disconnectBtn) disconnectBtn.style.display = "inline-flex";

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

    const connectBtn = document.getElementById("gdriveConnectBtn");
    if (connectBtn) connectBtn.style.display = "inline-flex";
    const disconnectBtn = document.getElementById("gdriveDisconnectBtn");
    if (disconnectBtn) disconnectBtn.style.display = "none";

    // Hide profile info
    const profileDiv = document.getElementById("gdriveProfileInfo");
    if (profileDiv) profileDiv.style.display = "none";

    updateSyncStatus("Disconnected");
    syncFileId = null;
    memoriesFolderId = null;
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
        const profileName = document.getElementById("gdriveProfileName");
        if (profileName) profileName.textContent = data.name || "User";
        const profilePic = document.getElementById("gdriveProfilePic");
        if (profilePic && data.picture) {
          profilePic.src = data.picture;
        }
      }
      const connectBtn = document.getElementById("gdriveConnectBtn");
      if (connectBtn) connectBtn.style.display = "none";
      const disconnectBtn = document.getElementById("gdriveDisconnectBtn");
      if (disconnectBtn) disconnectBtn.style.display = "inline-flex";
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
    "deadryx-theme-v1",
    "deadryx-media-sync-v1",
    "deadryx-bmi-history-v1",
    "deadryx-bmi-profile-v1",
    "deadryx-bmi-target-v1",
    "deadryx-exercise-order-v1",
    "deadryx-last-write-v1"
  ];

  BACKUP_KEYS.forEach(k => {
    const val = localStorage.getItem(k);
    if (val) appState[k] = val;
  });

  const syncTime = new Date().toISOString();
  localStorage.setItem("deadryx-last-write-v1", syncTime);
  appState["deadryx-last-write-v1"] = syncTime;

  return {
    _meta: { version: 1, lastSync: syncTime },
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

// ================== MEMORIES MEDIA SYNC ==================

/**
 * Find or create the DEADRYX_Memories folder in Google Drive.
 */
async function getOrCreateMemoriesFolder() {
  if (memoriesFolderId) return memoriesFolderId;

  try {
    // Search for existing folder
    const response = await gapi.client.drive.files.list({
      q: `name='${MEMORIES_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    const files = response.result.files;
    if (files && files.length > 0) {
      memoriesFolderId = files[0].id;
      return memoriesFolderId;
    }

    // Create the folder
    const createRes = await gapi.client.drive.files.create({
      resource: {
        name: MEMORIES_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });

    memoriesFolderId = createRes.result.id;
    return memoriesFolderId;
  } catch (err) {
    console.error("Error getting/creating memories folder", err);
    return null;
  }
}

/**
 * Get the media sync map from localStorage.
 * Maps: { "timestamp": { driveFileId, type, dateStr, fileName } }
 */
function getMediaSyncMap() {
  try {
    return JSON.parse(localStorage.getItem("deadryx-media-sync-v1")) || {};
  } catch (e) {
    return {};
  }
}

function saveMediaSyncMap(map) {
  localStorage.setItem("deadryx-media-sync-v1", JSON.stringify(map));
}

/**
 * Upload all un-synced local memories to Google Drive.
 */
async function uploadMemoriesToDrive() {
  if (!gapi.client.getToken()) return;
  if (!window.MemoriesDB) {
    console.warn("MemoriesDB not available yet. Skipping media upload.");
    return;
  }

  try {
    const folderId = await getOrCreateMemoriesFolder();
    if (!folderId) return;

    const allMedia = await window.MemoriesDB.getAllMedia();
    const syncMap = getMediaSyncMap();
    let uploaded = 0;

    for (const item of allMedia) {
      const tsKey = String(item.timestamp);

      // Skip if already synced
      if (syncMap[tsKey]) continue;

      try {
        const ext = item.type === 'video' ? 'mp4' : (item.file.type === 'image/png' ? 'png' : 'jpg');
        const fileName = `memory_${tsKey}.${ext}`;

        const metadata = {
          name: fileName,
          parents: [folderId],
          mimeType: item.file.type
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', item.file);

        const res = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
          {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + gapi.client.getToken().access_token },
            body: form
          }
        );

        if (res.ok) {
          const data = await res.json();
          syncMap[tsKey] = {
            driveFileId: data.id,
            type: item.type,
            dateStr: item.dateStr,
            fileName: fileName,
            mimeType: item.file.type
          };
          uploaded++;
        } else {
          console.error("Failed to upload memory:", fileName, res.status);
        }
      } catch (uploadErr) {
        console.error("Error uploading memory:", tsKey, uploadErr);
      }
    }

    if (uploaded > 0) {
      saveMediaSyncMap(syncMap);
      console.log(`Uploaded ${uploaded} memories to Google Drive.`);
      // Also update the main sync file so the sync map is backed up
      await uploadToDriveInternal();
    }
  } catch (err) {
    console.error("Error in uploadMemoriesToDrive:", err);
  }
}

// Expose globally so memories.js can trigger it
window.uploadMemoriesToDrive = uploadMemoriesToDrive;

/**
 * Download memories from Google Drive that are missing locally.
 */
async function downloadMemoriesFromDrive() {
  if (!gapi.client.getToken()) return;
  if (!window.MemoriesDB) {
    console.warn("MemoriesDB not available yet. Skipping media download.");
    return;
  }

  try {
    const syncMap = getMediaSyncMap();
    const syncedTimestamps = Object.keys(syncMap);

    if (syncedTimestamps.length === 0) return;

    // Get all local media timestamps to see what's missing
    const localMedia = await window.MemoriesDB.getAllMedia();
    const localTimestamps = new Set(localMedia.map(m => String(m.timestamp)));

    let downloaded = 0;

    for (const tsKey of syncedTimestamps) {
      // Skip if already exists locally
      if (localTimestamps.has(tsKey)) continue;

      const syncEntry = syncMap[tsKey];

      try {
        // Download the file content from Drive
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${syncEntry.driveFileId}?alt=media`,
          {
            headers: { 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }
          }
        );

        if (res.ok) {
          const blob = await res.blob();
          // Reconstruct the file as a Blob with the correct MIME type
          const file = new Blob([blob], { type: syncEntry.mimeType || (syncEntry.type === 'video' ? 'video/mp4' : 'image/jpeg') });

          // Save to IndexedDB with original timestamp and date string
          await window.MemoriesDB.saveMedia({
            file: file,
            type: syncEntry.type,
            timestamp: parseInt(tsKey),
            dateStr: syncEntry.dateStr
          });

          downloaded++;
        } else if (res.status === 404) {
          // File was deleted from Drive, remove from sync map
          console.warn("Memory file not found on Drive, removing from sync map:", syncEntry.fileName);
          delete syncMap[tsKey];
        } else {
          console.error("Failed to download memory:", syncEntry.fileName, res.status);
        }
      } catch (dlErr) {
        console.error("Error downloading memory:", tsKey, dlErr);
      }
    }

    if (downloaded > 0) {
      saveMediaSyncMap(syncMap);
      console.log(`Downloaded ${downloaded} memories from Google Drive.`);
      // Re-render the timeline if available
      if (window.MemoriesDB.renderTimeline) {
        await window.MemoriesDB.renderTimeline();
      }
    }
  } catch (err) {
    console.error("Error in downloadMemoriesFromDrive:", err);
  }
}

// ================== MAIN SYNC FUNCTIONS ==================

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
      
      // Conflict check: Last-Write-Wins
      const localWriteTime = localStorage.getItem("deadryx-last-write-v1");
      const cloudSyncTime = data?._meta?.lastSync;
      
      if (localWriteTime && cloudSyncTime && new Date(localWriteTime) > new Date(cloudSyncTime)) {
        console.log("Local changes are newer than Drive. Uploading instead of downloading.");
        await performUploadToDrive();
      } else {
        processDriveDataAndSaveLocal(data);
        updateSyncStatus("Synced: " + new Date().toLocaleTimeString());

        // Refresh UI if functions are available on the current page
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderSidebarSplit === 'function') renderSidebarSplit();
        if (typeof renderWorkoutDay === 'function') renderWorkoutDay();
        if (typeof renderAttendance === 'function') renderAttendance();
        if (typeof renderBMIPanel === 'function') renderBMIPanel();
        if (typeof initNotes === 'function') initNotes();
        if (typeof renderChart === 'function') renderChart(typeof currentViewMode !== 'undefined' ? currentViewMode : "thisYear");
        if (typeof updateStatsPanels === 'function') updateStatsPanels();

        // Download any memories from Drive that are missing locally
        await downloadMemoriesFromDrive();
      }
    } else {
      updateSyncStatus("No cloud data. Will create on save.");
    }
  } catch (err) {
    console.error(err);
    updateSyncStatus("Sync Error");
  }
}

/**
 * Internal upload function that doesn't trigger media sync (to avoid infinite loop).
 */
async function uploadToDriveInternal() {
  if (!gapi.client.getToken()) return;

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
    }
  } catch (err) {
    console.error("uploadToDriveInternal error:", err);
  }
}

let debounceUploadTimeout = null;

async function uploadToDrive() {
  if (!gapi.client.getToken()) return; // Not logged in

  updateSyncStatus("Sync pending...");

  if (debounceUploadTimeout) {
    clearTimeout(debounceUploadTimeout);
  }

  debounceUploadTimeout = setTimeout(async () => {
    await performUploadToDrive();
  }, 2500);
}

async function performUploadToDrive() {
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

      // Also upload any un-synced memories
      await uploadMemoriesToDrive();
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
    fetchAndSyncFromDrive();
  }
});
