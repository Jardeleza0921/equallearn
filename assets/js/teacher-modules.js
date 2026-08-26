import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, getDoc, deleteDoc, doc, updateDoc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-storage.js";

const $ = (id) => document.getElementById(id);
const moduleList = $("moduleList");
const modal = $("moduleModal");
const openModal = $("openModal");
const closeModal = $("closeModal");
const cancelEdit = $("cancelEdit");
const saveModule = $("saveModule");
const title = $("title");
const description = $("description");
const moduleOrder = $("moduleOrder");
const moduleStatus = $("moduleStatus");
const moduleFile = $("moduleFile");
const existingFile = $("existingFile");
const selectedFile = $("selectedFile");
const modalTitle = $("modalTitle");
const message = $("message");
const uploadProgress = $("uploadProgress");
const progressBar = $("progressBar");
const progressText = $("progressText");

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MODULE_CACHE_KEY = "equallearn:teacher:modules:v2";
const moduleCache = new Map();
let editingId = null;
let currentFileURL = "";
let currentFilePath = "";
let currentFileName = "";
let activeUploadTask = null;
let uploadStartedAt = 0;
let lastProgressBytes = 0;
let lastProgressTime = 0;

const cancelUpload = document.createElement("button");
cancelUpload.type = "button";
cancelUpload.className = "el-upload-cancel";
cancelUpload.textContent = "Cancel upload";
cancelUpload.hidden = true;
uploadProgress?.appendChild(cancelUpload);
cancelUpload.addEventListener("click", () => activeUploadTask?.cancel());

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }
  renderCachedModules();
  loadModules();
});

openModal?.addEventListener("click", () => {
  resetForm();
  modalTitle.textContent = "Add Module";
  modal.classList.add("show");
  requestAnimationFrame(() => title.focus());
});

closeModal?.addEventListener("click", closeEditor);
cancelEdit?.addEventListener("click", closeEditor);
modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeEditor();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal?.classList.contains("show")) closeEditor();
});

moduleFile?.addEventListener("change", () => {
  const file = moduleFile.files?.[0];
  if (!file) {
    selectedFile.style.display = "none";
    return;
  }
  try {
    validateFile(file);
    selectedFile.style.display = "block";
    selectedFile.innerHTML = `<strong>${escapeHTML(file.name)}</strong><br><small>${formatFileSize(file.size)} • ready to upload</small>`;
    showMessage("File ready. It will upload when you save the module.", "info");
  } catch (error) {
    moduleFile.value = "";
    selectedFile.style.display = "none";
    showMessage(error.message, "error");
  }
});

