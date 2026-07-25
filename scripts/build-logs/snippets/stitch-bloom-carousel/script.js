// The real component's geometry, verbatim — except MAX_CARD_W, which the live
// site sets to 350 (it's a hero) and this demo lowers to 165 so the deck fits a
// blog column. Everything else is derived, so lowering one number rescales the
// whole composition without touching a single other rule.
var MAX_CARD_W = 165;
var RATIO = 1.64;      // card height  = cardW * 1.64
var X_STEP = 1.114;    // horizontal step per position
var Y_STEP = 0.286;    // vertical step per position (this is the "diagonal")
var VISIBLE_SIDE = 2;  // cards rendered either side of the active one

var ITEMS = [
  { name: "Najma handbag", price: "£78", a: "#8c6248", b: "#4a3323" },
  { name: "Gadget sleeve", price: "£34", a: "#a98a72", b: "#6b4a34" },
  { name: "iPad sleeve", price: "£42", a: "#7d6b5c", b: "#3d332b" },
  { name: "Card holder", price: "£22", a: "#b39680", b: "#7a5a41" },
  { name: "Tote, waxed", price: "£95", a: "#6f5744", b: "#2e241c" }
];

var dc = document.getElementById("dc");
var stage = document.getElementById("dcStage");
var readout = document.getElementById("readout");
var count = document.getElementById("count");
var active = 0;
var cw = 0;
var timer = null;

function geometry() {
  var cardW = cw > 0 ? Math.round(Math.max(140, Math.min(cw * 0.5, MAX_CARD_W))) : MAX_CARD_W;
  var cardH = Math.round(cardW * RATIO);
  var xStep = Math.round(cardW * X_STEP);
  var yStep = Math.round(cardW * Y_STEP);
  var stageH = cardH + yStep * VISIBLE_SIDE * 2 + 72; // 72px reserved for controls
  var cardLeft = cw > 0 ? Math.round((cw - cardW) / 2) : 0;
  var cardTop = Math.round(yStep * VISIBLE_SIDE);
  return { cardW: cardW, cardH: cardH, xStep: xStep, yStep: yStep, stageH: stageH, cardLeft: cardLeft, cardTop: cardTop };
}

function render() {
  var g = geometry();
  stage.style.height = g.stageH + "px";
  stage.innerHTML = "";

  ITEMS.forEach(function (item, i) {
    var total = ITEMS.length;
    var w = i - active;
    if (w > total / 2) w -= total;
    if (w < -total / 2) w += total;

    var absW = Math.abs(w);
    if (absW > VISIBLE_SIDE) return;

    // Positive w → to the RIGHT → X increases, Y decreases.
    var tx = w * g.xStep;
    var ty = -w * g.yStep;
    var isActive = w === 0;

    var card = document.createElement("div");
    card.className = "dc__card" + (isActive ? " dc__card--active" : "");
    card.style.width = g.cardW + "px";
    card.style.height = g.cardH + "px";
    card.style.top = g.cardTop + "px";
    card.style.left = g.cardLeft + "px";
    card.style.transform = "translateX(" + tx + "px) translateY(" + ty + "px) scale(" + (isActive ? 1 : 0.85) + ")";
    card.style.opacity = isActive ? 1 : 0.5;
    card.style.zIndex = isActive ? total + 1 : total - absW;
    card.innerHTML =
      '<span class="dc__art" style="background:linear-gradient(155deg,' + item.a + ',' + item.b + ')"></span>' +
      '<span class="dc__label"><span class="dc__name">' + item.name + "</span>" +
      '<span class="dc__price">' + item.price + "</span></span>";

    if (!isActive) {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "Go to " + item.name);
      card.addEventListener("click", function () { goTo(i); });
      card.addEventListener("keydown", function (e) { if (e.key === "Enter") goTo(i); });
    }

    stage.appendChild(card);
  });

  count.textContent = active + 1 + " / " + ITEMS.length;

  readout.innerHTML = [
    ["container", cw + "px"],
    ["cardW", g.cardW + "px"],
    ["cardH", g.cardH + "px"],
    ["xStep", g.xStep + "px"],
    ["yStep", g.yStep + "px"],
    ["stageH", g.stageH + "px"]
  ].map(function (p) {
    return "<div><dt>" + p[0] + "</dt><dd>" + p[1] + "</dd></div>";
  }).join("");
}

function goTo(i) {
  active = (i + ITEMS.length) % ITEMS.length;
  render();
  restart();
}

function restart() {
  clearInterval(timer);
  timer = setInterval(function () { goTo(active + 1); }, 4000);
}

document.getElementById("prev").addEventListener("click", function () { goTo(active - 1); });
document.getElementById("next").addEventListener("click", function () { goTo(active + 1); });

// One measurement drives everything. No breakpoints for the deck itself.
var ro = new ResizeObserver(function () {
  var next = dc.offsetWidth;
  if (next === cw) return;
  cw = next;
  render();
});
ro.observe(dc);

cw = dc.offsetWidth;
render();
restart();
