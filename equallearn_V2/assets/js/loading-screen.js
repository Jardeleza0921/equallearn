// ======================================================
// EQUALLEARN LOADING SCREEN
// ======================================================

export function showLoadingScreen(
    message = "Welcome to EqualLearn!"
) {

    // Prevent duplicate loader

    let loader =
        document.getElementById(
            "equalLearnLoader"
        );


    if (!loader) {

        loader =
            document.createElement("div");

        loader.id =
            "equalLearnLoader";


        loader.innerHTML = `

            <div class="loader-content">

                <div class="loader-logo">
                    EL
                </div>

                <h1 class="loader-title">
                    EqualLearn
                </h1>

                <div class="loader-message">
                    ${message}
                </div>

                <div class="loader-spinner">
                </div>

                <div class="loader-status">
                    Loading your account...
                </div>

            </div>

        `;


        document.body.appendChild(
            loader
        );

    }


    loader.classList.remove(
        "hidden"
    );

}


// ======================================================
// HIDE LOADING SCREEN
// ======================================================

export function hideLoadingScreen() {

    const loader =
        document.getElementById(
            "equalLearnLoader"
        );


    if (!loader) {

        return;

    }


    loader.classList.add(
        "hidden"
    );

}