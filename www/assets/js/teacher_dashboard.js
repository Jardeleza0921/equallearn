import { auth, db } from "./firebase-config.js";

import { requireRole } from "./session.js";

requireRole("teacher",(user)=>{

    document.getElementById("teacherName").innerHTML =
    user.fullname;

});

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href="../login.html";
        return;

    }

    // Teacher Information
    const teacherRef = doc(db,"users",user.uid);
    const teacherSnap = await getDoc(teacherRef);

    if(teacherSnap.exists()){

        const teacher = teacherSnap.data();

        document.getElementById("teacherName").textContent =
        teacher.fullname;

    }

    // Total Modules
    const modules = await getDocs(
        collection(db,"modules")
    );

    document.getElementById("moduleCount").textContent =
    modules.size;

    // Total Lessons
    const lessons = await getDocs(
        collection(db,"lessons")
    );

    document.getElementById("lessonCount").textContent =
    lessons.size;

    // Total Quiz Questions
    const quizzes = await getDocs(
        collection(db,"questions")
    );

    document.getElementById("quizCount").textContent =
    quizzes.size;

    // Total Students
    const students = await getDocs(
        collection(db,"users")
    );

    let totalStudents = 0;

    students.forEach((doc)=>{

        const data = doc.data();

        if(data.role==="student"){

            totalStudents++;

        }

    });

    document.getElementById("studentCount").textContent =
    totalStudents;

});


// Logout
const logoutBtn = document.getElementById("logout");

if(logoutBtn){

    logoutBtn.addEventListener("click",async()=>{

        await signOut(auth);

        window.location.href="../login.html";

    });

}