import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const table =
    document.getElementById(
        "reportsTable"
    );


const totalStudents =
    document.getElementById(
        "totalStudents"
    );


const passingStudents =
    document.getElementById(
        "passingStudents"
    );


const failingStudents =
    document.getElementById(
        "failingStudents"
    );


const activeStudents =
    document.getElementById(
        "activeStudents"
    );


const searchStudent =
    document.getElementById(
        "searchStudent"
    );


const courseFilter =
    document.getElementById(
        "courseFilter"
    );


const yearFilter =
    document.getElementById(
        "yearFilter"
    );


const resultFilter =
    document.getElementById(
        "resultFilter"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


let reports = [];


// ======================================================
// AUTH CHECK
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

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userRef
                );


            if (
                !userSnapshot.exists() ||
                userSnapshot.data().role !== "admin"
            ) {

                alert(
                    "Access denied. Admins only."
                );

                window.location.href =
                    "../login.html";

                return;

            }


            await loadReports();

        }

        catch (error) {

            console.error(
                "Admin reports auth error:",
                error
            );

            table.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="empty">

                        Unable to load reports.

                    </td>
                </tr>
            `;

        }

    }
);


// ======================================================
// LOAD REPORTS
// ======================================================

async function loadReports() {

    table.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="loading">

                Loading reports...

            </td>
        </tr>
    `;


    const usersSnapshot =
        await getDocs(
            collection(
                db,
                "users"
            )
        );


    const progressSnapshot =
        await getDocs(
            collection(
                db,
                "progress"
            )
        );


    // ----------------------------------------------
    // GROUP PROGRESS BY USER
    // ----------------------------------------------

    const progressByUser = {};


    progressSnapshot.forEach(
        (item) => {

            const data =
                item.data();


            if (!data.userId) {

                return;

            }


            if (
                !progressByUser[
                    data.userId
                ]
            ) {

                progressByUser[
                    data.userId
                ] = [];

            }


            progressByUser[
                data.userId
            ].push(data);

        }
    );


    reports = [];


    // ----------------------------------------------
    // STUDENTS ONLY
    // ----------------------------------------------

    usersSnapshot.forEach(
        (item) => {

            const user =
                item.data();


            if (
                user.role !== "student"
            ) {

                return;

            }


            const progress =
                progressByUser[
                    item.id
                ] || [];


            let grade = 0;


            if (
                progress.length > 0
            ) {

                const totalPercentage =
                    progress.reduce(
                        (
                            sum,
                            quiz
                        ) => {

                            return sum +
                                Number(
                                    quiz.percentage || 0
                                );

                        },
                        0
                    );


                grade =
                    Math.round(
                        totalPercentage /
                        progress.length
                    );

            }


            const result =
                grade >= 75
                    ? "passing"
                    : "failing";


            reports.push({

                id:
                    item.id,

                fullname:
                    user.fullname || "Unknown Student",

                studentNumber:
                    user.studentNumber || "—",

                email:
                    user.email || "",

                course:
                    user.course || "—",

                yearLevel:
                    user.yearLevel || "—",

                grade:
                    grade,

                result:
                    result,

                schoolStatus:
                    user.schoolStatus ||
                    "active"

            });

        }
    );


    updateFilters();

    renderReports();

}


// ======================================================
// RENDER REPORTS
// ======================================================

function renderReports() {

    const search =
        searchStudent.value
            .trim()
            .toLowerCase();


    const course =
        courseFilter.value;


    const year =
        yearFilter.value;


    const result =
        resultFilter.value;


    const schoolStatus =
        statusFilter.value;


    const filtered =
        reports.filter(
            (student) => {


                const matchesSearch =
                    !search ||

                    student.fullname
                        .toLowerCase()
                        .includes(search)

                    ||

                    student.studentNumber
                        .toLowerCase()
                        .includes(search);


                const matchesCourse =
                    !course ||
                    student.course === course;


                const matchesYear =
                    !year ||
                    student.yearLevel === year;


                const matchesResult =
                    !result ||
                    student.result === result;


                const matchesStatus =
                    !schoolStatus ||
                    student.schoolStatus ===
                    schoolStatus;


                return (
                    matchesSearch &&
                    matchesCourse &&
                    matchesYear &&
                    matchesResult &&
                    matchesStatus
                );

            }
        );


    updateSummary();


    if (filtered.length === 0) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty">

                    No students found.

                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML = "";


    filtered.forEach(
        (student) => {


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <div
                        class="student-name">

                        ${escapeHTML(
                            student.fullname
                        )}

                    </div>

                    <div
                        class="student-email">

                        ${escapeHTML(
                            student.email
                        )}

                    </div>

                </td>


                <td>

                    ${escapeHTML(
                        student.studentNumber
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        student.course
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        student.yearLevel
                    )}

                </td>


                <td>

                    <span class="grade">

                        ${student.grade}%

                    </span>

                </td>


                <td>

                    <span class="badge ${
                        student.result === "passing"
                            ? "badge-passing"
                            : "badge-failing"
                    }">

                        ${
                            student.result === "passing"
                                ? "PASSING"
                                : "FAILING"
                        }

                    </span>

                </td>


                <td>

                    <span class="badge ${
                        student.schoolStatus === "active"
                            ? "badge-active"
                            : "badge-inactive"
                    }">

                        ${
                            student.schoolStatus === "active"
                                ? "ACTIVE"
                                : "INACTIVE"
                        }

                    </span>

                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


// ======================================================
// SUMMARY
// ======================================================

function updateSummary() {

    totalStudents.textContent =
        reports.length;


    passingStudents.textContent =
        reports.filter(
            student =>
                student.result ===
                "passing"
        ).length;


    failingStudents.textContent =
        reports.filter(
            student =>
                student.result ===
                "failing"
        ).length;


    activeStudents.textContent =
        reports.filter(
            student =>
                student.schoolStatus ===
                "active"
        ).length;

}


// ======================================================
// FILTER OPTIONS
// ======================================================

function updateFilters() {

    const courses =
        [
            ...new Set(
                reports
                    .map(
                        student =>
                            student.course
                    )
                    .filter(
                        value =>
                            value !== "—"
                    )
            )
        ];


    const years =
        [
            ...new Set(
                reports
                    .map(
                        student =>
                            student.yearLevel
                    )
                    .filter(
                        value =>
                            value !== "—"
                    )
            )
        ];


    courses.forEach(
        (course) => {

            courseFilter.innerHTML += `
                <option
                    value="${escapeHTML(course)}">

                    ${escapeHTML(course)}

                </option>
            `;

        }
    );


    years.forEach(
        (year) => {

            yearFilter.innerHTML += `
                <option
                    value="${escapeHTML(year)}">

                    ${escapeHTML(year)}

                </option>
            `;

        }
    );

}


// ======================================================
// FILTER EVENTS
// ======================================================

searchStudent.oninput =
    renderReports;


courseFilter.onchange =
    renderReports;


yearFilter.onchange =
    renderReports;


resultFilter.onchange =
    renderReports;


statusFilter.onchange =
    renderReports;


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;

}