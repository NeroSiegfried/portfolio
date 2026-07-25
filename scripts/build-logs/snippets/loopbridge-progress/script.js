var STAGES = [
  {
    why: "A Figma file and a deadline. Plain HTML, CSS and JavaScript — no build step, no framework — so any frontend developer joining the community could open a file and contribute on day one.",
    cost: "Cost: every page repeated the header, the footer and the nav. Changing one link meant changing it everywhere.",
    tiers: [
      { label: "Delivery", parts: [{ t: "Static host" }] },
      { label: "Pages", parts: [{ t: "index.html" }, { t: "about.html" }, { t: "academy.html" }, { t: "…" }] },
      { label: "Behaviour", parts: [{ t: "vanilla JS" }] }
    ]
  },
  {
    why: "Accounts, an article feed and a course catalogue arrived. Repeating markup stopped being a contribution feature and started being a bug source, so the site became a routed SPA with a real API behind it.",
    cost: "Cost: a build step and a server to keep alive — the price of not hand-syncing eleven copies of the nav.",
    tiers: [
      { label: "Delivery", parts: [{ t: "Static host" }] },
      { label: "Client", parts: [{ t: "React 19", n: true }, { t: "Vite", n: true }, { t: "react-router", n: true }] },
      { label: "API", parts: [{ t: "Express", n: true }, { t: "bcrypt", n: true }, { t: "Google OAuth", n: true }] },
      { label: "Data", parts: [{ t: "SQLite", n: true }] }
    ]
  },
  {
    why: "Video lessons broke the model. User uploads had to be transcoded, stored, streamed adaptively and played back at the right orientation — none of which belongs in a request handler. Media moved to its own pipeline and the app moved into a container.",
    cost: "Cost: real infrastructure — IAM, callbacks, a queue, and a class of bug that only shows up on a portrait phone video.",
    tiers: [
      { label: "Edge", parts: [{ t: "Route 53" }, { t: "CloudFront", n: true }, { t: "ACM", n: true }] },
      { label: "Compute", parts: [{ t: "ALB", n: true }, { t: "ECS Fargate", n: true }, { t: "Express" }] },
      { label: "Media", parts: [{ t: "S3 uploads", n: true }, { t: "MediaConvert", n: true }, { t: "HLS", n: true }, { t: "hls.js", n: true }] },
      { label: "Data", parts: [{ t: "RDS Postgres", n: true }, { t: "Secrets Manager", n: true }] },
      { label: "Ops", parts: [{ t: "CloudWatch", n: true }, { t: "Terraform", n: true }] }
    ]
  }
];

var tiers = document.getElementById("tiers");
var whyText = document.getElementById("whyText");
var whyCost = document.getElementById("whyCost");
var buttons = document.querySelectorAll(".steps button");

function show(i) {
  var s = STAGES[i];

  tiers.innerHTML = s.tiers.map(function (tier) {
    var parts = tier.parts.map(function (p) {
      return '<span class="part' + (p.n ? " part--new" : "") + '">' + p.t + "</span>";
    }).join("");
    return '<div class="tier"><span class="tier__label">' + tier.label + '</span><div class="tier__parts">' + parts + "</div></div>";
  }).join("");

  whyText.textContent = s.why;
  whyCost.textContent = s.cost;

  buttons.forEach(function (b) {
    b.setAttribute("aria-pressed", String(Number(b.dataset.step) === i));
  });
}

buttons.forEach(function (b) {
  b.addEventListener("click", function () { show(Number(b.dataset.step)); });
});

show(0);
