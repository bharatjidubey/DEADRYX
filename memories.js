// memories.js - Handling IndexedDB for media storage

const DB_NAME = "FitnessMemoriesDB";
const DB_VERSION = 1;
const STORE_NAME = "mediaStore";

// Size limits
const MAX_IMAGE_SIZE_MB = 8;
const MAX_VIDEO_SIZE_MB = 25;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024;

let db;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error: " + event.target.errorCode);
      reject(event.target.errorCode);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
};

/**
 * Save media to IndexedDB.
 * Accepts either a raw File object or a pre-built media object (from Drive download).
 * Pre-built objects must have: { file, type, timestamp, dateStr }
 */
const saveMedia = (fileOrObj) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    let mediaObj;

    // If it's a pre-built object (from Drive sync), use it directly
    if (fileOrObj.timestamp && fileOrObj.dateStr && fileOrObj.type) {
      mediaObj = {
        file: fileOrObj.file,
        type: fileOrObj.type,
        timestamp: fileOrObj.timestamp,
        dateStr: fileOrObj.dateStr
      };
    } else {
      // It's a raw File object from user upload
      mediaObj = {
        file: fileOrObj,
        type: fileOrObj.type.startsWith('video') ? 'video' : 'image',
        timestamp: new Date().getTime(),
        dateStr: new Date().toLocaleString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      };
    }

    const request = store.add(mediaObj);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAllMedia = () => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

const renderTimeline = async () => {
  const container = document.getElementById('mediaTimeline');
  if (!container) return;
  container.innerHTML = '';

  try {
    const items = await getAllMedia();

    if (items.length === 0) {
      container.innerHTML = `<p class="muted-text">No memories uploaded yet.</p>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'media-card';

      const fileUrl = URL.createObjectURL(item.file);

      let mediaNode = '';
      if (item.type === 'video') {
        mediaNode = `<video src="${fileUrl}" controls preload="metadata"></video>`;
      } else {
        mediaNode = `<img src="${fileUrl}" alt="Workout Memory" loading="lazy">`;
      }

      card.innerHTML = `
        ${mediaNode}
        <div class="media-timestamp">${item.dateStr}</div>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Failed to load media", error);
  }
};

// Expose DB functions globally so gdrive-sync.js can access them
window.MemoriesDB = {
  initDB,
  saveMedia,
  getAllMedia,
  renderTimeline
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initDB();
    await renderTimeline();
  } catch (err) {
    console.error("Failed to init DB", err);
  }

  const uploadInput = document.getElementById('mediaUpload');
  if (uploadInput) {
    uploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const validTypes = ['image/png', 'image/jpeg', 'video/mp4'];
      if (!validTypes.includes(file.type)) {
        alert("Invalid file type. Please upload PNG, JPEG, or MP4.");
        return;
      }

      // File size validation
      const isVideo = file.type.startsWith('video');
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      const maxSizeMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;

      if (file.size > maxSize) {
        alert(`File too large! Maximum size for ${isVideo ? 'videos' : 'images'} is ${maxSizeMB} MB.\nYour file: ${(file.size / (1024 * 1024)).toFixed(1)} MB.`);
        uploadInput.value = '';
        return;
      }

      const btn = document.querySelector('button[onclick*="mediaUpload"]');
      const originalText = btn ? btn.innerText : '';
      if (btn) {
        btn.innerText = "Saving...";
        btn.disabled = true;
      }

      try {
        await saveMedia(file);
        await renderTimeline();

        // Trigger Google Drive upload if connected
        if (typeof window.uploadMemoriesToDrive === 'function') {
          window.uploadMemoriesToDrive();
        }
      } catch (err) {
        console.error("Failed to save media", err);
        alert("Failed to save media. It might be too large or there might be an issue with storage.");
      } finally {
        if (btn) {
          btn.innerText = originalText;
          btn.disabled = false;
        }
      }

      uploadInput.value = '';
    });
  }
});