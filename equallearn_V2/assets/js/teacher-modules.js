import { auth, db, storage } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-storage.js";


// ======================================================
// ELEMENTS
// ======================================================

const moduleList =
    document.getElementById("moduleList");

const modal =
    document.getElementById("moduleModal");

const openModal =
    document.getElementById("openModal");

const closeModal =
    document.getElementById("closeModal");

const cancelEdit =
    document.getElementById("cancelEdit");

const saveModule =
    document.getElementById("saveModule");

const title =
    document.getElementById("title");

const description =
    document.getElementById("description");

const moduleOrder =
    document.getElementById("moduleOrder");

const moduleStatus =
    document.getElementById("moduleStatus");

const moduleFile =
    document.getElementById("moduleFile");

const existingFile =
    document.getElementById("existingFile");

const selectedFile =
    document.getElementById("selectedFile");

const modalTitle =
    document.getElementById("modalTitle");

const message =
    document.getElementById("message");

const uploadProgress =
    document.getElementById("uploadProgress");

const progressBar =
    document.getElementById("progressBar");

const progressText =
    document.getElementById("progressText");


// ======================================================
// VARIABLES
// ======================================================

let editingId = null;

let currentFileURL = "";

let currentFilePath = "";


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login.html";

            return;

        }

        loadModules();

    }
);


// ======================================================
// OPEN MODAL - ADD
// ======================================================

openModal.onclick = () => {

    resetForm();

    modalTitle.innerText =
        "Add Module";

    modal.classList.add("show");

};


// ======================================================
// CLOSE MODAL
// ======================================================

closeModal.onclick =
cancelEdit.onclick = () => {

    modal.classList.remove("show");

    resetForm();

};


// ======================================================
// CLICK OUTSIDE MODAL
// ======================================================

window.addEventListener(
    "click",
    (event) => {

        if (event.target === modal) {

            modal.classList.remove("show");

            resetForm();

        }

    }
);


// ======================================================
// FILE SELECTED
// ======================================================

moduleFile.addEventListener(
    "change",
    () => {

        const file =
            moduleFile.files[0];

        if (!file) {

            selectedFile.style.display =
                "none";

            return;

        }


        selectedFile.style.display =
            "block";

        selectedFile.innerHTML = `

            📎 <strong>
                ${escapeHTML(file.name)}
            </strong>

            <br>

            <small>
                ${formatFileSize(file.size)}
            </small>

        `;

    }
);


// ======================================================
// SAVE MODULE
// ======================================================

