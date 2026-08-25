import { loginUser } from "./auth.js";

import {
    showLoadingScreen
} from "./loading-screen.js";

const form =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");


form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        const button =
            form.querySelector("button");


        button.disabled = true;

        button.innerText =
            "Logging in...";


        message.className = "";

        message.innerHTML = "";


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        const result =
            await loginUser(
                email,
                password
            );


        button.disabled = false;

        button.innerText =
            "Login";


        // ================================================
        // LOGIN FAILED
        // ================================================

        if (!result.success) {

            message.className =
                "error";

            message.innerHTML =
                result.message;

            return;

        }


        // ================================================
        // LOGIN SUCCESS
        // ================================================

        showLoadingScreen(
    "Welcome to EqualLearn!"
);

const role =
    (result.user.role || "")
        .toLowerCase();


        console.log(
            "FINAL LOGIN ROLE:",
            role
        );


        // ================================================
        // ADMIN
        // ================================================

        if (role === "admin") {

            setTimeout(
                () => {

                    window.location.href =
                        "admin/dashboard.html";

                },
                500
            );

            return;

        }


        // ================================================
        // TEACHER
        // ================================================

        if (
            role === "teacher" ||
            role === "instructor"
        ) {

            setTimeout(
                () => {

                    window.location.href =
                        "teacher/dashboard.html";

                },
                500
            );

            return;

        }


        // ================================================
        // STUDENT
        // ================================================

        if (role === "student") {

            setTimeout(
                () => {

                    window.location.href =
                        "student/dashboard.html";

                },
                500
            );

            return;

        }


        // ================================================
        // UNKNOWN ROLE
        // ================================================

        message.className =
            "error";

        message.innerHTML =
            "Invalid account role: " + role;

    }
);