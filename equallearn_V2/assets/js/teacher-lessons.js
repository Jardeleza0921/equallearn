import { auth, db, storage } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-storage.js";


const lessonList = document.getElementById("lessonList");

const modal = document.getElementById("lessonModal");

const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

const saveLesson = document.getElementById("saveLesson");

const modalTitle = document.getElementById("modalTitle");

const moduleSelect = document.getElementById("moduleSelect");

const lessonTitle = document.getElementById("lessonTitle");
const lessonDescription = document.getElementById("lessonDescription");

const lessonFile = document.getElementById("lessonFile");

const videoUrl = document.getElementById("videoUrl");

const uploadStatus = document.getElementById("uploadStatus");
const currentFile = document.getElementById("currentFile");


let currentUser = null;

let editingLessonId = null;

let existingFileUrl = "";
let existingFileName = "";

let modules = [];

let lessons = [];



/* =========================
   AUTH
========================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";

        return;

    }

    currentUser = user;

    await loadModules();

    await loadLessons();

});



/* =========================
   LOAD MODULES
========================= */

async function loadModules() {

    moduleSelect.innerHTML = `
        <option value="">
            Select Module
        </option>
    `;

    try {

        const snapshot = await getDocs(
            collection(db, "modules")
        );

        modules = [];

        snapshot.forEach((item) => {

            const data = item.data();

            modules.push({
                id: item.id,
                ...data
            });

        });


        modules.sort((a, b) => {

            return (Number(a.order || a.moduleOrder || 0))
                -
                (Number(b.order || b.moduleOrder || 0));

        });


        modules.forEach((module) => {

            const option = document.createElement("option");

            option.value = module.id;

            option.textContent =
                module.title ||
                module.name ||
                "Untitled Module";

            moduleSelect.appendChild(option);

        });

    }

    catch (error) {

        console.error("Module loading error:", error);

        moduleSelect.innerHTML = `
            <option value="">
                Unable to load modules
            </option>
        `;

    }

}



/* =========================
   LOAD LESSONS
========================= */

async function loadLessons() {

    lessonList.innerHTML = `
        <div class="message-box">
            Loading lessons...
        </div>
    `;

    try {

        const snapshot = await getDocs(
            collection(db, "lessons")
        );

        lessons = [];

        snapshot.forEach((item) => {

            lessons.push({
                id: item.id,
                ...item.data()
            });

        });


        lessons.sort((a, b) => {

            const aTime =
                a.createdAt?.seconds || 0;

            const bTime =
                b.createdAt?.seconds || 0;

            return bTime - aTime;

        });


        renderLessons();

    }

    catch (error) {

        console.error("Lesson loading error:", error);

        lessonList.innerHTML = `
            <div class="message-box">
                Unable to load lessons.
                <br><br>
                ${error.message}
            </div>
        `;

    }

}



/* =========================
   RENDER LESSONS
========================= */

function renderLessons() {

    if (lessons.length === 0) {

        lessonList.innerHTML = `
            <div class="message-box">
                No lessons yet.
                <br>
                Click <b>+ Add Lesson</b> to create one.
            </div>
        `;

        return;

    }


    lessonList.innerHTML = "";


    lessons.forEach((lesson) => {

        const module = modules.find(
            (item) => item.id === lesson.moduleId
        );


        const moduleName =
            module?.title ||
            lesson.moduleName ||
            "No module";


        const card = document.createElement("div");

        card.className = "lesson-card";


        let fileHTML = "";

        if (lesson.fileUrl) {

            fileHTML = `
                <div class="file-info">

                    📎
                    <b>${escapeHTML(
                        lesson.fileName || "Lesson File"
                    )}</b>

                    <br><br>

                    <a
                        href="${lesson.fileUrl}"
                        target="_blank"
                        style="
                            color:#6C63FF;
                            font-weight:600;
                            text-decoration:none;
                        ">

                        Open File →

                    </a>

                </div>
            `;

        }


        let videoHTML = "";

        if (lesson.videoUrl) {

            videoHTML = `
                <div class="video-info">

                    🎥
                    <a
                        href="${lesson.videoUrl}"
                        target="_blank">

                        Watch YouTube Video →

                    </a>

                </div>
            `;

        }


        card.innerHTML = `

            <span class="module-badge">

                📚 ${escapeHTML(moduleName)}

            </span>

            <h2>
                ${escapeHTML(
                    lesson.title || "Untitled Lesson"
                )}
            </h2>

            <p class="lesson-description">

                ${escapeHTML(
                    lesson.description || "No description."
                )}

            </p>

            ${fileHTML}

            ${videoHTML}


            <div class="actions">

                <button
                    class="edit-btn"
                    data-id="${lesson.id}">

                    ✏️ Edit

                </button>

                <button
                    class="delete-btn"
                    data-id="${lesson.id}">

                    🗑️ Delete

                </button>

            </div>

        `;


        lessonList.appendChild(card);

    });


    document
        .querySelectorAll(".edit-btn")
        .forEach((button) => {

            button.addEventListener("click", () => {

                editLesson(button.dataset.id);

            });

        });


    document
        .querySelectorAll(".delete-btn")
        .forEach((button) => {

            button.addEventListener("click", () => {

                deleteLesson(button.dataset.id);

            });

        });

}



