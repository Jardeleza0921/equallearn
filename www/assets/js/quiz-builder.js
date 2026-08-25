import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


// ===============================
// ELEMENTS
// ===============================

const lessonSelect = document.getElementById("lessonSelect");
const questionList = document.getElementById("questionList");

const modal = document.getElementById("quizModal");
const openModal = document.getElementById("openModal");
const saveQuestion = document.getElementById("saveQuestion");


// ===============================
// AUTHENTICATION
// ===============================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    console.log("Quiz Builder User:", user.uid);

    // Load lessons immediately
    await loadLessons();

    // Load questions
    await loadQuestions();

});


// ===============================
// OPEN ADD QUESTION MODAL
// ===============================

if (openModal) {

    openModal.addEventListener("click", async () => {

        await loadLessons();

        clearQuestionForm();

        if (modal) {
            modal.style.display = "flex";
        }

    });

}


// ===============================
// CLOSE MODAL
// ===============================

window.addEventListener("click", (event) => {

    if (event.target === modal) {

        modal.style.display = "none";

    }

});


// ===============================
// LOAD LESSONS
// ===============================

async function loadLessons() {

    if (!lessonSelect) {
        console.error("lessonSelect not found.");
        return;
    }

    lessonSelect.innerHTML = `
        <option value="">
            Loading lessons...
        </option>
    `;

    try {

        const snapshot = await getDocs(
            collection(db, "lessons")
        );

        lessonSelect.innerHTML = "";

        if (snapshot.empty) {

            lessonSelect.innerHTML = `
                <option value="">
                    No lessons available
                </option>
            `;

            return;
        }


        // Sort lessons by title
        const lessons = [];

        snapshot.forEach((item) => {

            lessons.push({
                id: item.id,
                ...item.data()
            });

        });

        lessons.sort((a, b) =>
            (a.title || "").localeCompare(b.title || "")
        );


        // Add lessons to dropdown
        lessons.forEach((lesson) => {

            const option = document.createElement("option");

            option.value = lesson.id;

            option.textContent =
                lesson.title || "Untitled Lesson";

            lessonSelect.appendChild(option);

        });

        console.log(
            "Lessons loaded:",
            lessons.length
        );

    } catch (error) {

        console.error(
            "Error loading lessons:",
            error
        );

        lessonSelect.innerHTML = `
            <option value="">
                Unable to load lessons
            </option>
        `;

    }

}


// ===============================
// LOAD QUESTIONS
// ===============================

async function loadQuestions() {

    if (!questionList) {
        console.error("questionList not found.");
        return;
    }

    questionList.innerHTML = `
        <p>Loading questions...</p>
    `;

    try {

        // Load lessons first so we can show lesson names
        const lessonSnapshot = await getDocs(
            collection(db, "lessons")
        );

        const lessonMap = {};

        lessonSnapshot.forEach((item) => {

            const lesson = item.data();

            lessonMap[item.id] =
                lesson.title || "Untitled Lesson";

        });


        // Load questions
        const snapshot = await getDocs(
            collection(db, "questions")
        );

        questionList.innerHTML = "";


        if (snapshot.empty) {

            questionList.innerHTML = `
                <p>No questions found.</p>
            `;

            return;

        }


        snapshot.forEach((item) => {

            const q = item.data();

            const lessonName =
                lessonMap[q.lessonId] ||
                "Unknown Lesson";


            const card =
                document.createElement("div");

            card.className = "card";


            card.innerHTML = `

                <h3>
                    ${escapeHTML(q.question || "Untitled Question")}
                </h3>

                <p>
                    <strong>Lesson:</strong>
                    ${escapeHTML(lessonName)}
                </p>

                <div class="choices">

                    <p>
                        <strong>A.</strong>
                        ${escapeHTML(q.choiceA || "")}
                    </p>

                    <p>
                        <strong>B.</strong>
                        ${escapeHTML(q.choiceB || "")}
                    </p>

                    <p>
                        <strong>C.</strong>
                        ${escapeHTML(q.choiceC || "")}
                    </p>

                    <p>
                        <strong>D.</strong>
                        ${escapeHTML(q.choiceD || "")}
                    </p>

                </div>

                <p>
                    <strong>Correct Answer:</strong>
                    ${escapeHTML(q.correctAnswer || "")}
                </p>

                <button
                    class="delete"
                    data-id="${item.id}">
                    Delete
                </button>

            `;


            const deleteButton =
                card.querySelector(".delete");


            deleteButton.addEventListener(
                "click",
                () => deleteQuestion(item.id)
            );


            questionList.appendChild(card);

        });


        console.log(
            "Questions loaded:",
            snapshot.size
        );


    } catch (error) {

        console.error(
            "Error loading questions:",
            error
        );

        questionList.innerHTML = `
            <p>
                Unable to load questions.
            </p>
        `;

    }

}


