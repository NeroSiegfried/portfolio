var BASE_PADDING = 132;
var shell = document.getElementById("nav-shell");
var panel = document.getElementById("menu-panel");
var toggle = document.getElementById("menu-toggle");
var toggleLabel = document.getElementById("toggle-label");
var hero = document.getElementById("hero");
var status = document.getElementById("status");
var panelHeight = document.getElementById("panel-height");
var heroPadding = document.getElementById("hero-padding");
var cornerTimer = null;
var openTimer = null;

function updateReadout(height) {
  panelHeight.textContent = Math.round(height) + " px";
  heroPadding.textContent = Math.round(BASE_PADDING + height) + " px";
}

function openMenu() {
  clearTimeout(cornerTimer);
  clearTimeout(openTimer);
  toggle.setAttribute("aria-expanded", "true");
  toggleLabel.textContent = "Close";
  status.textContent = "OPENING";
  shell.classList.add("is-flat");

  openTimer = setTimeout(function () {
    panel.classList.add("is-open");
    var height = panel.scrollHeight + 21;
    hero.style.paddingTop = BASE_PADDING + height + "px";
    updateReadout(height);
    status.textContent = "OPEN";
  }, 150);
}

function closeMenu() {
  clearTimeout(cornerTimer);
  clearTimeout(openTimer);
  toggle.setAttribute("aria-expanded", "false");
  toggleLabel.textContent = "Menu";
  status.textContent = "CLOSING";
  panel.classList.remove("is-open");
  hero.style.paddingTop = BASE_PADDING + "px";
  updateReadout(0);

  cornerTimer = setTimeout(function () {
    shell.classList.remove("is-flat");
    status.textContent = "CLOSED";
  }, 350);
}

toggle.addEventListener("click", function () {
  if (toggle.getAttribute("aria-expanded") === "true") {
    closeMenu();
  } else {
    openMenu();
  }
});
