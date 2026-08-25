import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const classGroupSelect =
    document.getElementById("classGroup");

const yearLevelSelect =
    document.getElementById("yearLevel");

const teacherSelect =
    document.getElementById("teacher");

const assignBtn =
    document.getElementById("assignBtn");

const message =
    document.getElementById("message");

const assignmentList =
    document.getElementById("assignmentList");


let classGroups = [];


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


        try {

            const adminSnapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (
                !adminSnapshot.exists() ||
                adminSnapshot.data().role !== "admin"
            ) {

                alert(
                    "Access denied. Admin only."
                );

                window.location.href =
                    "../login.html";

                return;
            }


            await generateClassGroups();

            await loadTeachers();

            await loadClassGroups();

            await loadAssignments();

        }

        catch (error) {

            console.error(
                "CLASS ASSIGNMENT ERROR:",
                error
            );

            showMessage(
                "error",
                "Unable to load class assignments."
            );

        }

    }
);


// ======================================================
// GENERATE CLASS GROUPS
// ======================================================

async function generateClassGroups() {

    try {

        const studentsQuery =
            query(
                collection(db, "users"),
                where("role", "==", "student")
            );


        const snapshot =
            await getDocs(
                studentsQuery
            );


        if (snapshot.empty) {

            console.log(
                "No students found."
            );

            return;
        }


        const groups = {};


        snapshot.forEach((item) => {

            const student =
                item.data();


            const studentNumber =
                String(
                    student.studentNumber || ""
                )
                .trim()
                .toUpperCase();


            const course =
                String(
                    student.course || ""
                )
                .trim()
                .toUpperCase();


            const yearLevel =
                String(
                    student.yearLevel || ""
                )
                .trim()
                .toUpperCase();


            if (
                !studentNumber ||
                !course ||
                !yearLevel
            ) {

                return;
            }


            /*
             * Example:
             *
             * 23BSIT-0601
             *
             * becomes:
             *
             * 23BSIT
             */


            const match =
                studentNumber.match(
                    /^(\d{2})([A-Z]+)/
                );


            if (!match) {

                console.warn(
                    "Unable to determine cohort:",
                    studentNumber
                );

                return;
            }


            const cohortYear =
                match[1];


            const classGroupId =
                `${cohortYear}${course}`;


            if (!groups[classGroupId]) {

                groups[classGroupId] = {

                    id:
                        classGroupId,

                    name:
                        classGroupId,

                    cohort:
                        cohortYear,

                    course:
                        course,

                    students:
                        [],

                    yearLevels:
                        new Set()

                };

            }


            groups[classGroupId]
                .students
                .push(item.id);


            groups[classGroupId]
                .yearLevels
                .add(yearLevel);

        });


        // ==================================================
        // SAVE GENERATED GROUPS
        // ==================================================

        for (
            const groupId in groups
        ) {

            const group =
                groups[groupId];


            await setDoc(

                doc(
                    db,
                    "classGroups",
                    groupId
                ),

                {

                    name:
                        group.name,

                    cohort:
                        group.cohort,

                    course:
                        group.course,

                    studentCount:
                        group.students.length,

                    yearLevels:
                        Array.from(
                            group.yearLevels
                        ),

                    status:
                        "active",

                    updatedAt:
                        serverTimestamp()

                },

                {
                    merge: true
                }

            );

        }


        console.log(
            "Class groups generated:",
            Object.keys(groups)
        );

    }

    catch (error) {

        console.error(
            "GENERATE CLASS GROUPS ERROR:",
            error
        );

        throw error;

    }

}


// ======================================================
// LOAD TEACHERS
// ======================================================

async function loadTeachers() {

    teacherSelect.innerHTML = `
        <option value="">
            Loading teachers...
        </option>
    `;

    try {

        const q = query(
            collection(db, "users"),
            where("role", "==", "teacher")
        );

        const snapshot = await getDocs(q);

        teacherSelect.innerHTML = `
            <option value="">
                Select Teacher
            </option>
        `;

        let teacherCount = 0;

        snapshot.forEach((item) => {

            const teacher = item.data();

            // Only active teachers
            if (teacher.status !== "active") {
                return;
            }

            const option =
                document.createElement("option");

            option.value = item.id;

            option.textContent =
                teacher.fullname ||
                teacher.email ||
                "Teacher";

            teacherSelect.appendChild(option);

            teacherCount++;

        });

        if (teacherCount === 0) {

            teacherSelect.innerHTML = `
                <option value="">
                    No active teachers found
                </option>
            `;

        }

    }

    catch (error) {

        console.error(
            "LOAD TEACHERS ERROR:",
            error
        );

        teacherSelect.innerHTML = `
            <option value="">
                Unable to load teachers
            </option>
        `;

    }

}


