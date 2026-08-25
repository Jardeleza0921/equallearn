import {
    auth,
    db,
    firebaseConfig
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signOut,
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    initializeApp,
    deleteApp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    setDoc,
    updateDoc,
    getDoc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


// ======================================================
// ELEMENTS
// ======================================================

const teacherList = document.getElementById("teacherList");
const modal = document.getElementById("teacherModal");

const openModal = document.getElementById("openModal");
const saveTeacher = document.getElementById("saveTeacher");
const cancel = document.getElementById("cancel");

const fullname = document.getElementById("fullname");
const email = document.getElementById("email");
const password = document.getElementById("password");
const department = document.getElementById("department");
const status = document.getElementById("status");

let editingId = null;


// ======================================================
// OPEN ADD TEACHER MODAL
// ======================================================

openModal.onclick = () => {

    editingId = null;

    fullname.value = "";
    email.value = "";
    password.value = "";
    department.value = "";
    status.value = "active";

    email.disabled = false;
    password.required = true;

    modal.style.display = "flex";
};


// ======================================================
// CANCEL MODAL
// ======================================================

cancel.onclick = () => {

    modal.style.display = "none";

};


// ======================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ======================================================

window.onclick = (event) => {

    if (event.target === modal) {

        modal.style.display = "none";

    }

};


// ======================================================
// CHECK ADMIN AUTHENTICATION
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";

        return;

    }

    try {

        const adminRef = doc(
            db,
            "users",
            user.uid
        );

        const adminSnapshot = await getDoc(adminRef);


        if (!adminSnapshot.exists()) {

            alert("Admin profile not found.");

            await signOut(auth);

            window.location.href = "../login.html";

            return;

        }


        const adminData = adminSnapshot.data();


        if (adminData.role !== "admin") {

            alert("Access denied. Admins only.");

            window.location.href = "../login.html";

            return;

        }


        loadTeachers();

    }

    catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        teacherList.innerHTML =
            "Unable to verify administrator.";

    }

});


// ======================================================
// LOAD TEACHERS
// ======================================================

async function loadTeachers() {

    teacherList.innerHTML = "Loading...";

    try {

        const teacherQuery = query(
            collection(db, "users"),
            where("role", "==", "teacher")
        );


        const snapshot =
            await getDocs(teacherQuery);


        teacherList.innerHTML = "";


        if (snapshot.empty) {

            teacherList.innerHTML =
                `<p class="no-teachers">
                    No teachers found.
                </p>`;

            return;

        }


        snapshot.forEach((item) => {

            const teacher = item.data();


            const card =
                document.createElement("div");

            card.className = "teacher-card";


            card.innerHTML = `

                <div class="teacher-info">

                    <h3>
                        ${escapeHTML(
                            teacher.fullname || "Unnamed Teacher"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            teacher.email || ""
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            teacher.department || "No department"
                        )}
                    </p>

                    <span class="status ${
                        teacher.status === "active"
                            ? "active"
                            : "inactive"
                    }">

                        Status:
                        ${escapeHTML(
                            teacher.status || "inactive"
                        )}

                    </span>

                </div>


                <div class="teacher-actions">

                    <button
                        class="edit-btn"
                        onclick="editTeacher('${item.id}')">

                        Edit

                    </button>


                    <button
                        class="delete-btn"
                        onclick="deleteTeacher('${item.id}')">

                        Delete

                    </button>

                </div>

            `;


            teacherList.appendChild(card);

        });

    }

    catch (error) {

        console.error(
            "Load teachers error:",
            error
        );

        teacherList.innerHTML =
            `<p class="error-message">
                Failed to load teachers.
            </p>`;

    }

}


// ======================================================
// ADD / UPDATE TEACHER
// ======================================================

