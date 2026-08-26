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

        await loadStudentProgress(user.uid);

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

    const cohort = String(student.cohort || student.cohortId || "");
    const course = String(student.course || "");
    const yearLevel = String(student.yearLevel || "");

    if (!cohort || !course || !yearLevel) return;

    try {
        // Admin Class Assignments are stored in teacherAssignments.
        // Read the small collection and match on the client to avoid extra index requirements.
        const snapshot = await getDocs(collection(db, "teacherAssignments"));
        const record = snapshot.docs
            .map(item => item.data())
            .find(assignment =>
                (assignment.status || "active") !== "inactive" &&
                String(assignment.cohort || "") === cohort &&
                String(assignment.course || "") === course &&
                String(assignment.yearLevel || "") === yearLevel
            );

        if (!record) return;

        studentSection.textContent =
            record.className ||
            record.section ||
            `${cohort}${course} · ${yearLevel}`;

        studentTeacher.textContent =
            record.teacherName ||
            "Not yet assigned";
    }
    catch (error) {
        console.error("Class assignment error:", error);
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

// ======================================================
// LIVE STUDENT PROGRESS SUMMARY
// ======================================================
async function loadStudentProgress(uid) {
    const ring = document.getElementById("studentProgressRing");
    const percentEl = document.getElementById("studentProgressPercent");
    const bar = document.getElementById("studentProgressBar");
    const title = document.getElementById("studentProgressTitle");
    const meta = document.getElementById("studentProgressMeta");
    if (!ring || !percentEl || !bar) return;
    try {
        const [questionSnapshot, progressSnapshot] = await Promise.all([
            getDocs(collection(db, "questions")),
            getDocs(query(collection(db, "progress"), where("userId", "==", uid)))
        ]);
        const quizLessonIds = new Set();
        questionSnapshot.forEach(item => { const lessonId = item.data().lessonId; if (lessonId) quizLessonIds.add(lessonId); });
        const completedLessonIds = new Set();
        let scoreTotal = 0, scoreCount = 0;
        progressSnapshot.forEach(item => {
            const data = item.data();
            if (data.completed && data.lessonId && quizLessonIds.has(data.lessonId)) completedLessonIds.add(data.lessonId);
            if (Number.isFinite(Number(data.percentage))) { scoreTotal += Number(data.percentage); scoreCount++; }
        });
        const total = quizLessonIds.size;
        const completed = completedLessonIds.size;
        const pct = total ? Math.round(completed / total * 100) : 0;
        const avg = scoreCount ? Math.round(scoreTotal / scoreCount) : 0;
        percentEl.textContent = `${pct}%`;
        bar.style.width = `${pct}%`;
        ring.style.background = `conic-gradient(var(--el-primary) 0 ${pct}%, #e1e9e3 ${pct}% 100%)`;
        title.textContent = total ? `${completed} of ${total} quizzes completed` : "No quizzes available yet";
        meta.textContent = scoreCount ? `Average quiz score: ${avg}%` : "Your quiz results will appear here after your first attempt.";
    } catch (error) {
        console.error("Student progress summary error:", error);
        title.textContent = "Progress unavailable";
        meta.textContent = "Open Progress to review saved results.";
    }
}
