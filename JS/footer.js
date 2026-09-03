(function initFooterThemeToggle() {

  const root = document.documentElement;
  const indicator = document.querySelector(".theme-switch .indicator");
  const buttons = document.querySelectorAll(".theme-switch button");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  if (!indicator || !buttons.length) return;

  function moveIndicator(index) {
    indicator.style.transform = `translateX(${index * 100}%)`;
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }

  function applySystemTheme() {
    applyTheme(systemTheme.matches ? "dark" : "light");
  }

  buttons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      moveIndicator(index);

      const theme = btn.dataset.theme;

      if (theme === "auto") {
        localStorage.removeItem("theme");
        applySystemTheme();
      } else {
        localStorage.setItem("theme", theme);
        applyTheme(theme);
      }
    });
  });

  /* INITIAL LOAD */
  const saved = localStorage.getItem("theme");

  if (saved === "light") {
    buttons[0].click();
  } else if (saved === "dark") {
    buttons[1].click();
  } else {
    buttons[2].classList.add("active");
    moveIndicator(2);
    applySystemTheme();
  }

  /* SYSTEM THEME CHANGE */
  systemTheme.addEventListener("change", () => {
    if (!localStorage.getItem("theme")) {
      applySystemTheme();
    }
  });

  /* YEAR */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

})();