saveTeacher.onclick = async () => {

    const nameValue =
        fullname.value.trim();

    const emailValue =
        email.value.trim().toLowerCase();

    const passwordValue =
        password.value.trim();

    const departmentValue =
        department.value.trim();

    const statusValue =
        status.value;


    // ==================================================
    // VALIDATION
    // ==================================================

    if (!nameValue || !emailValue) {

        alert(
            "Full name and email are required."
        );

        return;

    }


    // Password is required only when adding
    if (!editingId && !passwordValue) {

        alert(
            "Password is required."
        );

        return;

    }


    // ==================================================
    // UPDATE EXISTING TEACHER
    // ==================================================

    if (editingId) {

        try {

            await updateDoc(
                doc(
                    db,
                    "users",
                    editingId
                ),

                {

                    fullname:
                        nameValue,

                    department:
                        departmentValue,

                    status:
                        statusValue,

                    updatedAt:
                        serverTimestamp()

                }

            );


            alert(
                "Teacher information updated."
            );


            modal.style.display = "none";

            editingId = null;

            loadTeachers();

            return;

        }

        catch (error) {

            console.error(
                "Update teacher error:",
                error
            );

            alert(
                "Failed to update teacher: " +
                error.message
            );

            return;

        }

    }


    // ==================================================
    // CREATE NEW TEACHER
    // ==================================================

    let secondaryApp = null;


    try {

        // ----------------------------------------------
        // CHECK IF EMAIL ALREADY EXISTS IN FIRESTORE
        // ----------------------------------------------

        const existingTeacherQuery = query(
            collection(db, "users"),
            where("email", "==", emailValue)
        );


        const existingSnapshot =
            await getDocs(existingTeacherQuery);


        if (!existingSnapshot.empty) {

            alert(
                "This email is already registered."
            );

            return;

        }


        // ----------------------------------------------
        // CREATE SECONDARY FIREBASE APP
        // ----------------------------------------------

        const appName =
            "teacherCreator_" +
            Date.now();


        secondaryApp =
            initializeApp(
                firebaseConfig,
                appName
            );


        const secondaryAuth =
            getAuth(secondaryApp);


        // ----------------------------------------------
        // CREATE FIREBASE AUTH ACCOUNT
        // ----------------------------------------------

        const credential =
            await createUserWithEmailAndPassword(

                secondaryAuth,

                emailValue,

                passwordValue

            );


        const uid =
            credential.user.uid;


        // ----------------------------------------------
        // CREATE FIRESTORE USER PROFILE
        // ----------------------------------------------

        await setDoc(

            doc(
                db,
                "users",
                uid
            ),

            {

                uid: uid,

                fullname:
                    nameValue,

                email:
                    emailValue,

                department:
                    departmentValue,

                role:
                    "teacher",

                status:
                    statusValue,

                course:
                    "",

                yearLevel:
                    "",

                studentNumber:
                    "",

                profileImage:
                    "",

                createdAt:
                    serverTimestamp(),

                lastLogin:
                    null

            }

        );


        // ----------------------------------------------
        // SIGN OUT SECONDARY AUTH
        // ----------------------------------------------

        await signOut(
            secondaryAuth
        );


        alert(
            "Teacher account created successfully!"
        );


        // ----------------------------------------------
        // CLOSE MODAL
        // ----------------------------------------------

        modal.style.display = "none";


        fullname.value = "";
        email.value = "";
        password.value = "";
        department.value = "";
        status.value = "active";


        loadTeachers();

    }

    catch (error) {

        console.error(
            "Create teacher error:",
            error
        );


        let message =
            error.message;


        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            message =
                "This email is already registered in Firebase Authentication.";

        }

        else if (
            error.code ===
            "auth/invalid-email"
        ) {

            message =
                "Please enter a valid email address.";

        }

        else if (
            error.code ===
            "auth/weak-password"
        ) {

            message =
                "Password must be at least 6 characters.";

        }


        alert(
            "Failed to create teacher:\n\n" +
            message
        );

    }

    finally {

        // ----------------------------------------------
        // DELETE SECONDARY APP
        // ----------------------------------------------

        if (secondaryApp) {

            try {

                await deleteApp(
                    secondaryApp
                );

            }

            catch (error) {

                console.log(
                    "Secondary app cleanup:",
                    error
                );

            }

        }

    }

};


// ======================================================
// EDIT TEACHER
// ======================================================

window.editTeacher = async (id) => {

    try {

        const teacherRef =
            doc(
                db,
                "users",
                id
            );


        const snapshot =
            await getDoc(
                teacherRef
            );


        if (!snapshot.exists()) {

            alert(
                "Teacher not found."
            );

            return;

        }


        const teacher =
            snapshot.data();


        editingId = id;


        fullname.value =
            teacher.fullname || "";


        email.value =
            teacher.email || "";


        department.value =
            teacher.department || "";


        status.value =
            teacher.status || "active";


        password.value = "";


        // Email is tied to Firebase Auth,
        // so don't change it here.

        email.disabled = true;


        // Password is not required while editing

        password.required = false;


        modal.style.display = "flex";

    }

    catch (error) {

        console.error(
            "Edit teacher error:",
            error
        );

        alert(
            "Failed to load teacher information."
        );

    }

};


// ======================================================
// DELETE / DEACTIVATE TEACHER
// ======================================================

window.deleteTeacher = async (id) => {

    const confirmDelete =
        confirm(
            "Delete this teacher account?\n\n" +
            "The teacher will no longer have a Firestore profile."
        );


    if (!confirmDelete) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "users",
                id
            )
        );


        alert(
            "Teacher removed from the system."
        );


        loadTeachers();

    }

    catch (error) {

        console.error(
            "Delete teacher error:",
            error
        );

        alert(
            "Failed to delete teacher:\n\n" +
            error.message
        );

    }

};


// ======================================================
// ESCAPE HTML
// Prevent HTML injection when displaying user data
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;

}