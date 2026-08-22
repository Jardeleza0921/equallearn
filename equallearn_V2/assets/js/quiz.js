import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


// ======================================================
// ELEMENTS
// ======================================================

const container =
    document.getElementById("quizContainer");

const nextBtn =
    document.getElementById("nextBtn");


// ======================================================
// GET LESSON ID
// ======================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const lessonId =
    params.get("lesson");


// ======================================================
// VARIABLES
// ======================================================

let questions = [];

let current = 0;

let score = 0;

let selected = null;

let currentUser = null;


// ======================================================
// CHECK LOGIN + LOAD QUESTIONS
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "../login.html";

        return;

    }


    currentUser = user;


    try {

        if (!lessonId) {

            container.innerHTML =
                "No lesson selected.";

            nextBtn.disabled = true;

            return;

        }


        const q = query(
            collection(db, "questions"),
            where("lessonId", "==", lessonId)
        );


        const snapshot =
            await getDocs(q);


        questions = [];


        snapshot.forEach((item) => {

            questions.push({

                id: item.id,

                ...item.data()

            });

        });


        if (questions.length === 0) {

            container.innerHTML =
                "No questions found.";

            nextBtn.disabled = true;

            return;

        }


        showQuestion();

    }

    catch (error) {

        console.error(
            "Loading quiz error:",
            error
        );

        container.innerHTML =
            "Failed to load quiz.";

    }

});


// ======================================================
// SHOW QUESTION
// ======================================================

function showQuestion() {

    if (current >= questions.length) {

        finishQuiz();

        return;

    }


    const q =
        questions[current];


    container.innerHTML = `

        <div class="question-number">

            Question ${current + 1}
            of ${questions.length}

        </div>


        <div class="question">

            <h3>
                ${escapeHTML(q.question || "")}
            </h3>

        </div>


        <div class="choices">

            <button
                type="button"
                class="choice"
                onclick="choose('A')">

                A. ${escapeHTML(q.choiceA || "")}

            </button>


            <button
                type="button"
                class="choice"
                onclick="choose('B')">

                B. ${escapeHTML(q.choiceB || "")}

            </button>


            <button
                type="button"
                class="choice"
                onclick="choose('C')">

                C. ${escapeHTML(q.choiceC || "")}

            </button>


            <button
                type="button"
                class="choice"
                onclick="choose('D')">

                D. ${escapeHTML(q.choiceD || "")}

            </button>

        </div>

    `;


    selected = null;

}


// ======================================================
// CHOOSE ANSWER
// ======================================================

window.choose = function(answer) {

    selected = answer;


    const choices =
        document.querySelectorAll(
            ".choice"
        );


    choices.forEach((button) => {

        button.classList.remove(
            "selected"
        );

    });


    const selectedButton =
        Array.from(choices)
            .find((button) => {

                return button.textContent
                    .trim()
                    .startsWith(answer + ".");

            });


    if (selectedButton) {

        selectedButton.classList.add(
            "selected"
        );

    }

};


// ======================================================
// NEXT QUESTION
// ======================================================

nextBtn.onclick = function() {

    if (selected === null) {

        alert(
            "Please select an answer."
        );

        return;

    }


    const question =
        questions[current];


    if (
        selected ===
        question.correctAnswer
    ) {

        score++;

    }


    current++;


    showQuestion();

};


// ======================================================
// FINISH QUIZ
// ======================================================

async function finishQuiz() {

    nextBtn.disabled = true;


    const total =
        questions.length;


    const percentage =
        total > 0
            ? Math.round(
                (score / total) * 100
            )
            : 0;


    // Passing mark = 75%
    const result =
        percentage >= 75
            ? "passing"
            : "failing";


    try {

        // ------------------------------------------
        // FIRESTORE DOCUMENT ID
        // One latest result per student per lesson
        // ------------------------------------------

        const progressId =
            `${currentUser.uid}_${lessonId}`;


        const progressRef =
            doc(
                db,
                "progress",
                progressId
            );


        // ------------------------------------------
        // SAVE QUIZ RESULT
        // ------------------------------------------

        await setDoc(

            progressRef,

            {

                userId:
                    currentUser.uid,

                lessonId:
                    lessonId,

                score:
                    score,

                total:
                    total,

                percentage:
                    percentage,

                result:
                    result,

                completed:
                    true,

                completedAt:
                    serverTimestamp()

            },

            {
                merge: true
            }

        );


        console.log(
            "Quiz result saved:",
            {
                score,
                total,
                percentage,
                result
            }
        );


        // ------------------------------------------
        // GO TO RESULT PAGE
        // ------------------------------------------

        window.location.href =
            `result.html?score=${score}&total=${total}&percentage=${percentage}&result=${result}`;

    }

    catch (error) {

        console.error(
            "Saving quiz result error:",
            error
        );


        nextBtn.disabled = false;


        alert(
            "Your quiz was completed, but the result could not be saved.\n\n" +
            error.message
        );

    }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;

}