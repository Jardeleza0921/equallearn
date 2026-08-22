import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


// ======================================================
// ELEMENTS
// ======================================================

const studentName =
    document.getElementById("studentName");

const studentSection =
    document.getElementById("studentSection");

const studentTeacher =
    document.getElementById("studentTeacher");

const studentCohort =
    document.getElementById("studentCohort");

const notificationList =
    document.getElementById("notificationList");

const notificationCount =
    document.getElementById("notificationCount");


// ======================================================
// AUTH CHECK
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "../login.html";

        return;
    }

    try {

        await loadStudent(user.uid);

        await loadNotifications(user.uid);

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

});


// ======================================================
// LOAD STUDENT PROFILE
// ======================================================

async function loadStudent(uid) {

    const userRef =
        doc(db, "users", uid);

    const userSnapshot =
        await getDoc(userRef);


    if (!userSnapshot.exists()) {

        console.error(
            "Student profile not found."
        );

        studentName.textContent =
            "Student";

        studentSection.textContent =
            "Not assigned";

        studentTeacher.textContent =
            "Not yet assigned";

        studentCohort.textContent =
            "Not assigned";

        return;
    }


    const student =
        userSnapshot.data();


    // Student name

    studentName.textContent =
        student.fullname ||
        "Student";


    // Student cohort

    const cohort =
        student.cohort ||
        student.cohortId ||
        "";


    studentCohort.textContent =
        cohort ||
        "Not assigned";


    // Default class information

    studentSection.textContent =
        "Not assigned";

    studentTeacher.textContent =
        "Not yet assigned";


    // Find student's class

    await findClassAssignment(student);

}


// ======================================================
// FIND CLASS ASSIGNMENT
// ======================================================

async function findClassAssignment(student) {

    const cohort =
        student.cohort ||
        student.cohortId ||
        "";

    const course =
        student.course ||
        "";

    const yearLevel =
        student.yearLevel ||
        "";


    if (
        !cohort ||
        !course ||
        !yearLevel
    ) {

        return;
    }


    try {

        const assignmentQuery =
            query(
                collection(
                    db,
                    "classAssignments"
                ),

                where(
                    "cohort",
                    "==",
                    cohort
                ),

                where(
                    "yearLevel",
                    "==",
                    yearLevel
                ),

                limit(1)
            );


        const snapshot =
            await getDocs(
                assignmentQuery
            );


        if (snapshot.empty) {

            return;
        }


        const assignment =
            snapshot.docs[0].data();


        // Section

        const section =
            assignment.section ||
            `${course}-${yearLevel}`;


        studentSection.textContent =
            section;


        // Teacher

        studentTeacher.textContent =
            assignment.teacherName ||
            "Not yet assigned";

    }

    catch (error) {

        console.error(
            "Class assignment error:",
            error
        );

    }

}


// ======================================================
// LOAD NOTIFICATIONS
// ======================================================

async function loadNotifications(uid) {

    try {

        const notificationQuery =
            query(
                collection(
                    db,
                    "notifications"
                ),

                where(
                    "userId",
                    "==",
                    uid
                ),

                orderBy(
                    "createdAt",
                    "desc"
                ),

                limit(5)
            );


        const snapshot =
            await getDocs(
                notificationQuery
            );


        notificationList.innerHTML =
            "";


        if (snapshot.empty) {

            notificationList.innerHTML = `
                <p class="empty-notification">
                    No notifications yet.
                </p>
            `;

            notificationCount.textContent =
                "0";

            return;
        }


        let unreadCount = 0;


        snapshot.forEach((item) => {

            const data =
                item.data();


            if (data.read === false) {

                unreadCount++;

            }


            const notification =
                document.createElement("div");


            notification.className =
                data.read === false
                    ? "notification unread"
                    : "notification";


            notification.innerHTML = `

                <div class="notification-title">
                    ${data.title || "Notification"}
                </div>

                <div class="notification-message">
                    ${data.message || ""}
                </div>

                <div class="notification-time">
                    ${formatDate(data.createdAt)}
                </div>

            `;


            notificationList.appendChild(
                notification
            );

        });


        notificationCount.textContent =
            unreadCount;

    }

    catch (error) {

        console.error(
            "Notification error:",
            error
        );

        notificationList.innerHTML = `
            <p class="empty-notification">
                Unable to load notifications.
            </p>
        `;

    }

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(timestamp) {

    if (!timestamp) {

        return "Recently";

    }


    try {

        const date =
            timestamp.toDate();


        return date.toLocaleString(
            "en-PH",
            {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
            }
        );

    }

    catch {

        return "Recently";

    }

}