// ======================================================
// LOAD CLASS GROUPS
// ======================================================

async function loadClassGroups() {

    classGroupSelect.innerHTML = `
        <option value="">
            Select Class Group
        </option>
    `;


    const snapshot =
        await getDocs(
            collection(
                db,
                "classGroups"
            )
        );


    classGroups = [];


    snapshot.forEach(
        (item) => {

            const group =
                item.data();


            classGroups.push({

                id:
                    item.id,

                ...group

            });


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                item.id;


           option.textContent =
    group.name || item.id;

            classGroupSelect.appendChild(
                option
            );

        }
    );


    if (
        classGroups.length === 0
    ) {

        classGroupSelect.innerHTML = `
            <option value="">
                No class groups found
            </option>
        `;

    }

}


// ======================================================
// ASSIGN TEACHER
// ======================================================

assignBtn.onclick =
    async () => {

        const classGroupId =
            classGroupSelect.value;

        const yearLevel =
            yearLevelSelect.value;

        const teacherId =
            teacherSelect.value;


        if (
            !classGroupId ||
            !yearLevel ||
            !teacherId
        ) {

            showMessage(
                "error",
                "Please select the class, year level, and teacher."
            );

            return;
        }


        assignBtn.disabled = true;

        assignBtn.textContent =
            "Assigning...";


        try {

            const teacherSnapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        teacherId
                    )
                );


            if (
                !teacherSnapshot.exists()
            ) {

                throw new Error(
                    "Teacher account not found."
                );

            }


            const teacher =
                teacherSnapshot.data();


            const group =
                classGroups.find(
                    item =>
                        item.id ===
                        classGroupId
                );


            if (!group) {

                throw new Error(
                    "Class group not found."
                );

            }


            /*
             * IMPORTANT
             *
             * Same classmates/cohort can have
             * a different teacher every year.
             *
             * Example:
             *
             * 23BSIT + 3L = Teacher A
             * 23BSIT + 4L = Teacher B
             */


            const assignmentId =
                `${classGroupId}_${yearLevel}`;


            await setDoc(

                doc(
                    db,
                    "teacherAssignments",
                    assignmentId
                ),

                {

                    classGroupId:
                        classGroupId,

                    className:
                        group.name ||
                        classGroupId,

                    course:
                        group.course ||
                        "",

                    cohort:
                        group.cohort ||
                        "",

                    yearLevel:
                        yearLevel,

                    teacherId:
                        teacherId,

                    teacherName:
                        teacher.fullname ||
                        teacher.email ||
                        "",

                    status:
                        "active",

                    assignedAt:
                        serverTimestamp()

                }

            );


            showMessage(
                "success",
                "Teacher assigned successfully."
            );


            await loadAssignments();

        }

        catch (error) {

            console.error(
                "ASSIGN TEACHER ERROR:",
                error
            );


            showMessage(
                "error",
                error.message
            );

        }


        assignBtn.disabled = false;

        assignBtn.textContent =
            "Assign Teacher";

    };


// ======================================================
// LOAD CURRENT ASSIGNMENTS
// ======================================================

async function loadAssignments() {

    assignmentList.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="loading">

                Loading...

            </td>
        </tr>
    `;


    const snapshot =
        await getDocs(
            collection(
                db,
                "teacherAssignments"
            )
        );


    if (snapshot.empty) {

        assignmentList.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="loading">

                    No teacher assignments yet.

                </td>
            </tr>
        `;

        return;
    }


    assignmentList.innerHTML = "";


    snapshot.forEach(
        (item) => {

            const data =
                item.data();


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        data.className ||
                        data.classGroupId ||
                        "—"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        data.course ||
                        "—"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        data.yearLevel ||
                        "—"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        data.teacherName ||
                        "—"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        data.status ||
                        "active"
                    )}
                </td>

            `;


            assignmentList.appendChild(
                row
            );

        }
    );

}


// ======================================================
// MESSAGE
// ======================================================

function showMessage(
    type,
    text
) {

    message.className =
        type;

    message.textContent =
        text;

}


// ======================================================
// SECURITY
// ======================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}