import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
  serverTimestamp, orderBy, query
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-storage.js";

const $ = (id) => document.getElementById(id);
const lessonList = $("lessonList");
const modal = $("lessonModal");
const openModal = $("openModal");
const closeModal = $("closeModal");
const cancelBtn = $("cancelBtn");
const saveLesson = $("saveLesson");
const modalTitle = $("modalTitle");
const moduleSelect = $("moduleSelect");
const lessonTitle = $("lessonTitle");
const lessonDescription = $("lessonDescription");
const lessonFile = $("lessonFile");
const videoUrl = $("videoUrl");
const uploadStatus = $("uploadStatus");
const currentFile = $("currentFile");

const MAX_FILE_SIZE = 20 * 1024 * 1024;
let currentUser = null;
let editingLessonId = null;
let existingFileUrl = "";
let existingFileName = "";
let existingFilePath = "";
let modules = [];
let lessons = [];
let activeUploadTask = null;
let uploadStartedAt = 0;
let lastProgressBytes = 0;
let lastProgressTime = 0;

const uploadPanel = document.createElement("div");
uploadPanel.className = "el-upload-panel";
uploadPanel.hidden = true;
uploadPanel.innerHTML = `
  <div class="el-upload-head"><strong>Uploading attachment</strong><span id="lessonUploadPercent">0%</span></div>
  <div class="el-upload-track"><span id="lessonUploadBar"></span></div>
  <div class="el-upload-meta" id="lessonUploadMeta">Preparing upload…</div>
  <button type="button" class="el-upload-cancel" id="lessonCancelUpload">Cancel upload</button>`;
uploadStatus?.insertAdjacentElement("afterend", uploadPanel);
const lessonUploadPercent = $("lessonUploadPercent");
const lessonUploadBar = $("lessonUploadBar");
const lessonUploadMeta = $("lessonUploadMeta");
const lessonCancelUpload = $("lessonCancelUpload");
lessonCancelUpload?.addEventListener("click", () => activeUploadTask?.cancel());

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }
  currentUser = user;
  await loadModules();
  await loadLessons();
});

async function loadModules() {
  moduleSelect.innerHTML = `<option value="">Select Module</option>`;
  try {
    const snapshot = await getDocs(query(collection(db, "modules"), orderBy("order", "asc")));
    modules = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    const fragment = document.createDocumentFragment();
    modules.forEach((module) => {
      const option = document.createElement("option");
      option.value = module.id;
      option.textContent = module.title || module.name || "Untitled Module";
      fragment.appendChild(option);
    });
    moduleSelect.appendChild(fragment);
  } catch (error) {
    console.error("Module loading error:", error);
    moduleSelect.innerHTML = `<option value="">Unable to load modules</option>`;
  }
}

async function loadLessons() {
  lessonList.innerHTML = `<div class="message-box"><span class="el-inline-spinner"></span><strong>Loading lessons…</strong><small>Syncing the latest content</small></div>`;
  try {
    const snapshot = await getDocs(collection(db, "lessons"));
    lessons = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    lessons.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    renderLessons();
  } catch (error) {
    console.error("Lesson loading error:", error);
    lessonList.innerHTML = `<div class="message-box">Unable to load lessons.<br><small>${escapeHTML(error.message)}</small></div>`;
  }
}

function renderLessons() {
  if (!lessons.length) {
    lessonList.innerHTML = `<div class="message-box"><strong>No lessons yet.</strong><br><small>Click + Add Lesson to create one.</small></div>`;
    return;
  }
  const fragment = document.createDocumentFragment();
  lessons.forEach((lesson) => {
    const module = modules.find((item) => item.id === lesson.moduleId);
    const moduleName = module?.title || lesson.moduleName || "No module";
    const card = document.createElement("article");
    card.className = "lesson-card";
    card.dataset.id = lesson.id;
    const fileHTML = lesson.fileUrl ? `<div class="file-info"><strong>${escapeHTML(lesson.fileName || "Lesson File")}</strong><br><a href="${escapeAttribute(lesson.fileUrl)}" target="_blank" rel="noopener noreferrer">Open attachment →</a></div>` : "";
    const videoHTML = lesson.videoUrl ? `<div class="video-info"><a href="${escapeAttribute(lesson.videoUrl)}" target="_blank" rel="noopener noreferrer">Watch video →</a></div>` : "";
    card.innerHTML = `
      <span class="module-badge">${escapeHTML(moduleName)}</span>
      <h2>${escapeHTML(lesson.title || "Untitled Lesson")}</h2>
      <p class="lesson-description">${escapeHTML(lesson.description || "No description.")}</p>
      ${fileHTML}${videoHTML}
      <div class="actions"><button class="edit-btn" data-action="edit">Edit</button><button class="delete-btn" data-action="delete">Delete</button></div>`;
    fragment.appendChild(card);
  });
  lessonList.replaceChildren(fragment);
}