// ===============================
// SAVE QUESTION
// ===============================

if (saveQuestion) {

    saveQuestion.addEventListener(
        "click",
        async () => {

            const lessonId =
                document.getElementById(
                    "lessonSelect"
                )?.value;

            const question =
                document.getElementById(
                    "question"
                )?.value.trim();

            const choiceA =
                document.getElementById(
                    "choiceA"
                )?.value.trim();

            const choiceB =
                document.getElementById(
                    "choiceB"
                )?.value.trim();

            const choiceC =
                document.getElementById(
                    "choiceC"
                )?.value.trim();

            const choiceD =
                document.getElementById(
                    "choiceD"
                )?.value.trim();

            const correctAnswer =
                document.getElementById(
                    "correctAnswer"
                )?.value;


            // ===========================
            // VALIDATION
            // ===========================

            if (!lessonId) {

                alert(
                    "Please select a lesson."
                );

                return;

            }


            if (!question) {

                alert(
                    "Please enter a question."
                );

                return;

            }


            if (
                !choiceA ||
                !choiceB ||
                !choiceC ||
                !choiceD
            ) {

                alert(
                    "Please complete all four choices."
                );

                return;

            }


            if (!correctAnswer) {

                alert(
                    "Please select the correct answer."
                );

                return;

            }


            // ===========================
            // DISABLE BUTTON
            // ===========================

            saveQuestion.disabled = true;

            saveQuestion.innerText =
                "Saving...";


            try {

                await addDoc(
                    collection(db, "questions"),
                    {

                        lessonId: lessonId,

                        question: question,

                        choiceA: choiceA,

                        choiceB: choiceB,

                        choiceC: choiceC,

                        choiceD: choiceD,

                        correctAnswer:
                            correctAnswer,

                        createdBy:
                            auth.currentUser.uid,

                        createdAt:
                            serverTimestamp()

                    }
                );


                alert(
                    "Question added successfully!"
                );


                // Close modal
                if (modal) {

                    modal.style.display =
                        "none";

                }


                // Clear form
                clearQuestionForm();


                // Refresh questions
                await loadQuestions();


            } catch (error) {

                console.error(
                    "Error saving question:",
                    error
                );

                alert(
                    "Failed to save question. Please try again."
                );

            }


            saveQuestion.disabled = false;

            saveQuestion.innerText =
                "Save Question";

        }
    );

}


// ===============================
// DELETE QUESTION
// ===============================

async function deleteQuestion(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this question?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(db, "questions", id)
        );


        alert(
            "Question deleted successfully."
        );


        await loadQuestions();


    } catch (error) {

        console.error(
            "Error deleting question:",
            error
        );

        alert(
            "Failed to delete question."
        );

    }

}


// ===============================
// CLEAR FORM
// ===============================

function clearQuestionForm() {

    const fields = [

        "question",
        "choiceA",
        "choiceB",
        "choiceC",
        "choiceD"

    ];


    fields.forEach((id) => {

        const element =
            document.getElementById(id);

        if (element) {

            element.value = "";

        }

    });


    const correctAnswer =
        document.getElementById(
            "correctAnswer"
        );


    if (correctAnswer) {

        correctAnswer.value = "";

    }

}


// ===============================
// SECURITY / HTML ESCAPE
// ===============================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}