/* =========================================================
   LAYOUT LOADER — SAFE FOR THEME TOGGLE
========================================================= */

async function loadLayout() {

  /* ---------------- HEADER ---------------- */
  const headerHTML = await fetch("PARTIALS/navbar.html").then(r => r.text());
  document.getElementById("header").innerHTML = headerHTML;

  // ✅ Load navbar.js AFTER header is in DOM
  await loadScript("JS/navbar.js");

  /* ---------------- FOOTER ---------------- */
  const footerHTML = await fetch("PARTIALS/footer.html").then(r => r.text());
  document.getElementById("footer").innerHTML = footerHTML;

  // Footer script (if any)
  loadScript("JS/footer.js");

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

/* =========================================================
   INSPECTION PROTECTION
========================================================= */
document.addEventListener('contextmenu', event => event.preventDefault());

document.onkeydown = function(e) {
  // Disable F12
  if (e.keyCode === 123) {
    return false;
  }
  // Disable Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
  if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
    return false;
  }
  // Disable Ctrl+U
  if (e.ctrlKey && e.keyCode === 85) {
    return false;
  }
};
