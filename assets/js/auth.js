// ======================================================
// FIREBASE
// ======================================================

import {
    app,
    auth,
    db,
    firebaseConfig
} from "./firebase-config.js";


import {
    createUserWithEmailAndPassword,
    deleteUser,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


import {
    initializeApp,
    deleteApp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";


import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


// ======================================================
// REGISTRATION ERROR MESSAGES
// ======================================================

function registerErrorMessage(error) {

    const code = error?.code || "";

    if (code === "auth/email-already-in-use") {
        return "This email is already registered. Sign in instead, or register with a different email address.";
    }
    if (code === "auth/invalid-email") {
        return "Enter a valid email address, for example name@school.edu.ph.";
    }
    if (code === "auth/weak-password") {
        return "Choose a password with at least 6 characters.";
    }
    if (code === "auth/operation-not-allowed") {
        return "Email and password registration is not enabled for this Firebase project.";
    }
    if (code === "auth/too-many-requests") {
        return "Too many attempts. Wait a few minutes, then try again.";
    }
    if (code === "auth/network-request-failed") {
        return "Network problem. Check your connection and try again.";
    }

    return error?.message || "Unable to create the account.";

}


function profileSaveReason(error) {

    const code = error?.code || "";

    if (code === "permission-denied") {
        return "The database rejected the profile save (missing or insufficient permissions).";
    }
    if (code === "unavailable") {
        return "The database was unreachable.";
    }

    return "The profile could not be saved.";

}


// ======================================================
// STUDENT REGISTER
// ======================================================

export async function registerUser(userData) {

    let credential = null;

    try {

        // --------------------------------------------------
        // CLEAN DATA
        // --------------------------------------------------

        const email = userData.email.trim().toLowerCase();

        const studentNumber = userData.studentNumber.trim().toUpperCase();

        const fullname = userData.fullname.trim();

        const course = userData.course.trim().toUpperCase();

        const yearLevel = userData.yearLevel.trim();


        // ==================================================
        // EXTRACT COHORT
        //
        // 23BSIT-0601 → 23
        // 24BSIT-0601 → 24
        // ==================================================

        const cohort = studentNumber.substring(0, 2);


        // ==================================================
        // CREATE FIREBASE AUTH ACCOUNT FIRST
        //
        // The account has to exist before Firestore is
        // touched. Reading the users collection while signed
        // out is rejected with "Missing or insufficient
        // permissions".
        //
        // Firebase Authentication keeps emails unique. Student
        // numbers are NOT checked for duplicates, and no name,
        // course, year level, or section is compared with other
        // students.
        // ==================================================

        try {

            credential = await createUserWithEmailAndPassword(
                auth,
                email,
                userData.password
            );

        }

        catch (error) {

            return {
                success: false,
                code: error.code || "",
                message: registerErrorMessage(error)
            };

        }


        const uid = credential.user.uid;


        // ==================================================
        // FIND / CREATE CLASS GROUP
        //
        // SAME COHORT + SAME COURSE
        //
        // Example:
        //
        // 23BSIT-0601
        // 23BSIT-0602
        // 23BSIT-0603
        //
        // all become:
        //
        // 23_BSIT_A
        //
        // This is optional bookkeeping, so a failure here must
        // not stop the student profile from being saved.
        // ==================================================

        let classGroupId = `${cohort}_${course}_A`;

        try {

            const classGroupsRef = collection(db, "classGroups");

            const classGroupQuery = query(
                classGroupsRef,
                where("cohort", "==", cohort),
                where("course", "==", course)
            );

            const classGroupSnapshot = await getDocs(classGroupQuery);

            if (!classGroupSnapshot.empty) {

                classGroupId = classGroupSnapshot.docs[0].id;

            }

            else {

                await setDoc(
                    doc(db, "classGroups", classGroupId),
                    {
                        cohort: cohort,
                        course: course,
                        section: "A",
                        name: `${cohort}${course}-A`,
                        status: "active",
                        createdAt: serverTimestamp()
                    }
                );

            }

        }

        catch (error) {

            console.warn("Class group update skipped:", error);

        }


        // ==================================================
        // CREATE STUDENT FIRESTORE PROFILE
        //
        // The document id is the new Firebase Authentication
        // uid, so the profile always belongs to this account.
        // ==================================================

        try {

            await setDoc(
                doc(db, "users", uid),
                {
                    uid: uid,
                    fullname: fullname,
                    studentNumber: studentNumber,
                    email: email,
                    yearLevel: yearLevel,
                    course: course,
                    cohort: cohort,
                    classGroupId: classGroupId,
                    role: "student",
                    status: "active",
                    profileImage: "",
                    department: "",
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                }
            );

        }

        catch (error) {

            console.error("PROFILE SAVE ERROR:", error);

            const reason = profileSaveReason(error);

            let rolledBack = false;

            try {

                // Remove the just-created sign-in account so the
                // email is not left unusable and no half-created
                // account remains.
                await deleteUser(credential.user);

                rolledBack = true;

            }

            catch (rollbackError) {

                console.error("Registration rollback error:", rollbackError);

                try { await signOut(auth); }

                catch (signOutError) { console.error("Sign-out error:", signOutError); }

            }

            return {
                success: false,
                code: error.code || "",
                message: rolledBack
                    ? `We could not save your student profile, so the new sign-in account was removed. ${reason} Please try again.`
                    : `Your sign-in account was created, but your student profile could not be saved. ${reason} Contact an administrator with your email address (${email}) before signing in again.`
            };

        }


        // ==================================================
        // SUCCESS
        // ==================================================

        return {
            success: true,
            uid: uid,
            classGroupId: classGroupId
        };

    }

    catch (error) {

        console.error("REGISTER ERROR:", error);

        return {
            success: false,
            message: error.message
        };

    }

}



// ======================================================
// LOGIN
// ======================================================

export async function loginUser(
    email,
    password
) {

    try {

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const uid =
            credential.user.uid;


        const userRef =
            doc(
                db,
                "users",
                uid
            );


        const snapshot =
            await getDoc(
                userRef
            );


        if (
            !snapshot.exists()
        ) {

            await signOut(auth);

            return {

                success: false,

                message:
                    "User account was authenticated, but no matching Firestore user was found."

            };

        }


        const userData =
            snapshot.data();


        if (
            !userData.role
        ) {

            await signOut(auth);

            return {

                success: false,

                message:
                    "Account role is missing in Firestore."

            };

        }


        if (
            userData.status === "inactive"
        ) {

            await signOut(auth);

            return {

                success: false,

                message:
                    "This account is inactive."

            };

        }


        await updateDoc(

            userRef,

            {

                lastLogin:
                    serverTimestamp()

            }

        );


        return {

            success: true,

            user:
                userData

        };

    }


    catch (error) {

        console.error(
            "Login error:",
            error
        );


        return {

            success: false,

            message:
                error.message

        };

    }

}



// ======================================================
// ADMIN → CREATE TEACHER
// ======================================================

export async function createTeacher(
    teacherData
) {

    let secondaryApp = null;


    try {

        // --------------------------------------------------
        // CURRENT USER
        // --------------------------------------------------

        const adminUser =
            auth.currentUser;


        if (
            !adminUser
        ) {

            return {

                success: false,

                message:
                    "You must be logged in as an admin."

            };

        }


        // --------------------------------------------------
        // CHECK ADMIN ROLE
        // --------------------------------------------------

        const adminRef =
            doc(
                db,
                "users",
                adminUser.uid
            );


        const adminSnapshot =
            await getDoc(
                adminRef
            );


        if (
            !adminSnapshot.exists()
        ) {

            return {

                success: false,

                message:
                    "Admin profile was not found."

            };

        }


        const adminData =
            adminSnapshot.data();


        if (
            adminData.role !== "admin"
        ) {

            return {

                success: false,

                message:
                    "Access denied. Only administrators can create teachers."

            };

        }


        // --------------------------------------------------
        // SECONDARY FIREBASE APP
        // --------------------------------------------------

        const appName =
            "teacherCreator_" +
            Date.now();


        secondaryApp =
            initializeApp(
                firebaseConfig,
                appName
            );


        const secondaryAuth =
            getAuth(
                secondaryApp
            );


        // --------------------------------------------------
        // CREATE AUTH ACCOUNT
        // --------------------------------------------------

        const credential =
            await createUserWithEmailAndPassword(

                secondaryAuth,

                teacherData.email
                    .trim()
                    .toLowerCase(),

                teacherData.password

            );


        const uid =
            credential.user.uid;


        // --------------------------------------------------
        // CREATE TEACHER PROFILE
        // --------------------------------------------------

        await setDoc(

            doc(
                db,
                "users",
                uid
            ),

            {

                uid:
                    uid,

                fullname:
                    teacherData.fullname,

                email:
                    teacherData.email
                        .trim()
                        .toLowerCase(),

                role:
                    "teacher",

                status:
                    teacherData.status ||
                    "active",

                department:
                    teacherData.department ||
                    "",

                course:
                    "",

                yearLevel:
                    "",

                studentNumber:
                    "",

                profileImage:
                    "",

                createdAt:
                    serverTimestamp(),

                lastLogin:
                    null

            }

        );


        await signOut(
            secondaryAuth
        );


        return {

            success: true,

            uid:
                uid

        };

    }


    catch (error) {

        console.error(
            "Create teacher error:",
            error
        );


        return {

            success: false,

            message:
                error.message

        };

    }


    finally {

        if (
            secondaryApp
        ) {

            try {

                await deleteApp(
                    secondaryApp
                );

            }

            catch (error) {

                console.log(
                    "Secondary app cleanup:",
                    error
                );

            }

        }

    }

}



// ======================================================
// LOGOUT
// ======================================================

export async function logoutUser() {

    await signOut(
        auth
    );

}



// ======================================================
// RESET PASSWORD
// ======================================================

export async function resetPassword(
    email
) {

    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        return {

            success: true

        };

    }


    catch (error) {

        return {

            success: false,

            message:
                error.message

        };

    }

}



// ======================================================
// CHECK AUTH
// ======================================================

export function checkAuth(
    callback
) {

    onAuthStateChanged(
        auth,
        callback
    );

}