import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const fullname =
    document.getElementById("fullname");

const email =
    document.getElementById("email");

const role =
    document.getElementById("role");

const saveBtn =
    document.getElementById("saveBtn");

const resetPassword =
    document.getElementById("resetPassword");


let currentUser = null;


// ======================================================
// CHECK ADMIN
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login.html";

            return;

        }


        currentUser = user;


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const snapshot =
                await getDoc(userRef);


            if (!snapshot.exists()) {

                alert(
                    "Admin profile not found."
                );

                window.location.href =
                    "../login.html";

                return;

            }


            const data =
                snapshot.data();


            if (data.role !== "admin") {

                alert(
                    "Access denied. Admins only."
                );

                window.location.href =
                    "../login.html";

                return;

            }


            fullname.value =
                data.fullname || "";

            email.value =
                data.email ||
                user.email ||
                "";

            role.value =
                data.role || "admin";

        }

        catch (error) {

            console.error(
                "Settings error:",
                error
            );

            alert(
                "Unable to load account information."
            );

        }

    }
);


// ======================================================
// SAVE CHANGES
// ======================================================

saveBtn.onclick =
    async () => {

        if (!currentUser) {

            return;

        }


        const name =
            fullname.value.trim();


        if (!name) {

            alert(
                "Please enter your full name."
            );

            return;

        }


        try {

            await updateDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                ),

                {
                    fullname: name
                }

            );


            alert(
                "Settings saved successfully."
            );

        }

        catch (error) {

            console.error(
                "Save settings error:",
                error
            );

            alert(
                "Unable to save settings."
            );

        }

    };


// ======================================================
// RESET PASSWORD
// ======================================================

resetPassword.onclick =
    async () => {

        if (!currentUser) {

            return;

        }


        const userEmail =
            currentUser.email;


        if (!userEmail) {

            alert(
                "No email address is associated with this account."
            );

            return;

        }


        const confirmed =
            confirm(
                `Send password reset link to ${userEmail}?`
            );


        if (!confirmed) {

            return;

        }


        try {

            await sendPasswordResetEmail(
                auth,
                userEmail
            );


            alert(
                "Password reset link has been sent to your email."
            );

        }

        catch (error) {

            console.error(
                "Password reset error:",
                error
            );

            alert(
                error.message
            );

        }

    };