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

// ==========================================
// Upload Toast Notification System
// ==========================================

let toastTimeout = null;

const getOrCreateToast = () => {
  let toast = document.getElementById('uploadToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'uploadToast';
    toast.className = 'upload-toast';
    toast.innerHTML = `
      <div class="upload-toast-body">
        <div class="upload-toast-icon"></div>
        <div class="upload-toast-info">
          <p class="upload-toast-title"></p>
          <p class="upload-toast-subtitle"></p>
        </div>
      </div>
      <div class="upload-toast-progress">
        <div class="upload-toast-progress-bar"></div>
      </div>
    `;
    document.body.appendChild(toast);
  }
  return toast;
};

const showUploadToast = (state, title, subtitle, progressPercent) => {
  const toast = getOrCreateToast();
  const iconEl = toast.querySelector('.upload-toast-icon');
  const titleEl = toast.querySelector('.upload-toast-title');
  const subtitleEl = toast.querySelector('.upload-toast-subtitle');
  const progressBar = toast.querySelector('.upload-toast-progress-bar');

  // Clear previous timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  // Remove old state classes
  toast.classList.remove('uploading', 'success', 'error');
  toast.classList.add(state);

  // Set icon based on state
  if (state === 'uploading') {
    iconEl.innerHTML = '<div class="upload-spinner"></div>';
  } else if (state === 'success') {
    iconEl.innerHTML = `<div class="upload-checkmark"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>`;
  } else if (state === 'error') {
    iconEl.innerHTML = '<span class="upload-error-icon">✕</span>';
  }

  titleEl.textContent = title;
  subtitleEl.textContent = subtitle;

  if (typeof progressPercent === 'number') {
    progressBar.style.width = progressPercent + '%';
  }

  // Show toast
  toast.classList.add('show');

  // Auto-hide after success/error
  if (state === 'success' || state === 'error') {
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
};

const hideUploadToast = () => {
  const toast = document.getElementById('uploadToast');
  if (toast) {
    toast.classList.remove('show');
  }
};

// ==========================================
// Lightbox System
// ==========================================

const getOrCreateLightbox = () => {
  let lb = document.getElementById('mediaLightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'mediaLightbox';
    lb.className = 'media-lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" aria-label="Close lightbox">✕</button>
      <div class="lightbox-date"></div>
    `;
    document.body.appendChild(lb);

    // Close on click background or close button
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) {
        closeLightbox();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }
  return lb;
};

const openLightbox = (src, type, dateStr) => {
  const lb = getOrCreateLightbox();
  const dateEl = lb.querySelector('.lightbox-date');

  // Remove any old media
  const oldMedia = lb.querySelector('img, video');
  if (oldMedia) oldMedia.remove();

  let mediaEl;
  if (type === 'video') {
    mediaEl = document.createElement('video');
    mediaEl.src = src;
    mediaEl.controls = true;
    mediaEl.autoplay = true;
  } else {
    mediaEl = document.createElement('img');
    mediaEl.src = src;
    mediaEl.alt = 'Workout Memory - Full Size';
  }

  // Insert before the date element
  lb.insertBefore(mediaEl, dateEl);
  dateEl.textContent = dateStr || '';

  // Activate
  requestAnimationFrame(() => {
    lb.classList.add('active');
  });

  // Lock body scroll
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  const lb = document.getElementById('mediaLightbox');
  if (!lb) return;

  lb.classList.remove('active');
  document.body.style.overflow = '';

  // Pause video if playing
  const vid = lb.querySelector('video');
  if (vid) vid.pause();

  // Remove media after transition
  setTimeout(() => {
    const media = lb.querySelector('img, video');
    if (media) media.remove();
  }, 350);
};

// ==========================================
// Timeline Rendering
// ==========================================

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

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.style.animationDelay = `${index * 0.06}s`;

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

      // Open lightbox on click (for images, click anywhere; for videos, only on timestamp)
      if (item.type === 'video') {
        const timestamp = card.querySelector('.media-timestamp');
        timestamp.style.cursor = 'pointer';
        timestamp.addEventListener('click', () => openLightbox(fileUrl, 'video', item.dateStr));
      } else {
        card.addEventListener('click', () => openLightbox(fileUrl, 'image', item.dateStr));
      }

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
        showUploadToast('error', 'Invalid File Type', 'Please upload PNG, JPEG, or MP4.');
        uploadInput.value = '';
        return;
      }

      // File size validation
      const isVideo = file.type.startsWith('video');
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      const maxSizeMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;

      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        showUploadToast('error', 'File Too Large', `Max ${maxSizeMB} MB allowed. Yours: ${fileSizeMB} MB`);
        uploadInput.value = '';
        return;
      }

      const fileSizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const fileNameStr = file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name;

      // Show uploading state
      showUploadToast('uploading', `Saving "${fileNameStr}"`, `${fileSizeStr} · Processing...`, 30);

      const btn = document.querySelector('button[onclick*="mediaUpload"]');
      const originalText = btn ? btn.innerText : '';
      if (btn) {
        btn.innerText = "Saving...";
        btn.disabled = true;
      }

      try {
        // Simulate progress stages
        showUploadToast('uploading', `Saving "${fileNameStr}"`, `${fileSizeStr} · Writing to storage...`, 60);

        await saveMedia(file);

        showUploadToast('uploading', `Saving "${fileNameStr}"`, `${fileSizeStr} · Rendering timeline...`, 85);

        await renderTimeline();

        // Show success
        showUploadToast('success', 'Upload Successful!', `"${fileNameStr}" saved to memories`, 100);

        // Trigger Google Drive upload if connected
        if (typeof window.uploadMemoriesToDrive === 'function') {
          window.uploadMemoriesToDrive();
        }
      } catch (err) {
        console.error("Failed to save media", err);
        showUploadToast('error', 'Upload Failed', 'Storage error. The file may be too large.');
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