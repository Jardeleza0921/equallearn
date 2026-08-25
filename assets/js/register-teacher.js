import {
    createTeacher
} from "./auth.js";


import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const form =
    document.getElementById("teacherForm");


const message =
    document.getElementById("message");


const button =
    document.getElementById("createButton");


// ======================================================
// CHECK ADMIN ACCESS
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

            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (
                !snapshot.exists() ||
                snapshot.data().role !== "admin"
            ) {

                alert(
                    "Access Denied"
                );

                window.location.href =
                    "../login.html";

            }

        }

        catch (error) {

            console.error(error);

            alert(
                "Unable to verify account."
            );

        }

    }
);



// ======================================================
// CREATE TEACHER
// ======================================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        message.className = "";

        message.innerHTML = "";


        const fullname =
            document
                .getElementById("fullname")
                .value
                .trim();


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        const department =
            document
                .getElementById("department")
                .value
                .trim();


        if (
            !fullname ||
            !email ||
            !password ||
            !department
        ) {

            message.className = "error";

            message.innerHTML =
                "Please complete all fields.";

            return;

        }


        if (password.length < 6) {

            message.className = "error";

            message.innerHTML =
                "Password must be at least 6 characters.";

            return;

        }


        button.disabled = true;

        button.innerText =
            "Creating Teacher...";


        const result =
            await createTeacher({

                fullname: fullname,

                email: email,

                password: password,

                department: department

            });


        button.disabled = false;

        button.innerText =
            "Create Teacher";


        if (result.success) {

            message.className =
                "success";


            message.innerHTML =
                "Teacher account created successfully!";


            form.reset();


        }

        else {

            message.className =
                "error";


            let errorMessage =
                result.message;


            // Firebase friendly messages

            if (
                errorMessage.includes(
                    "auth/email-already-in-use"
                )
            ) {

                errorMessage =
                    "This email is already registered.";

            }


            if (
                errorMessage.includes(
                    "auth/invalid-email"
                )
            ) {

                errorMessage =
                    "Please enter a valid email address.";

            }


            if (
                errorMessage.includes(
                    "auth/weak-password"
                )
            ) {

                errorMessage =
                    "Password is too weak.";

            }


            message.innerHTML =
                errorMessage;

        }

    }
);