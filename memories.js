// memories.js - Handling IndexedDB for media storage

const DB_NAME = "FitnessMemoriesDB";
const DB_VERSION = 1;
const STORE_NAME = "mediaStore";

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

const saveMedia = (file) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const mediaObj = {
      file: file,
      type: file.type.startsWith('video') ? 'video' : 'image',
      timestamp: new Date().getTime(),
      dateStr: new Date().toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    };

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

      const btn = document.querySelector('button[onclick*="mediaUpload"]');
      const originalText = btn ? btn.innerText : '';
      if (btn) {
        btn.innerText = "Saving...";
        btn.disabled = true;
      }

      try {
        await saveMedia(file);
        await renderTimeline();
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