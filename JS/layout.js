/* =========================================================
   LAYOUT LOADER — SAFE FOR THEME TOGGLE
========================================================= */

async function loadLayout() {

  /* ---------------- HEADER ---------------- */
  const headerHTML = await fetch("/partials/navbar.html").then(r => r.text());
  document.getElementById("header").innerHTML = headerHTML;

  // ✅ Load navbar.js AFTER header is in DOM
  await loadScript("/js/navbar.js");

  /* ---------------- FOOTER ---------------- */
  const footerHTML = await fetch("/partials/footer.html").then(r => r.text());
  document.getElementById("footer").innerHTML = footerHTML;

  // Footer script (if any)
  loadScript("/js/footer.js");

  /* ---------------- ACTIVE NAV ---------------- */
  setActiveNav();
}

/* ---------- SCRIPT LOADER (PROMISE-BASED) ---------- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/* ---------- ACTIVE NAV ---------- */
function setActiveNav() {
  const current =
    location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.dataset.page === current) {
      item.classList.add("active");
    }
  });
}

/* ---------- INIT ---------- */
loadLayout();