lessonList?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.closest(".lesson-card")?.dataset.id;
  if (!id) return;
  if (button.dataset.action === "edit") editLesson(id);
  if (button.dataset.action === "delete") deleteLesson(id);
});

openModal?.addEventListener("click", () => {
  resetForm();
  modalTitle.textContent = "Add Lesson";
  modal.classList.add("show");
  requestAnimationFrame(() => lessonTitle.focus());
});
closeModal?.addEventListener("click", closeLessonModal);
cancelBtn?.addEventListener("click", closeLessonModal);
modal?.addEventListener("click", (event) => { if (event.target === modal) closeLessonModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && modal?.classList.contains("show")) closeLessonModal(); });

lessonFile?.addEventListener("change", () => {
  const file = lessonFile.files?.[0];
  if (!file) {
    uploadStatus.textContent = "";
    return;
  }
  try {
    validateFile(file);
    uploadStatus.textContent = `${file.name} • ${formatFileSize(file.size)} • ready to upload`;
  } catch (error) {
    lessonFile.value = "";
    uploadStatus.textContent = error.message;
    uploadStatus.classList.add("error");
  }
});

function editLesson(id) {
  const lesson = lessons.find((item) => item.id === id);
  if (!lesson) return;
  editingLessonId = id;
  modalTitle.textContent = "Edit Lesson";
  moduleSelect.value = lesson.moduleId || "";
  lessonTitle.value = lesson.title || "";
  lessonDescription.value = lesson.description || "";
  videoUrl.value = lesson.videoUrl || "";
  existingFileUrl = lesson.fileUrl || "";
  existingFileName = lesson.fileName || "";
  existingFilePath = lesson.filePath || "";
  if (existingFileName || existingFileUrl) {
    currentFile.style.display = "block";
    currentFile.innerHTML = `<strong>Current attachment</strong><br>${escapeHTML(existingFileName || "Lesson file")}${existingFileUrl ? `<br><a href="${escapeAttribute(existingFileUrl)}" target="_blank" rel="noopener noreferrer">Open file →</a>` : ""}<br><small>Select a new file only to replace it.</small>`;
  }
  modal.classList.add("show");
  requestAnimationFrame(() => lessonTitle.focus());
}

