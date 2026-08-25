import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


// ======================================================
// ELEMENTS
// ======================================================

const teacherCount =
    document.getElementById("teacherCount");

const studentCount =
    document.getElementById("studentCount");

const moduleCount =
    document.getElementById("moduleCount");

const lessonCount =
    document.getElementById("lessonCount");

const adminName =
    document.getElementById("adminName");

const logoutBtn =
    document.getElementById("logout");


// ======================================================
// CHECK LOGIN
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";

        return;
    }


    try {

        // ==================================================
        // GET ADMIN PROFILE USING UID AS DOCUMENT ID
        // ==================================================

        const userRef =
            doc(db, "users", user.uid);

        const userSnapshot =
            await getDoc(userRef);


        if (!userSnapshot.exists()) {

            alert("User profile not found.");

            await signOut(auth);

            window.location.href =
                "../login.html";

            return;
        }


        const userData =
            userSnapshot.data();


        // ==================================================
        // ADMIN ONLY
        // ==================================================

        if (userData.role !== "admin") {

            alert(
                "Access denied. Admin account required."
            );

            await signOut(auth);

            window.location.href =
                "../login.html";

            return;
        }


        // ==================================================
        // ADMIN NAME
        // ==================================================

        if (adminName) {

            adminName.textContent =
                userData.fullname ||
                user.email ||
                "Administrator";

        }


        // ==================================================
        // LOAD DASHBOARD COUNTS
        // ==================================================

        await loadDashboardCounts();


    }

    catch (error) {

        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );

        alert(
            "Unable to load dashboard data."
        );

    }

});


// ======================================================
// LOAD COUNTS
// ======================================================

async function loadDashboardCounts() {

    // --------------------------------------------------
    // TEACHERS
    // --------------------------------------------------

    const teacherSnapshot =
        await getDocs(
            query(
                collection(db, "users"),
                where("role", "==", "teacher")
            )
        );


    teacherCount.textContent =
        teacherSnapshot.size;


    // --------------------------------------------------
    // STUDENTS
    // --------------------------------------------------

    const studentSnapshot =
        await getDocs(
            query(
                collection(db, "users"),
                where("role", "==", "student")
            )
        );


    studentCount.textContent =
        studentSnapshot.size;


    // --------------------------------------------------
    // MODULES
    // --------------------------------------------------

    const moduleSnapshot =
        await getDocs(
            collection(db, "modules")
        );


    moduleCount.textContent =
        moduleSnapshot.size;


    // --------------------------------------------------
    // LESSONS
    // --------------------------------------------------

    const lessonSnapshot =
        await getDocs(
            collection(db, "lessons")
        );


    lessonCount.textContent =
        lessonSnapshot.size;
}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            try {

                await signOut(auth);

                window.location.href =
                    "../login.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Unable to logout."
                );

            }

        }
    );

}