saveModule.onclick =
    async () => {

        const moduleTitle =
            title.value.trim();

        const moduleDescription =
            description.value.trim();

        const order =
            Number(moduleOrder.value);

        const status =
            moduleStatus.value;

        const file =
            moduleFile.files[0];


        // --------------------------
        // VALIDATION
        // --------------------------

        if (!moduleTitle) {

            showMessage(
                "Please enter a module title.",
                "error"
            );

            return;

        }


        if (!moduleDescription) {

            showMessage(
                "Please enter a description.",
                "error"
            );

            return;

        }


        if (!order || order < 1) {

            showMessage(
                "Please enter a valid display order.",
                "error"
            );

            return;

        }


        saveModule.disabled = true;

        saveModule.innerText =
            "Saving...";


        try {

            let fileURL =
                currentFileURL;

            let filePath =
                currentFilePath;


            // ==================================================
            // UPLOAD NEW FILE
            // ==================================================

            if (file) {

                validateFile(file);


                const fileName =
                    `${Date.now()}_${file.name}`;


                const storagePath =
                    `modules/${auth.currentUser.uid}/${fileName}`;


                const storageRef =
                    ref(storage, storagePath);


                const uploadTask =
                    uploadBytesResumable(
                        storageRef,
                        file
                    );


                uploadProgress.style.display =
                    "block";


                await new Promise(
                    (resolve, reject) => {

                        uploadTask.on(

                            "state_changed",

                            (snapshot) => {

                                const progress =
                                    (
                                        snapshot.bytesTransferred /
                                        snapshot.totalBytes
                                    ) * 100;


                                progressBar.style.width =
                                    `${progress}%`;


                                progressText.innerText =
                                    `Uploading ${Math.round(progress)}%`;

                            },


                            (error) => {

                                reject(error);

                            },


                            async () => {

                                fileURL =
                                    await getDownloadURL(
                                        uploadTask.snapshot.ref
                                    );

                                filePath =
                                    storagePath;

                                resolve();

                            }

                        );

                    }
                );

            }


            // ==================================================
            // ADD
            // ==================================================

            if (!editingId) {

                await addDoc(
                    collection(db, "modules"),
                    {

                        title:
                            moduleTitle,

                        description:
                            moduleDescription,

                        order:
                            order,

                        status:
                            status,

                        fileURL:
                            fileURL || "",

                        filePath:
                            filePath || "",

                        fileName:
                            file
                                ? file.name
                                : "",

                        createdBy:
                            auth.currentUser.uid,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );


                showMessage(
                    "Module added successfully!",
                    "success"
                );

            }


            // ==================================================
            // EDIT
            // ==================================================

            else {

                await updateDoc(
                    doc(
                        db,
                        "modules",
                        editingId
                    ),
                    {

                        title:
                            moduleTitle,

                        description:
                            moduleDescription,

                        order:
                            order,

                        status:
                            status,

                        fileURL:
                            fileURL || "",

                        filePath:
                            filePath || "",

                        fileName:
                            file
                                ? file.name
                                : (
                                    currentFileURL
                                        ? existingFile.dataset.filename || ""
                                        : ""
                                ),

                        updatedAt:
                            serverTimestamp()

                    }
                );


                showMessage(
                    "Module updated successfully!",
                    "success"
                );

            }


            // Wait a little so user sees success

            setTimeout(
                () => {

                    modal.classList.remove(
                        "show"
                    );

                    resetForm();

                    loadModules();

                },
                700
            );


        }
        catch (error) {

            console.error(
                "Module error:",
                error
            );


            showMessage(
                error.message ||
                "Something went wrong.",
                "error"
            );

        }
        finally {

            saveModule.disabled =
                false;

            saveModule.innerText =
                "Save Module";

        }

    };


// ======================================================
// LOAD MODULES
// ======================================================

async function loadModules() {

    moduleList.innerHTML = `

        <div class="loading">
            Loading modules...
        </div>

    `;


    try {

        const moduleQuery =
            query(
                collection(
                    db,
                    "modules"
                ),
                orderBy(
                    "order",
                    "asc"
                )
            );


        const snapshot =
            await getDocs(
                moduleQuery
            );


        if (snapshot.empty) {

            moduleList.innerHTML = `

                <div class="empty">

                    📚

                    <br><br>

                    No modules yet.

                    <br>

                    Click <strong>
                    + Add Module
                    </strong> to create one.

                </div>

            `;

            return;

        }


        moduleList.innerHTML = "";


        snapshot.forEach(
            (item) => {

                const data =
                    item.data();


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "module-card";


                let fileHTML = "";


                if (data.fileURL) {

                    fileHTML = `

                        <a
                            class="file-link"
                            href="${escapeAttribute(data.fileURL)}"
                            target="_blank"
                            rel="noopener noreferrer">

                            <span class="file-icon">
                                📎
                            </span>

                            <span>
                                ${escapeHTML(
                                    data.fileName ||
                                    "Open Module File"
                                )}

                                <br>

                                <small>
                                    Click to open
                                </small>

                            </span>

                        </a>

                    `;

                }


                card.innerHTML = `

                    <div class="module-top">

                        <h3 class="module-title">

                            ${escapeHTML(
                                data.title ||
                                "Untitled Module"
                            )}

                        </h3>


                        <span
                            class="status ${escapeAttribute(
                                data.status ||
                                "draft"
                            )}">

                            ${escapeHTML(
                                data.status ||
                                "draft"
                            )}

                        </span>

                    </div>


                    <p class="module-description">

                        ${escapeHTML(
                            data.description ||
                            "No description."
                        )}

                    </p>


                    ${fileHTML}


                    <div class="module-info">

                        📌 Display Order:
                        ${data.order || "-"}

                    </div>


                    <div class="module-actions">

                        <button
                            class="edit-btn"
                            onclick="editModule('${item.id}')">

                            ✏️ Edit

                        </button>


                        <button
                            class="delete-btn"
                            onclick="deleteModule('${item.id}')">

                            🗑️ Delete

                        </button>

                    </div>

                `;


                moduleList.appendChild(
                    card
                );

            }
        );


    }
    catch (error) {

        console.error(
            "Load modules error:",
            error
        );


        moduleList.innerHTML = `

            <div class="empty">

                ❌ Unable to load modules.

                <br><br>

                ${escapeHTML(
                    error.message
                )}

            </div>

        `;

    }

}


// ======================================================
// EDIT MODULE
// ======================================================

window.editModule =
    async (id) => {

        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "modules"
                    )
                );


            let selectedData =
                null;


            snapshot.forEach(
                (item) => {

                    if (
                        item.id === id
                    ) {

                        selectedData =
                            item.data();

                    }

                }
            );


            if (!selectedData) {

                alert(
                    "Module not found."
                );

                return;

            }


            editingId =
                id;


            title.value =
                selectedData.title ||
                "";

            description.value =
                selectedData.description ||
                "";

            moduleOrder.value =
                selectedData.order ||
                "";

            moduleStatus.value =
                selectedData.status ||
                "active";


            currentFileURL =
                selectedData.fileURL ||
                "";

            currentFilePath =
                selectedData.filePath ||
                "";


            existingFile.dataset.filename =
                selectedData.fileName ||
                "";


            if (
                selectedData.fileURL
            ) {

                existingFile.style.display =
                    "block";


                existingFile.innerHTML = `

                    📎 Existing file:

                    <strong>
                        ${escapeHTML(
                            selectedData.fileName ||
                            "Attached file"
                        )}
                    </strong>

                    <br><br>

                    <a
                        href="${escapeAttribute(
                            selectedData.fileURL
                        )}"
                        target="_blank"
                        rel="noopener noreferrer">

                        Open existing file →

                    </a>

                    <br><br>

                    <small>
                        Choose a new file above
                        to replace it.
                    </small>

                `;

            }
            else {

                existingFile.style.display =
                    "none";

            }


            selectedFile.style.display =
                "none";


            modalTitle.innerText =
                "Edit Module";


            modal.classList.add(
                "show"
            );

        }
        catch (error) {

            console.error(error);

            alert(
                "Unable to load module."
            );

        }

    };


