import { auth, db } from "./firebase-config.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const container=document.getElementById("lessonContainer");

const params=new URLSearchParams(window.location.search);

const moduleId=params.get("module");

onAuthStateChanged(auth,async(user)=>{

if(!user){

window.location.href="../login.html";
return;

}

loadLessons();

});

async function loadLessons(){

container.innerHTML="Loading lessons...";

const q=query(

collection(db,"lessons"),

where("moduleId","==",moduleId)

);

const snapshot=await getDocs(q);

if(snapshot.empty){

container.innerHTML="<h3>No Lessons Available</h3>";

return;

}

container.innerHTML="";

snapshot.forEach(doc=>{

const lesson=doc.data();

container.innerHTML+=`

<div class="lesson-card">

<h3>${lesson.title}</h3>

<p>${lesson.description}</p>

<a class="btn"
href="${lesson.pdfUrl}"
target="_blank">

📄 Open PDF

</a>

${
lesson.videoUrl
? `<a class="btn secondary"
href="${lesson.videoUrl}"
target="_blank">

🎥 Watch Video

</a>`
:""
}

<a class="btn quiz"

href="quiz.html?lesson=${doc.id}">

📝 Take Quiz

</a>

</div>

`;

});

}