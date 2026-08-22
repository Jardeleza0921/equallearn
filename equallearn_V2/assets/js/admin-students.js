import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const tableContainer =
    document.getElementById(
        "tableContainer"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


let students = [];


// ======================================================
// CHECK ADMIN
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if(!user){

            window.location.href =
                "../login.html";

            return;

        }


        try{

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "users"
                    )
                );


            const currentUser =
                snapshot.docs.find(
                    item =>
                        item.id === user.uid
                );


            if(
                !currentUser ||
                currentUser.data().role !== "admin"
            ){

                alert(
                    "Access denied. Admin only."
                );


                window.location.href =
                    "../login.html";


                return;

            }


            await loadStudents();

        }

        catch(error){

            console.error(
                "Admin verification error:",
                error
            );


            tableContainer.innerHTML =
                `
                <div class="empty">
                    Unable to verify administrator access.
                </div>
                `;

        }

    }
);


// ======================================================
// LOAD STUDENTS
// ======================================================

async function loadStudents(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        students = [];


        snapshot.forEach(
            (item) => {

                const data =
                    item.data();


                if(
                    data.role === "student"
                ){

                    students.push({

                        id:
                            item.id,

                        ...data

                    });

                }

            }
        );


        students.sort(
            (a,b) =>
                String(
                    a.fullname || ""
                )
                .localeCompare(
                    String(
                        b.fullname || ""
                    )
                )
        );


        renderStudents(
            students
        );

    }

    catch(error){

        console.error(
            "Load students error:",
            error
        );


        tableContainer.innerHTML =
            `
            <div class="empty">
                Failed to load students.
            </div>
            `;

    }

}


// ======================================================
// RENDER
// ======================================================

function renderStudents(
    list
){

    if(
        list.length === 0
    ){

        tableContainer.innerHTML =
            `
            <div class="empty">
                No registered students found.
            </div>
            `;

        return;

    }


    let html = `

        <table>

            <thead>

                <tr>

                    <th>
                        Full Name
                    </th>

                    <th>
                        Student ID
                    </th>

                    <th>
                        Institutional Email
                    </th>

                    <th>
                        Year Level
                    </th>

                    <th>
                        Course
                    </th>

                    <th>
                        Status
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    list.forEach(
        (student) => {

            html += `

                <tr>

                    <td>
                        ${escapeHTML(
                            student.fullname || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.studentNumber || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.email || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.yearLevel || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.course || "-"
                        )}
                    </td>

                    <td>

                        <span class="status">

                            ${escapeHTML(
                                student.status || "active"
                            )}

                        </span>

                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    tableContainer.innerHTML =
        html;

}


// ======================================================
// SEARCH
// ======================================================

searchInput.addEventListener(
    "input",
    () => {

        const search =
            searchInput
                .value
                .trim()
                .toLowerCase();


        if(!search){

            renderStudents(
                students
            );

            return;

        }


        const filtered =
            students.filter(
                student => {

                    return (

                        String(
                            student.fullname || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            student.studentNumber || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            student.email || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            student.course || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            student.yearLevel || ""
                        )
                        .toLowerCase()
                        .includes(search)

                    );

                }
            );


        renderStudents(
            filtered
        );

    }
);


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value){

    return String(value)

        .replaceAll("&","&amp;")

        .replaceAll("<","&lt;")

        .replaceAll(">","&gt;")

        .replaceAll('"',"&quot;")

        .replaceAll("'","&#039;");

}