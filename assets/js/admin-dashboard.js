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
    where,
    onSnapshot
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
        watchPlatformActivity();


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

// ======================================================
// LIVE PLATFORM ACTIVITY (last 7 days)
// ======================================================
function watchPlatformActivity() {
    const bars = Array.from(document.querySelectorAll("#adminActivityChart .el-bar"));
    const labels = Array.from(document.querySelectorAll("#adminActivityLabels span"));
    const meta = document.getElementById("adminActivityMeta");
    if (!bars.length || !labels.length) return;
    const days = [];
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i=6;i>=0;i--) { const d=new Date(today); d.setDate(today.getDate()-i); days.push(d); }
    labels.forEach((el,i)=>el.textContent=days[i].toLocaleDateString(undefined,{weekday:'short'}));
    onSnapshot(collection(db,"progress"), snapshot => {
        const counts = Array(7).fill(0);
        snapshot.forEach(item => {
            const data=item.data(); const time=toMillis(data.completedAt); if(!time)return;
            const d=new Date(time); d.setHours(0,0,0,0);
            const idx=days.findIndex(day=>day.getTime()===d.getTime());
            if(idx>=0 && data.completed) counts[idx]++;
        });
        const max=Math.max(1,...counts);
        bars.forEach((bar,i)=>{ const pct=counts[i] ? Math.max(12,Math.round(counts[i]/max*100)) : 4; bar.style.height=`${pct}%`; bar.title=`${counts[i]} completion${counts[i]===1?'':'s'}`; });
        const total=counts.reduce((a,b)=>a+b,0);
        if(meta) meta.textContent=`${total} completed quiz${total===1?'':'zes'} recorded in the last 7 days.`;
    }, error => { console.error("Admin activity listener error:",error); if(meta) meta.textContent="Live activity is unavailable with the current Firestore permissions."; });
}
function toMillis(ts){ if(!ts)return 0; if(typeof ts.toMillis==='function')return ts.toMillis(); if(ts.seconds)return ts.seconds*1000; const n=new Date(ts).getTime(); return Number.isFinite(n)?n:0; }
