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
// STUDENT REGISTER
// ======================================================

export async function registerUser(userData) {

    try {

        // --------------------------------------------------
        // CLEAN DATA
        // --------------------------------------------------

        const email =
            userData.email
                .trim()
                .toLowerCase();


        const studentNumber =
            userData.studentNumber
                .trim()
                .toUpperCase();


        const fullname =
            userData.fullname
                .trim();


        const course =
            userData.course
                .trim()
                .toUpperCase();


        const yearLevel =
            userData.yearLevel
                .trim()
                .toUpperCase();


        // ==================================================
        // EXTRACT COHORT
        //
        // 23BSIT-0601 → 23
        // 24BSIT-0601 → 24
        // ==================================================

        const cohort =
            studentNumber.substring(0, 2);


        // ==================================================
        // CHECK IF STUDENT ID ALREADY EXISTS
        // ==================================================

        const usersRef =
            collection(
                db,
                "users"
            );


        const studentQuery =
            query(
                usersRef,
                where(
                    "studentNumber",
                    "==",
                    studentNumber
                )
            );


        const studentSnapshot =
            await getDocs(
                studentQuery
            );


        if (
            !studentSnapshot.empty
        ) {

            return {

                success: false,

                message:
                    "Student ID is already registered."

            };

        }


        // ==================================================
        // CREATE FIREBASE AUTH ACCOUNT
        // ==================================================

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                userData.password
            );


        const uid =
            credential.user.uid;


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
        // ==================================================

        const classGroupsRef =
            collection(
                db,
                "classGroups"
            );


        const classGroupQuery =
            query(
                classGroupsRef,

                where(
                    "cohort",
                    "==",
                    cohort
                ),

                where(
                    "course",
                    "==",
                    course
                )
            );


        const classGroupSnapshot =
            await getDocs(
                classGroupQuery
            );


        let classGroupId;


        // ==================================================
        // EXISTING CLASS GROUP
        // ==================================================

        if (
            !classGroupSnapshot.empty
        ) {

            classGroupId =
                classGroupSnapshot.docs[0].id;

        }


        // ==================================================
        // CREATE NEW CLASS GROUP
        // ==================================================

        else {

            classGroupId =
                `${cohort}_${course}_A`;


            await setDoc(

                doc(
                    db,
                    "classGroups",
                    classGroupId
                ),

                {

                    cohort:
                        cohort,

                    course:
                        course,

                    section:
                        "A",

                    name:
                        `${cohort}${course}-A`,

                    status:
                        "active",

                    createdAt:
                        serverTimestamp()

                }

            );

        }


        // ==================================================
        // CREATE STUDENT FIRESTORE PROFILE
        // ==================================================

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
                    fullname,

                studentNumber:
                    studentNumber,

                email:
                    email,

                yearLevel:
                    yearLevel,

                course:
                    course,

                cohort:
                    cohort,

                classGroupId:
                    classGroupId,

                role:
                    "student",

                status:
                    "active",

                profileImage:
                    "",

                department:
                    "",

                createdAt:
                    serverTimestamp(),

                lastLogin:
                    serverTimestamp()

            }

        );


        // ==================================================
        // SUCCESS
        // ==================================================

        return {

            success: true,

            uid:
                uid,

            classGroupId:
                classGroupId

        };

    }


    catch (error) {

        console.error(
            "REGISTER ERROR:",
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