saveModule?.addEventListener("click", async () => {
  const moduleTitle = title.value.trim();
  const moduleDescription = description.value.trim();
  const order = Number(moduleOrder.value);
  const status = moduleStatus.value;
  const file = moduleFile.files?.[0] || null;

  if (!moduleTitle) return showMessage("Please enter a module title.", "error");
  if (!moduleDescription) return showMessage("Please enter a description.", "error");
  if (!Number.isFinite(order) || order < 1) return showMessage("Please enter a valid display order.", "error");
  if (file) {
    try { validateFile(file); } catch (error) { return showMessage(error.message, "error"); }
  }

  setEditorBusy(true, file ? "Preparing upload…" : "Saving module…");
  const oldFilePath = currentFilePath;

  try {
    let fileURL = currentFileURL;
    let filePath = currentFilePath;
    let fileName = currentFileName;

    if (file) {
      const result = await uploadModuleFile(file);
      fileURL = result.url;
      filePath = result.path;
      fileName = file.name;
    }

    const payload = {
      title: moduleTitle,
      description: moduleDescription,
      order,
      status,
      fileURL: fileURL || "",
      filePath: filePath || "",
      fileName: fileName || "",
      updatedAt: serverTimestamp()
    };

    let savedId = editingId;
    if (editingId) {
      await updateDoc(doc(db, "modules", editingId), payload);
    } else {
      const created = await addDoc(collection(db, "modules"), {
        ...payload,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      savedId = created.id;
    }

    // Optimistic local update = instant list refresh while Firestore refreshes in background.
    moduleCache.set(savedId, { id: savedId, ...payload, updatedAt: Date.now() });
    saveModuleCache();
    renderModules([...moduleCache.values()].sort(sortModules));

    if (file && oldFilePath && oldFilePath !== filePath) {
      deleteObject(ref(storage, oldFilePath)).catch((error) => console.warn("Old module file cleanup skipped:", error));
    }

    showMessage(editingId ? "Module updated successfully." : "Module added successfully.", "success");
    modal.classList.remove("show");
    resetForm();
    loadModules({ quiet: true });
  } catch (error) {
    console.error("Module save error:", error);
    showMessage(readableUploadError(error), "error");
  } finally {
    activeUploadTask = null;
    setEditorBusy(false);
  }
});

async function uploadModuleFile(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `modules/${auth.currentUser.uid}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "application/octet-stream",
    customMetadata: { originalName: file.name }
  });
  activeUploadTask = task;
  uploadStartedAt = performance.now();
  lastProgressTime = uploadStartedAt;
  lastProgressBytes = 0;
  showUploadPanel(true);

  return new Promise((resolve, reject) => {
    task.on("state_changed", (snapshot) => {
      updateUploadProgress(snapshot.bytesTransferred, snapshot.totalBytes);
    }, reject, async () => {
      try {
        progressBar.style.width = "100%";
        progressText.textContent = "Upload complete. Saving module…";
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      } catch (error) { reject(error); }
    });
  });
}

function updateUploadProgress(bytes, total) {
  const now = performance.now();
  const percent = total ? Math.min(100, (bytes / total) * 100) : 0;
  const totalSeconds = Math.max((now - uploadStartedAt) / 1000, .25);
  const averageRate = bytes / totalSeconds;
  const intervalSeconds = Math.max((now - lastProgressTime) / 1000, .05);
  const instantRate = (bytes - lastProgressBytes) / intervalSeconds;
  const rate = instantRate > 0 ? (averageRate * .55 + instantRate * .45) : averageRate;
  const remaining = Math.max(total - bytes, 0);
  const eta = rate > 0 ? remaining / rate : 0;

  progressBar.style.width = `${percent.toFixed(1)}%`;
  progressText.textContent = `${Math.round(percent)}% • ${formatFileSize(bytes)} of ${formatFileSize(total)} • ${formatRate(rate)}${eta > 1 ? ` • ${formatEta(eta)} left` : ""}`;
  saveModule.textContent = percent < 100 ? `Uploading ${Math.round(percent)}%` : "Saving module…";
  lastProgressBytes = bytes;
  lastProgressTime = now;
}

async function loadModules({ quiet = false } = {}) {
  if (!quiet && moduleCache.size === 0) {
    moduleList.innerHTML = `<div class="loading"><span class="el-inline-spinner"></span><strong>Loading modules…</strong><small>Syncing the latest content</small></div>`;
  }
  try {
    const snapshot = await getDocs(query(collection(db, "modules"), orderBy("order", "asc")));
    moduleCache.clear();
    snapshot.forEach((item) => moduleCache.set(item.id, { id: item.id, ...item.data() }));
    saveModuleCache();
    renderModules([...moduleCache.values()]);
  } catch (error) {
    console.error("Load modules error:", error);
    if (moduleCache.size === 0) {
      moduleList.innerHTML = `<div class="empty">Unable to load modules.<br><small>${escapeHTML(error.message)}</small></div>`;
    }
  }
}

function renderCachedModules() {
  try {
    const cached = JSON.parse(localStorage.getItem(MODULE_CACHE_KEY) || "[]");
    if (!Array.isArray(cached) || !cached.length) return;
    cached.forEach((item) => item?.id && moduleCache.set(item.id, item));
    renderModules([...moduleCache.values()].sort(sortModules), true);
  } catch (_) {}
}

function saveModuleCache() {
  try {
    const safe = [...moduleCache.values()].map(({ id, title, description, order, status, fileURL, filePath, fileName }) => ({
      id, title, description, order, status, fileURL, filePath, fileName
    }));
    localStorage.setItem(MODULE_CACHE_KEY, JSON.stringify(safe));
  } catch (_) {}
}

function renderModules(items, fromCache = false) {
  const sorted = [...items].sort(sortModules);
  if (!sorted.length) {
    moduleList.innerHTML = `<div class="empty"><strong>No modules yet.</strong><br><small>Click + Add Module to create one.</small></div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  sorted.forEach((data) => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.dataset.id = data.id;
    const fileHTML = data.fileURL ? `
      <a class="file-link" href="${escapeAttribute(data.fileURL)}" target="_blank" rel="noopener noreferrer">
        <span class="file-icon">↗</span><span><strong>${escapeHTML(data.fileName || "Open Module File")}</strong><br><small>Open attachment</small></span>
      </a>` : "";
    card.innerHTML = `
      <div class="module-top"><h3 class="module-title">${escapeHTML(data.title || "Untitled Module")}</h3><span class="status ${escapeAttribute(data.status || "draft")}">${escapeHTML(data.status || "draft")}</span></div>
      <p class="module-description">${escapeHTML(data.description || "No description.")}</p>
      ${fileHTML}
      <div class="module-info">Display order <strong>${Number(data.order) || "-"}</strong>${fromCache ? '<span class="el-cache-label">cached</span>' : ""}</div>
      <div class="module-actions"><button class="edit-btn" data-action="edit">Edit</button><button class="delete-btn" data-action="delete">Delete</button></div>`;
    fragment.appendChild(card);
  });
  moduleList.replaceChildren(fragment);
}

moduleList?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest(".module-card");
  if (!card?.dataset.id) return;
  if (button.dataset.action === "edit") editModule(card.dataset.id);
  if (button.dataset.action === "delete") deleteModule(card.dataset.id);
});

