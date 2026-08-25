import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

export function requireRole(role, callback){

    onAuthStateChanged(auth, async(user)=>{

        if(!user){

            window.location.href="../login.html";
            return;

        }

        try{

            const snapshot = await getDoc(
                doc(db,"users",user.uid)
            );

            if(!snapshot.exists()){

                await signOut(auth);

                window.location.href="../login.html";

                return;

            }

            const data = snapshot.data();

            const userRole =
            (data.role || "").toLowerCase();

            if(userRole !== role){

                alert("Access Denied");

                await signOut(auth);

                window.location.href="../login.html";

                return;

            }

            callback(data);

        }

        catch(error){

            console.log(error);

            window.location.href="../login.html";

        }

    });

}