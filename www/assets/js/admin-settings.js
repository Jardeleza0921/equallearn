import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
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

const currentPassword = document.getElementById("currentPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const changePassword = document.getElementById("changePassword");
const securityMessage = document.getElementById("securityMessage");


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

// ======================================================
// CHANGE PASSWORD
// ======================================================

if (changePassword) {
    changePassword.onclick = async () => {
        if (!currentUser || !currentUser.email) return;

        const current = currentPassword.value;
        const next = newPassword.value;
        const confirm = confirmPassword.value;

        securityMessage.className = "";
        securityMessage.textContent = "";

        if (!current || !next || !confirm) {
            securityMessage.className = "error";
            securityMessage.textContent = "Complete all password fields.";
            return;
        }
        if (next.length < 6) {
            securityMessage.className = "error";
            securityMessage.textContent = "New password must contain at least 6 characters.";
            return;
        }
        if (next !== confirm) {
            securityMessage.className = "error";
            securityMessage.textContent = "New passwords do not match.";
            return;
        }

        changePassword.disabled = true;
        changePassword.textContent = "Updating...";

        try {
            const credential = EmailAuthProvider.credential(currentUser.email, current);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, next);
            currentPassword.value = "";
            newPassword.value = "";
            confirmPassword.value = "";
            securityMessage.className = "success";
            securityMessage.textContent = "Password changed successfully.";
        } catch (error) {
            console.error("Change password error:", error);
            securityMessage.className = "error";
            securityMessage.textContent = error.code === "auth/invalid-credential" ? "Current password is incorrect." : (error.message || "Unable to change password.");
        } finally {
            changePassword.disabled = false;
            changePassword.textContent = "Change Password";
        }
    };
}
