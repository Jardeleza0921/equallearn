import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const container = document.getElementById("modulesContainer");

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href="../login.html";

        return;

    }

    loadModules();

});

async function loadModules(){

    container.innerHTML = "<p>Loading modules...</p>";

    try{

        const q = query(

            collection(db,"modules"),

            orderBy("order","asc")

        );

        const snapshot = await getDocs(q);

        if(snapshot.empty){

            container.innerHTML = `

                <div class="module-card">

                    <h3>No Modules Yet</h3>

                    <p>Your teacher hasn't uploaded any learning modules.</p>

                </div>

            `;

            return;

        }

        container.innerHTML = "";

        snapshot.forEach((doc)=>{

            const module = doc.data();

            container.innerHTML += `

                <div class="module-card">

                    <h3>${module.title}</h3>

                    <p>${module.description}</p>

                    <button onclick="openModule('${doc.id}')">

                        Open Module

                    </button>

                </div>

            `;

        });

    }

    catch(error){

        console.log(error);

        container.innerHTML = "<p>Failed to load modules.</p>";

    }

}

window.openModule = function(id){

    window.location.href = `lesson.html?module=${id}`;

}