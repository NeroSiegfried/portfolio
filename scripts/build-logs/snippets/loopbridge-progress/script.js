var STAGES = [
  {
    why: "The first job was visual fidelity. Plain HTML, CSS and JavaScript kept the Figma translation direct while the public page set was still taking shape.",
    cost: "Tradeoff: shared chrome and behaviour were repeated across a growing set of page files.",
    tiers: [
      { label: "Source", parts: [{ t: "Figma desktop" }, { t: "Figma mobile" }] },
      { label: "Pages", parts: [{ t: "HTML" }, { t: "page CSS" }, { t: "vanilla JS" }] },
      { label: "Delivery", parts: [{ t: "static host" }] }
    ]
  },
  {
    why: "Before the React migration, a vanilla component loader removed the worst duplication. Pages declared components, while JSON and localStorage supplied a mock content and account layer.",
    cost: "Tradeoff: it improved composition and testing, but application state and product workflows were beginning to exceed the mock backend.",
    tiers: [
      { label: "Shell", parts: [{ t: "data-component", n: true }, { t: "shared nav", n: true }, { t: "shared footer", n: true }] },
      { label: "Content", parts: [{ t: "JSON", n: true }, { t: "localStorage", n: true }] },
      { label: "Pages", parts: [{ t: "HTML" }, { t: "isolated CSS" }, { t: "component JS", n: true }] }
    ]
  },
  {
    why: "Accounts, roles, editors, moderation, courses and progress needed durable shared state. The client became a routed React application and the server was split into routes, services and repositories.",
    cost: "Tradeoff: the application now needed a build, a server and a database. The async data boundary keeps a later PostgreSQL migration possible, though the two schemas still need consolidation.",
    tiers: [
      { label: "Client", parts: [{ t: "React", n: true }, { t: "Vite", n: true }, { t: "React Router", n: true }] },
      { label: "HTTP", parts: [{ t: "thin Express routes", n: true }, { t: "auth guards", n: true }] },
      { label: "Domain", parts: [{ t: "services", n: true }, { t: "repositories", n: true }] },
      { label: "Data", parts: [{ t: "async DB adapter", n: true }, { t: "SQLite" }, { t: "Postgres seam", n: true }] }
    ]
  },
  {
    why: "The deployed system starts small and keeps the expensive migrations reversible. One EC2 host runs nginx and the app, while S3 handles media and Litestream copies the SQLite WAL off the machine.",
    cost: "Scale path: move to RDS after measured write pressure or multiple app replicas. Add CloudFront when global media traffic justifies it. ECS and RDS were evaluated, not deployed.",
    tiers: [
      { label: "Edge", parts: [{ t: "nginx TLS", n: true }, { t: "API throttle", n: true }, { t: "asset cache headers", n: true }] },
      { label: "Compute", parts: [{ t: "EC2", n: true }, { t: "Docker Compose", n: true }, { t: "app + nginx", n: true }] },
      { label: "Data", parts: [{ t: "SQLite WAL on EBS", n: true }, { t: "Litestream → S3", n: true }] },
      { label: "Media", parts: [{ t: "S3 uploads", n: true }, { t: "MediaConvert", n: true }, { t: "HLS", n: true }] },
      { label: "Deploy", parts: [{ t: "GitHub OIDC", n: true }, { t: "ECR", n: true }, { t: "SSM", n: true }] }
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