/* =========================
   OPEN MODAL
========================= */

openModal.addEventListener("click", () => {

    resetForm();

    modalTitle.textContent = "Add Lesson";

    modal.classList.add("show");

});



/* =========================
   CLOSE MODAL
========================= */

function closeLessonModal() {

    modal.classList.remove("show");

    resetForm();

}


closeModal.addEventListener(
    "click",
    closeLessonModal
);

cancelBtn.addEventListener(
    "click",
    closeLessonModal
);



/* =========================
   CLICK OUTSIDE MODAL
========================= */

modal.addEventListener("click", (event) => {

    if (event.target === modal) {

        closeLessonModal();

    }

});



/* =========================
   EDIT LESSON
========================= */

function editLesson(id) {

    const lesson = lessons.find(
        (item) => item.id === id
    );

    if (!lesson) return;


    editingLessonId = id;


    modalTitle.textContent = "Edit Lesson";


    moduleSelect.value =
        lesson.moduleId || "";


    lessonTitle.value =
        lesson.title || "";


    lessonDescription.value =
        lesson.description || "";


    videoUrl.value =
        lesson.videoUrl || "";


    existingFileUrl =
        lesson.fileUrl || "";


    existingFileName =
        lesson.fileName || "";


    if (existingFileName) {

        currentFile.style.display = "block";

        currentFile.innerHTML = `
            📎 Current file:
            <b>${escapeHTML(existingFileName)}</b>
        `;

    }


    modal.classList.add("show");

}



/* =========================
   SAVE LESSON
========================= */

saveLesson.addEventListener(
    "click",
    async () => {

        const moduleId =
            moduleSelect.value;

        const title =
            lessonTitle.value.trim();

        const description =
            lessonDescription.value.trim();

        const youtube =
            videoUrl.value.trim();

        const file =
            lessonFile.files[0];


        if (!moduleId) {

            alert("Please select a module.");

            return;

        }


        if (!title) {

            alert("Please enter the lesson title.");

            return;

        }


        saveLesson.disabled = true;

        saveLesson.textContent =
            "Saving...";


        try {

            let fileUrl =
                existingFileUrl;

            let fileName =
                existingFileName;


            /* =========================
               FILE UPLOAD
            ========================= */

            if (file) {

                uploadStatus.textContent =
                    "Uploading file...";


                const safeName =
                    file.name.replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );


                const filePath =
                    `lessons/${currentUser.uid}/${Date.now()}_${safeName}`;


                const storageRef =
                    ref(storage, filePath);


                await uploadBytes(
                    storageRef,
                    file
                );


                fileUrl =
                    await getDownloadURL(
                        storageRef
                    );


                fileName =
                    file.name;


                uploadStatus.textContent =
                    "File uploaded successfully.";

            }


            const selectedModule =
                modules.find(
                    (item) =>
                        item.id === moduleId
                );


            const moduleName =
                selectedModule?.title ||
                selectedModule?.name ||
                "";


            /* =========================
               EDIT
            ========================= */

            if (editingLessonId) {

                await updateDoc(
                    doc(
                        db,
                        "lessons",
                        editingLessonId
                    ),
                    {

                        moduleId,

                        moduleName,

                        title,

                        description,

                        fileUrl,

                        fileName,

                        videoUrl: youtube,

                        updatedAt:
                            serverTimestamp()

                    }
                );

            }

            /* =========================
               ADD
            ========================= */

            else {

                await addDoc(
                    collection(
                        db,
                        "lessons"
                    ),
                    {

                        moduleId,

                        moduleName,

                        title,

                        description,

                        fileUrl,

                        fileName,

                        videoUrl: youtube,

                        createdBy:
                            currentUser.uid,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );

            }


            closeLessonModal();

            await loadLessons();


            alert(
                editingLessonId
                    ? "Lesson updated successfully!"
                    : "Lesson added successfully!"
            );

        }

        catch (error) {

            console.error(
                "Save lesson error:",
                error
            );


            alert(
                "Unable to save lesson:\n\n"
                + error.message
            );

        }


        finally {

            saveLesson.disabled = false;

            saveLesson.textContent =
                "Save Lesson";

        }

    }
);



/* =========================
   DELETE
========================= */

async function deleteLesson(id) {

    const lesson =
        lessons.find(
            (item) => item.id === id
        );


    if (!lesson) return;


    const confirmDelete =
        confirm(
            `Delete "${lesson.title}"?`
        );


    if (!confirmDelete) return;


    try {

        await deleteDoc(
            doc(
                db,
                "lessons",
                id
            )
        );


        await loadLessons();


        alert(
            "Lesson deleted successfully."
        );

    }

    catch (error) {

        console.error(
            "Delete lesson error:",
            error
        );


        alert(
            "Unable to delete lesson:\n\n"
            + error.message
        );

    }

}



/* =========================
   RESET FORM
========================= */

function resetForm() {

    editingLessonId = null;

    moduleSelect.value = "";

    lessonTitle.value = "";

    lessonDescription.value = "";

    videoUrl.value = "";

    lessonFile.value = "";

    existingFileUrl = "";

    existingFileName = "";

    uploadStatus.textContent = "";

    currentFile.style.display = "none";

    currentFile.innerHTML = "";

}



/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {

    if (!value) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}