async function editModule(id) {
  try {
    let selectedData = moduleCache.get(id);
    if (!selectedData) {
      const snap = await getDoc(doc(db, "modules", id));
      if (!snap.exists()) throw new Error("Module not found.");
      selectedData = { id: snap.id, ...snap.data() };
      moduleCache.set(id, selectedData);
    }
    editingId = id;
    title.value = selectedData.title || "";
    description.value = selectedData.description || "";
    moduleOrder.value = selectedData.order || "";
    moduleStatus.value = selectedData.status || "active";
    currentFileURL = selectedData.fileURL || "";
    currentFilePath = selectedData.filePath || "";
    currentFileName = selectedData.fileName || "";
    selectedFile.style.display = "none";

    if (currentFileURL) {
      existingFile.style.display = "block";
      existingFile.innerHTML = `<strong>Current attachment</strong><br>${escapeHTML(currentFileName || "Attached file")}<br><a href="${escapeAttribute(currentFileURL)}" target="_blank" rel="noopener noreferrer">Open file →</a><br><small>Select a new file only if you want to replace it.</small>`;
    } else {
      existingFile.style.display = "none";
    }
    modalTitle.textContent = "Edit Module";
    modal.classList.add("show");
    requestAnimationFrame(() => title.focus());
  } catch (error) {
    console.error(error);
    alert(error.message || "Unable to load module.");
  }
}
window.editModule = editModule;

async function deleteModule(id) {
  const data = moduleCache.get(id);
  if (!confirm(`Delete "${data?.title || "this module"}"?`)) return;
  try {
    let target = data;
    if (!target) {
      const snap = await getDoc(doc(db, "modules", id));
      target = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
    await deleteDoc(doc(db, "modules", id));
    moduleCache.delete(id);
    saveModuleCache();
    renderModules([...moduleCache.values()]);
    if (target?.filePath) deleteObject(ref(storage, target.filePath)).catch((error) => console.warn("Storage cleanup skipped:", error));
  } catch (error) {
    console.error("Delete module error:", error);
    alert(error.message || "Unable to delete module.");
  }
}
window.deleteModule = deleteModule;

function closeEditor() {
  if (activeUploadTask) {
    if (!confirm("An upload is still running. Cancel the upload and close?")) return;
    activeUploadTask.cancel();
  }
  modal.classList.remove("show");
  resetForm();
}

function resetForm() {
  editingId = null;
  currentFileURL = "";
  currentFilePath = "";
  currentFileName = "";
  title.value = "";
  description.value = "";
  moduleOrder.value = "";
  moduleStatus.value = "active";
  moduleFile.value = "";
  existingFile.style.display = "none";
  existingFile.innerHTML = "";
  selectedFile.style.display = "none";
  selectedFile.innerHTML = "";
  showUploadPanel(false);
  progressBar.style.width = "0%";
  progressText.textContent = "Ready to upload";
  message.textContent = "";
  message.className = "message";
  activeUploadTask = null;
  setEditorBusy(false);
}

function setEditorBusy(busy, label = "Saving…") {
  saveModule.disabled = busy;
  moduleFile.disabled = busy;
  title.disabled = busy;
  description.disabled = busy;
  moduleOrder.disabled = busy;
  moduleStatus.disabled = busy;
  closeModal.disabled = busy;
  cancelEdit.disabled = false;
  saveModule.textContent = busy ? label : "Save Module";
  modal?.classList.toggle("is-busy", busy);
}

function showUploadPanel(show) {
  uploadProgress.style.display = show ? "block" : "none";
  cancelUpload.hidden = !show;
}

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) throw new Error("File is too large. Maximum size is 20 MB.");
  const allowed = new Set([
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain", "image/jpeg", "image/png", "image/webp"
  ]);
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExt = new Set(["pdf","doc","docx","ppt","pptx","xls","xlsx","txt","jpg","jpeg","png","webp"]);
  if (file.type && !allowed.has(file.type) && !allowedExt.has(ext)) throw new Error("This file type is not supported.");
}

function showMessage(text, type = "info") {
  message.textContent = text;
  message.className = `message ${type}`;
}
function sortModules(a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); }
function formatRate(bytesPerSecond) { return bytesPerSecond > 0 ? `${formatFileSize(bytesPerSecond)}/s` : "starting…"; }
function formatEta(seconds) { const s = Math.max(1, Math.round(seconds)); return s < 60 ? `${s}s` : `${Math.ceil(s/60)}m`; }
function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B","KB","MB","GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}
function readableUploadError(error) {
  if (error?.code === "storage/canceled") return "Upload canceled. Your module was not changed.";
  if (error?.code === "storage/unauthorized") return "Upload permission denied. Check Firebase Storage rules.";
  if (error?.code === "storage/retry-limit-exceeded") return "The connection timed out. Please try the upload again.";
  return error?.message || "Unable to save the module.";
}
function escapeHTML(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function escapeAttribute(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