// ======================================================
// DELETE MODULE
// ======================================================

window.deleteModule =
    async (id) => {

        const confirmed =
            confirm(
                "Are you sure you want to delete this module?"
            );


        if (!confirmed) {

            return;

        }


        try {

            // Get module first

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "modules"
                    )
                );


            let data =
                null;


            snapshot.forEach(
                (item) => {

                    if (
                        item.id === id
                    ) {

                        data =
                            item.data();

                    }

                }
            );


            // Delete file from Storage

            if (
                data &&
                data.filePath
            ) {

                try {

                    const fileRef =
                        ref(
                            storage,
                            data.filePath
                        );


                    await deleteObject(
                        fileRef
                    );

                }
                catch (fileError) {

                    console.warn(
                        "Storage file could not be deleted:",
                        fileError
                    );

                }

            }


            // Delete Firestore document

            await deleteDoc(
                doc(
                    db,
                    "modules",
                    id
                )
            );


            alert(
                "Module deleted successfully."
            );


            loadModules();

        }
        catch (error) {

            console.error(
                "Delete error:",
                error
            );


            alert(
                error.message ||
                "Unable to delete module."
            );

        }

    };


// ======================================================
// RESET FORM
// ======================================================

function resetForm() {

    editingId =
        null;

    currentFileURL =
        "";

    currentFilePath =
        "";


    title.value =
        "";

    description.value =
        "";

    moduleOrder.value =
        "";

    moduleStatus.value =
        "active";


    moduleFile.value =
        "";


    existingFile.style.display =
        "none";


    selectedFile.style.display =
        "none";


    uploadProgress.style.display =
        "none";


    progressBar.style.width =
        "0%";


    progressText.innerText =
        "Uploading...";


    message.innerText =
        "";

    message.className =
        "message";

}


// ======================================================
// VALIDATE FILE
// ======================================================

function validateFile(file) {

    const maxSize =
        20 * 1024 * 1024; // 20 MB


    if (
        file.size >
        maxSize
    ) {

        throw new Error(
            "File is too large. Maximum size is 20 MB."
        );

    }


    const allowedTypes = [

        "application/pdf",

        "application/msword",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        "application/vnd.ms-powerpoint",

        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        "application/vnd.ms-excel",

        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "text/plain",

        "image/jpeg",

        "image/png",

        "image/webp"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "This file type is not supported."
        );

    }

}


// ======================================================
// MESSAGE
// ======================================================

function showMessage(
    text,
    type
) {

    message.innerText =
        text;

    message.className =
        `message ${type}`;

}


// ======================================================
// FILE SIZE
// ======================================================

function formatFileSize(
    bytes
) {

    if (!bytes) {

        return "0 Bytes";

    }


    const sizes = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const i =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        Math.round(
            bytes /
            Math.pow(1024, i) *
            100
        ) / 100
    ) +
    " " +
    sizes[i];

}


// ======================================================
// SECURITY / HTML ESCAPING
// ======================================================

function escapeHTML(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

}