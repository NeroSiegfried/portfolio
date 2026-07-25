// The entire "theming" behaviour on the real site: set one attribute.
// Colour, rules, type, buttons and the real project image all follow in CSS.
var COPY = {
  concept: {
    name: "Pengana Concept",
    line: "A family-owned Nigerian holding company across property and hospitality, agriculture, and telecommunications.",
    cta: "Explore the group",
    deep: "#101B26", accent: "#456079", pale: "#DFE7ED"
  },
  properties: {
    name: "Pengana Properties",
    line: "Property development, sales, leasing and lettings, property management, short-lets and serviced apartments. Jos office.",
    cta: "Visit Properties",
    deep: "#281B15", accent: "#9A6848", pale: "#EADFD4"
  },
  tishino: {
    name: "Tishino Ventures",
    line: "Staple agriculture across grains, legumes, roots and tubers, with livestock and poultry as growth areas. Abuja office.",
    cta: "Visit Tishino",
    deep: "#1C2417", accent: "#617149", pale: "#E3E4D3"
  },
  sunab: {
    name: "Sunab Telecoms",
    line: "Carrier services connecting mobile network operators. Its own board, branding and website are reached through the same group system.",
    cta: "Go to Sunab",
    deep: "#0B1230", accent: "#3F4FB0", pale: "#D9DEF2"
  }
};

var stage = document.querySelector(".stage");
var buttons = document.querySelectorAll(".switch button");

function field(name) { return document.querySelector('[data-field="' + name + '"]'); }

function select(site) {
  // 1. the theme swap
  stage.dataset.site = site;

  // 2. everything below is just demo copy, not part of the theming
  var copy = COPY[site];
  field("name").textContent = copy.name;
  field("line").textContent = copy.line;
  field("cta").textContent = copy.cta;
  field("deep").textContent = copy.deep;
  field("accent").textContent = copy.accent;
  field("pale").textContent = copy.pale;
  field("site").textContent = site;

  buttons.forEach(function (b) {
    b.setAttribute("aria-pressed", String(b.dataset.target === site));
  });
}

buttons.forEach(function (b) {
  b.addEventListener("click", function () { select(b.dataset.target); });
});
