const logoUrl = new URL("../icons/icon-192.png", import.meta.url).href;

export function showLoadingScreen(message = "Welcome to EqualLearn", status = "Preparing your workspace…") {
  let loader = document.getElementById("equalLearnLoader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "equalLearnLoader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-brand">
          <img class="loader-logo" src="${logoUrl}" alt="EqualLearn logo">
          <div class="loader-wordmark"><h1 class="loader-title">EqualLearn</h1><small>Learn • Teach • Grow</small></div>
        </div>
        <p class="loader-message"></p>
        <p class="loader-status"></p>
        <div class="loader-progress" aria-hidden="true"><span></span></div>
        <div class="loader-dots" aria-hidden="true"><i></i><i></i><i></i></div>
      </div>`;
    document.body.appendChild(loader);
  }
  loader.querySelector(".loader-message").textContent = message;
  loader.querySelector(".loader-status").textContent = status;
  loader.classList.remove("hidden");
  return loader;
}

export function updateLoadingScreen(message, status) {
  const loader = document.getElementById("equalLearnLoader");
  if (!loader) return;
  if (message) loader.querySelector(".loader-message").textContent = message;
  if (status) loader.querySelector(".loader-status").textContent = status;
}

export function hideLoadingScreen() {
  const loader = document.getElementById("equalLearnLoader");
  if (!loader) return;
  loader.classList.add("hidden");
  window.setTimeout(() => loader.remove(), 320);
}
