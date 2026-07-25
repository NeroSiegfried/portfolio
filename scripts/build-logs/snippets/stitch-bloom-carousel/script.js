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
  {
    name: "Najma Tote Bag",
    description: "A roomy, structured tote handcrafted in the signature pink and brown colourway.",
    image: "https://thestitchbloom.com/images/products/najma-tote-1.jpeg"
  },
  {
    name: "Najma Shoulder Bag",
    description: "Clean lines, comfortable straps and the heavy recycled-yarn texture used across the collection.",
    image: "https://thestitchbloom.com/images/products/najma-shoulder-1.jpeg"
  },
  {
    name: "Najma Mini Bag",
    description: "The compact Najma silhouette, designed to sit crossbody or under the arm.",
    image: "https://thestitchbloom.com/images/products/najma-mini-1.jpeg"
  },
  {
    name: "Najma Handbag",
    description: "A structured handbag shown here in its pink and brown colourway.",
    image: "https://thestitchbloom.com/images/products/najma-handbag-pink-1.jpeg"
  },
  {
    name: "Najma Clutch",
    description: "A limited evening piece and the most detailed item in the current catalogue.",
    image: "https://thestitchbloom.com/images/products/najma-clutch-1.jpeg"
  }
];

var dc = document.getElementById("dc");
var stage = document.getElementById("dcStage");
var readout = document.getElementById("readout");
var count = document.getElementById("count");
var active = 0;
var cw = 0;
var timer = null;
var controls = document.getElementById("controls");
var activeName = document.getElementById("activeName");
var activeDescription = document.getElementById("activeDescription");

// Build every card ONCE. This is the whole reason the deck animates: a CSS
// transition can only animate a change on an element that was already in the
// document. Re-creating the cards on each step — which is what a naive
// innerHTML rebuild does — makes them appear at their new position with no
// transition at all.
var cards = ITEMS.map(function (item, i) {
  var el = document.createElement("div");
  el.className = "dc__card";
  el.innerHTML = '<img class="dc__art" src="' + item.image + '" alt="' + item.name + '">';
  el.addEventListener("click", function () { if (i !== active) goTo(i); });
  el.addEventListener("keydown", function (e) { if (e.key === "Enter" && i !== active) goTo(i); });
  stage.appendChild(el);
  return el;
});

var lastOffset = ITEMS.map(function (_, i) { return i; });

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

function render(instant) {
  var g = geometry();
  stage.style.height = g.stageH + "px";
  controls.style.top = g.cardTop + g.cardH + "px";

  cards.forEach(function (el, i) {
    var total = ITEMS.length;
    var w = i - active;
    if (w > total / 2) w -= total;
    if (w < -total / 2) w += total;

    var absW = Math.abs(w);
    var isActive = w === 0;

    // A card that wraps round the ring (e.g. +2 -> -2) would otherwise slide the
    // entire width of the deck. The real component unmounts those; here the
    // transition is suppressed for exactly that frame, which looks the same.
    var wrapped = Math.abs(w - lastOffset[i]) > 1;
    if (instant || wrapped) el.style.transition = "none";

    el.style.width = g.cardW + "px";
    el.style.height = g.cardH + "px";
    el.style.top = g.cardTop + "px";
    el.style.left = g.cardLeft + "px";
    el.style.transform =
      "translateX(" + w * g.xStep + "px) translateY(" + -w * g.yStep + "px) scale(" + (isActive ? 1 : 0.85) + ")";
    el.style.opacity = absW > VISIBLE_SIDE ? 0 : isActive ? 1 : 0.5;
    el.style.zIndex = isActive ? total + 1 : total - absW;
    el.className = "dc__card" + (isActive ? " dc__card--active" : "");
    el.setAttribute("aria-hidden", absW > VISIBLE_SIDE ? "true" : "false");
    el.setAttribute("tabindex", isActive || absW > VISIBLE_SIDE ? "-1" : "0");
    el.setAttribute("aria-label", isActive ? ITEMS[i].name : "Go to " + ITEMS[i].name);
    if (!isActive) el.setAttribute("role", "button"); else el.removeAttribute("role");

    if (instant || wrapped) {
      void el.offsetWidth;            // force reflow so the jump is not animated
      el.style.transition = "";       // hand control back to the stylesheet
    }
    lastOffset[i] = w;
  });

  count.textContent = active + 1 + " / " + ITEMS.length;
  activeName.textContent = ITEMS[active].name;
  activeDescription.textContent = ITEMS[active].description;

  readout.innerHTML = [
    ["container", cw + "px"], ["cardW", g.cardW + "px"], ["cardH", g.cardH + "px"],
    ["xStep", g.xStep + "px"], ["yStep", g.yStep + "px"], ["stageH", g.stageH + "px"]
  ].map(function (p) { return "<div><dt>" + p[0] + "</dt><dd>" + p[1] + "</dd></div>"; }).join("");
}

function goTo(i) {
  active = (i + ITEMS.length) % ITEMS.length;
  render(false);
  restart();
}

function restart() {
  clearInterval(timer);
  timer = setInterval(function () { goTo(active + 1); }, 4000);
}

document.getElementById("prev").addEventListener("click", function () { goTo(active - 1); });
document.getElementById("next").addEventListener("click", function () { goTo(active + 1); });

// One measurement drives everything. No breakpoints for the deck itself.
new ResizeObserver(function () {
  var next = dc.offsetWidth;
  if (next === cw) return;
  cw = next;
  render(true);   // a resize should not animate
}).observe(dc);

cw = dc.offsetWidth;
render(true);
restart();
