/* =========================================================
   NAVBAR SCRIPT — FINAL, FULLY FIXED
   ACTIVE STATE + DROPDOWNS + MOBILE + AUTO-HIDE
========================================================= */

(function () {

  /* =====================================================
     ELEMENT REFERENCES
  ===================================================== */
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  const navbar = document.querySelector(".glass-navbar");

  if (!hamburger || !navMenu || !navbar) {
    console.warn("Navbar elements not found");
    return;
  }

  /* =====================================================
     HAMBURGER TOGGLE (MOBILE)
  ===================================================== */
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("open");
  });

  /* =====================================================
     MOBILE DROPDOWN — LEVEL 1
  ===================================================== */
  document.querySelectorAll(".dropdown > span").forEach(label => {
    label.addEventListener("click", e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        label.parentElement.classList.toggle("open");
      }
    });
  });

  /* =====================================================
     MOBILE SUBMENU — LEVEL 2
  ===================================================== */
  document.querySelectorAll(".submenu > span").forEach(label => {
    label.addEventListener("click", e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        label.parentElement.classList.toggle("open");
      }
    });
  });

  /* =====================================================
     AUTO-CLOSE MOBILE MENU ON LINK CLICK
  ===================================================== */
  document.querySelectorAll(".nav-item a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        hamburger.classList.remove("active");
        navMenu.classList.remove("open");

        document
          .querySelectorAll(".dropdown.open, .submenu.open")
          .forEach(el => el.classList.remove("open"));
      }
    });
  });

  /* =====================================================
     ACTIVE PAGE DETECTION (ROBUST & PATH-SAFE)
  ===================================================== */

  // Get current page filename safely
  let currentPage = window.location.pathname.split("/").pop();

  if (!currentPage || currentPage === "") {
    currentPage = "index.html";
  }

  document.querySelectorAll(".nav-item a").forEach(link => {

    // Normalize href (handles ../, ./, folders)
    const rawHref = link.getAttribute("href");
    if (!rawHref) return;

    const linkPage = rawHref.split("/").pop();

    if (linkPage === currentPage) {

      /* ---------- MARK LINK ACTIVE ---------- */
      link.classList.add("active");

      /* ---------- MARK DROPDOWN PARENT ACTIVE ---------- */
      const dropdown = link.closest(".dropdown");
      if (dropdown) {
        const dropdownLabel = dropdown.querySelector(":scope > span");
        if (dropdownLabel) dropdownLabel.classList.add("active");
      }

      /* ---------- MARK SUBMENU PARENT ACTIVE ---------- */
      const submenu = link.closest(".submenu");
      if (submenu) {
        const submenuLabel = submenu.querySelector(":scope > span");
        if (submenuLabel) submenuLabel.classList.add("active");

        // Also mark top-level "More"
        const mainDropdown = submenu.closest(".dropdown");
        if (mainDropdown) {
          const mainLabel = mainDropdown.querySelector(":scope > span");
          if (mainLabel) mainLabel.classList.add("active");
        }
      }
    }
  });

  /* =====================================================
     AUTO-HIDE NAVBAR ON SCROLL (UNCHANGED LOGIC)
  ===================================================== */
  let lastScrollY = window.scrollY;
  const HIDE_AFTER = 120;
  const SCROLL_DELTA = 8;
  let ticking = false;

  function onScroll() {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;

    if (delta > SCROLL_DELTA && currentY > HIDE_AFTER) {
      navbar.classList.add("nav-hidden");
    }

    if (delta < -SCROLL_DELTA) {
      navbar.classList.remove("nav-hidden");
    }

    lastScrollY = currentY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  });

})();
