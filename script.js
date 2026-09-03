const body = document.body;
const switcher = document.querySelector(".theme-switch");
const indicator = document.querySelector(".indicator");
const buttons = document.querySelectorAll(".theme-switch button");

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function moveIndicator(index) {
  indicator.style.transform = `translateX(${index * 100}%)`;
}

function setUITheme(mode) {
  body.classList.remove("light-ui", "dark-ui");
  body.classList.add(mode === "dark" ? "dark-ui" : "light-ui");
}

function applyTheme(theme) {
  if (theme === "dark") {
    setUITheme("dark");
  } else {
    setUITheme("light");
  }
}

buttons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    moveIndicator(index);

    const theme = btn.dataset.theme;

    if (theme === "auto") {
      localStorage.removeItem("theme");
      applyTheme(systemTheme.matches ? "dark" : "light");
    } else {
      localStorage.setItem("theme", theme);
      applyTheme(theme);
    }
  });
});

/* INITIAL LOAD */
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
  buttons[0].click();
} else if (savedTheme === "dark") {
  buttons[1].click();
} else {
  buttons[2].click();
}

/* SYSTEM THEME CHANGE */
systemTheme.addEventListener("change", () => {
  if (!localStorage.getItem("theme")) {
    applyTheme(systemTheme.matches ? "dark" : "light");
  }
});
