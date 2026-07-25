var section = document.getElementById("section");
var cls = document.getElementById("cls");
var buttons = document.querySelectorAll(".picker button");

buttons.forEach(function (b) {
  b.addEventListener("click", function () {
    // Swap the one class that carries the whole palette.
    section.className = "section " + b.dataset.scheme;
    cls.textContent = "." + b.dataset.scheme;
    buttons.forEach(function (o) {
      o.setAttribute("aria-pressed", String(o === b));
    });
  });
});
