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


const container =
    document.getElementById(
        "progressContainer"
    );


onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login.html";

            return;

        }


        try {

            const q =
                query(
                    collection(
                        db,
                        "progress"
                    ),

                    where(
                        "userId",
                        "==",
                        user.uid
                    )
                );


            const snapshot =
                await getDocs(q);


            if (snapshot.empty) {

                container.innerHTML = `
                    <p>
                        No progress yet.
                    </p>
                `;

                return;

            }


            container.innerHTML = "";


            snapshot.forEach((item) => {

                const data =
                    item.data();


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "progress-card";


                card.innerHTML = `

                    <h3>
                        ${escapeHTML(
                            data.lessonId || "Lesson"
                        )}
                    </h3>


                    <p>
                        Score:
                        <strong>
                            ${data.score || 0}
                            /
                            ${data.total || 0}
                        </strong>
                    </p>


                    <p>
                        Grade:
                        <strong>
                            ${data.percentage || 0}%
                        </strong>
                    </p>


                    <p>
                        Result:
                        <strong class="${
                            data.result === "passing"
                                ? "passing"
                                : "failing"
                        }">

                            ${
                                data.result === "passing"
                                    ? "PASSING"
                                    : "FAILING"
                            }

                        </strong>
                    </p>

                `;


                container.appendChild(
                    card
                );

            });

        }

        catch (error) {

            console.error(
                "Progress error:",
                error
            );


            container.innerHTML = `
                <p>
                    Failed to load progress.
                </p>
            `;

        }

    }
);


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;

}