saveLesson?.addEventListener("click", async () => {
  const moduleId = moduleSelect.value;
  const titleValue = lessonTitle.value.trim();
  const descriptionValue = lessonDescription.value.trim();
  const youtube = videoUrl.value.trim();
  const file = lessonFile.files?.[0] || null;
  if (!moduleId) return showLessonStatus("Please select a module.", true);
  if (!titleValue) return showLessonStatus("Please enter the lesson title.", true);
  if (file) {
    try { validateFile(file); } catch (error) { return showLessonStatus(error.message, true); }
  }

  setBusy(true, file ? "Preparing upload…" : "Saving lesson…");
  const oldPath = existingFilePath;
  try {
    let fileUrl = existingFileUrl;
    let fileName = existingFileName;
    let filePath = existingFilePath;

    if (file) {
      const upload = await uploadLessonFile(file);
      fileUrl = upload.url;
      fileName = file.name;
      filePath = upload.path;
    }

    const selectedModule = modules.find((item) => item.id === moduleId);
    const moduleName = selectedModule?.title || selectedModule?.name || "";
    const payload = {
      moduleId, moduleName,
      title: titleValue,
      description: descriptionValue,
      fileUrl, fileName, filePath,
      videoUrl: youtube,
      updatedAt: serverTimestamp()
    };

    if (editingLessonId) {
      await updateDoc(doc(db, "lessons", editingLessonId), payload);
      const index = lessons.findIndex((item) => item.id === editingLessonId);
      if (index >= 0) lessons[index] = { ...lessons[index], ...payload };
    } else {
      const created = await addDoc(collection(db, "lessons"), {
        ...payload,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      lessons.unshift({ id: created.id, ...payload, createdAt: { seconds: Math.floor(Date.now()/1000) } });
    }

    if (file && oldPath && oldPath !== filePath) {
      deleteObject(ref(storage, oldPath)).catch((error) => console.warn("Old lesson file cleanup skipped:", error));
    }

    renderLessons();
    closeLessonModal(true);
    loadLessons();
  } catch (error) {
    console.error("Save lesson error:", error);
    showLessonStatus(readableUploadError(error), true);
  } finally {
    activeUploadTask = null;
    setBusy(false);
  }
});

async function uploadLessonFile(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `lessons/${currentUser.uid}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "application/octet-stream",
    customMetadata: { originalName: file.name }
  });
  activeUploadTask = task;
  uploadStartedAt = performance.now();
  lastProgressBytes = 0;
  lastProgressTime = uploadStartedAt;
  uploadPanel.hidden = false;

  return new Promise((resolve, reject) => {
    task.on("state_changed", (snapshot) => updateLessonProgress(snapshot.bytesTransferred, snapshot.totalBytes), reject, async () => {
      try {
        lessonUploadBar.style.width = "100%";
        lessonUploadPercent.textContent = "100%";
        lessonUploadMeta.textContent = "Upload complete. Saving lesson…";
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      } catch (error) { reject(error); }
    });
  });
}

function updateLessonProgress(bytes, total) {
  const now = performance.now();
  const percent = total ? Math.min(100, (bytes / total) * 100) : 0;
  const elapsed = Math.max((now - uploadStartedAt) / 1000, .25);
  const averageRate = bytes / elapsed;
  const interval = Math.max((now - lastProgressTime) / 1000, .05);
  const instantRate = (bytes - lastProgressBytes) / interval;
  const rate = instantRate > 0 ? averageRate * .55 + instantRate * .45 : averageRate;
  const eta = rate > 0 ? Math.max(total - bytes, 0) / rate : 0;
  lessonUploadBar.style.width = `${percent.toFixed(1)}%`;
  lessonUploadPercent.textContent = `${Math.round(percent)}%`;
  lessonUploadMeta.textContent = `${formatFileSize(bytes)} of ${formatFileSize(total)} • ${formatFileSize(rate)}/s${eta > 1 ? ` • ${formatEta(eta)} left` : ""}`;
  saveLesson.textContent = percent < 100 ? `Uploading ${Math.round(percent)}%` : "Saving lesson…";
  lastProgressBytes = bytes;
  lastProgressTime = now;
}

async function deleteLesson(id) {
  const lesson = lessons.find((item) => item.id === id);
  if (!lesson || !confirm(`Delete "${lesson.title || "this lesson"}"?`)) return;
  try {
    await deleteDoc(doc(db, "lessons", id));
    lessons = lessons.filter((item) => item.id !== id);
    renderLessons();
    if (lesson.filePath) deleteObject(ref(storage, lesson.filePath)).catch((error) => console.warn("Storage cleanup skipped:", error));
  } catch (error) {
    console.error("Delete lesson error:", error);
    alert(error.message || "Unable to delete lesson.");
  }
}

function closeLessonModal(force = false) {
  if (!force && activeUploadTask) {
    if (!confirm("An upload is still running. Cancel the upload and close?")) return;
    activeUploadTask.cancel();
  }
  modal.classList.remove("show");
  resetForm();
}

function resetForm() {
  editingLessonId = null;
  existingFileUrl = "";
  existingFileName = "";
  existingFilePath = "";
  moduleSelect.value = "";
  lessonTitle.value = "";
  lessonDescription.value = "";
  lessonFile.value = "";
  videoUrl.value = "";
  currentFile.style.display = "none";
  currentFile.innerHTML = "";
  uploadStatus.textContent = "";
  uploadStatus.classList.remove("error");
  uploadPanel.hidden = true;
  lessonUploadBar.style.width = "0%";
  lessonUploadPercent.textContent = "0%";
  lessonUploadMeta.textContent = "Preparing upload…";
  activeUploadTask = null;
  setBusy(false);
}

function setBusy(busy, label = "Saving…") {
  [moduleSelect, lessonTitle, lessonDescription, lessonFile, videoUrl, closeModal].forEach((el) => { if (el) el.disabled = busy; });
  saveLesson.disabled = busy;
  saveLesson.textContent = busy ? label : "Save Lesson";
  modal?.classList.toggle("is-busy", busy);
}
function showLessonStatus(text, error = false) {
  uploadStatus.textContent = text;
  uploadStatus.classList.toggle("error", error);
}
function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) throw new Error("File is too large. Maximum size is 20 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowed = new Set(["pdf","doc","docx","ppt","pptx","xls","xlsx","txt","jpg","jpeg","png","webp"]);
  if (!allowed.has(ext)) throw new Error("This file type is not supported.");
}
function readableUploadError(error) {
  if (error?.code === "storage/canceled") return "Upload canceled. The lesson was not changed.";
  if (error?.code === "storage/unauthorized") return "Upload permission denied. Check Firebase Storage rules.";
  if (error?.code === "storage/retry-limit-exceeded") return "The upload timed out. Please try again.";
  return error?.message || "Unable to save the lesson.";
}
function formatEta(seconds) { const s = Math.max(1, Math.round(seconds)); return s < 60 ? `${s}s` : `${Math.ceil(s/60)}m`; }
function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B","KB","MB","GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}
function escapeHTML(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function escapeAttribute(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
