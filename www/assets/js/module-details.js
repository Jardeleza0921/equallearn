import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const moduleId = params.get("module");

const title = document.getElementById("moduleTitle");

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href="../login.html";
        return;

    }

    if(!moduleId){

        alert("Module not found.");
        window.location.href="modules.html";
        return;

    }

    const snapshot = await getDoc(
        doc(db,"modules",moduleId)
    );

    if(snapshot.exists()){

        const module = snapshot.data();

        title.textContent = module.title;

    }else{

        alert("Module not found.");
        window.location.href="modules.html";

    }

});