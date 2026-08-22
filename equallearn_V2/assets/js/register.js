import { registerUser } from "./auth.js";


// ======================================================
// FORM
// ======================================================

const form =
    document.getElementById("registerForm");

const message =
    document.getElementById("message");


// ======================================================
// PTC EMAIL DOMAIN
// ======================================================

const PTC_EMAIL_DOMAIN =
    "@paterostechnologicalcollege.edu.ph";


// ======================================================
// SHOW MESSAGE
// ======================================================

function showMessage(type, text) {

    message.className = type;

    message.innerHTML = text;

}


// ======================================================
// REGISTER
// ======================================================

form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        const button =
            form.querySelector("button");


        // ==================================================
        // GET FORM VALUES
        // ==================================================

        const fullname =
            document
                .getElementById("fullname")
                .value
                .trim();


        const studentNumber =
            document
                .getElementById("studentNumber")
                .value
                .trim()
                .toUpperCase();


        const email =
            document
                .getElementById("email")
                .value
                .trim()
                .toLowerCase();


        const yearLevel =
            document
                .getElementById("yearLevel")
                .value
                .trim();


        const course =
            document
                .getElementById("course")
                .value
                .trim()
                .toUpperCase();


        const password =
            document
                .getElementById("password")
                .value;


        // ==================================================
        // BASIC VALIDATION
        // ==================================================

        if (
            !fullname ||
            !studentNumber ||
            !email ||
            !yearLevel ||
            !course ||
            !password
        ) {

            showMessage(
                "error",
                "Please complete all fields."
            );

            return;

        }


        // ==================================================
        // PTC EMAIL
        // ==================================================

        if (
            !email.endsWith(
                PTC_EMAIL_DOMAIN
            )
        ) {

            showMessage(
                "error",
                "Only PTC institutional email addresses are allowed."
            );

            return;

        }


        // ==================================================
        // STUDENT ID FORMAT
        //
        // Example:
        // 23BSIT-0601
        // 24BSIT-0601
        // 25BSIT-0602
        // ==================================================

        const studentIdPattern =
            /^[0-9]{2}[A-Z0-9]+-[0-9]{4}$/;


        if (
            !studentIdPattern.test(
                studentNumber
            )
        ) {

            showMessage(
                "error",
                "Invalid Student ID format. Example: 23BSIT-0601"
            );

            return;

        }


        // ==================================================
        // CHECK THAT ID COURSE MATCHES SELECTED COURSE
        //
        // Example:
        // Student ID = 23BSIT-0601
        // Course = BSIT
        //
        // This prevents:
        // 23BSIT-0601 + BSCS
        // ==================================================

        const studentIdCourse =
            studentNumber
                .replace(/^[0-9]{2}/, "")
                .split("-")[0];


        if (
            studentIdCourse !== course
        ) {

            showMessage(
                "error",
                `Student ID course (${studentIdCourse}) does not match the selected course (${course}).`
            );

            return;

        }


        // ==================================================
        // PASSWORD
        // ==================================================

        if (
            password.length < 6
        ) {

            showMessage(
                "error",
                "Password must contain at least 6 characters."
            );

            return;

        }


        // ==================================================
        // START REGISTRATION
        // ==================================================

        button.disabled = true;

        button.innerText =
            "Creating Account...";


        message.className = "";

        message.innerHTML = "";


        try {

            // ==================================================
            // AUTH.JS HANDLES:
            //
            // Firebase Authentication
            // Student ID duplicate check
            // Cohort
            // Class Group
            // Firestore student profile
            // ==================================================

            const result =
                await registerUser({

                    fullname:
                        fullname,

                    studentNumber:
                        studentNumber,

                    email:
                        email,

                    yearLevel:
                        yearLevel,

                    course:
                        course,

                    password:
                        password

                });


            // ==================================================
            // SUCCESS
            // ==================================================

            if (
                result.success
            ) {

                showMessage(
                    "success",
                    "Registration successful! Redirecting to login..."
                );


                form.reset();


                setTimeout(
                    () => {

                        window.location.href =
                            "login.html";

                    },
                    1500
                );


                return;

            }


            // ==================================================
            // ERROR
            // ==================================================

            let errorMessage =
                result.message ||
                "Registration failed.";


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
                    "Student ID"
                )
            ) {

                errorMessage =
                    "This Student ID is already registered.";

            }


            showMessage(
                "error",
                errorMessage
            );

        }

        catch (error) {

            console.error(
                "Registration Error:",
                error
            );


            showMessage(
                "error",
                "Unable to create account. Please try again."
            );

        }


        // ==================================================
        // ENABLE BUTTON
        // ==================================================

        button.disabled = false;

        button.innerText =
            "Create Account";

    }
);