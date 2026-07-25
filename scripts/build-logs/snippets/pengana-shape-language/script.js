var card = document.querySelector(".card");
var out = document.getElementById("out");
var verdict = document.getElementById("verdict");

var CORNER_NAMES = { tl: "top-left", tr: "top-right", br: "bottom-right", bl: "bottom-left" };

var RADIUS = {
  tl: "var(--img-corner) 0 0 0",
  tr: "0 var(--img-corner) 0 0",
  br: "0 0 var(--img-corner) 0",
  bl: "0 0 0 var(--img-corner)"
};

var CHAMFER = {
  tl: "polygon(\n    var(--chamfer) 0,\n    100% 0,\n    100% 100%,\n    0 100%,\n    0 var(--chamfer)\n  )",
  tr: "polygon(\n    0 0,\n    calc(100% - var(--chamfer)) 0,\n    100% var(--chamfer),\n    100% 100%,\n    0 100%\n  )",
  br: "polygon(\n    0 0,\n    100% 0,\n    100% calc(100% - var(--chamfer)),\n    calc(100% - var(--chamfer)) 100%,\n    0 100%\n  )",
  bl: "polygon(\n    0 0,\n    100% 0,\n    100% 100%,\n    var(--chamfer) 100%,\n    0 calc(100% - var(--chamfer))\n  )"
};

var NOTES = {
  plain: "Measured radii remain on regular surfaces in the final site.",
  radius: "Selected image cards use one exaggerated corner and three sharp corners. Border radius keeps a moving image clipped inside the frame.",
  chamfer: "Angled cuts appear in selected editorial compositions across the shipped routes. Their position follows the image and adjacent copy."
};

function render() {
  var treat = card.dataset.treat;
  var corner = card.dataset.corner;
  var body;

  if (treat === "plain") {
    body = "  border-radius: 12px;";
  } else if (treat === "radius") {
    body = "  /* " + CORNER_NAMES[corner] + " */\n  border-radius: " + RADIUS[corner] + ";";
  } else {
    body = "  /* " + CORNER_NAMES[corner] + " */\n  clip-path: " + CHAMFER[corner] + ";";
  }

  out.textContent = ".image-card {\n" + body + "\n}";
  verdict.textContent = NOTES[treat];
}

document.querySelectorAll("[data-treat]").forEach(function (b) {
  if (b.tagName !== "BUTTON") return;
  b.addEventListener("click", function () {
    card.dataset.treat = b.dataset.treat;
    document.querySelectorAll("button[data-treat]").forEach(function (o) {
      o.setAttribute("aria-pressed", String(o === b));
    });
    render();
  });
});

document.querySelectorAll("button[data-corner]").forEach(function (b) {
  b.addEventListener("click", function () {
    card.dataset.corner = b.dataset.corner;
    document.querySelectorAll("button[data-corner]").forEach(function (o) {
      o.setAttribute("aria-pressed", String(o === b));
    });
    render();
  });
});

render();
