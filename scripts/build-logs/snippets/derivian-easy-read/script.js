// On the real site this reads/writes localStorage so the preference survives a
// reload, and toggles `easyread-on` on <html>. Here it toggles a data attribute
// on the demo root — the CSS mechanism is identical either way.
var stage = document.getElementById("stage");
var toggle = document.getElementById("toggle");
var tokens = document.getElementById("tokens");

var NAMES = ["--root", "--text-large", "--text-medium", "--text-regular", "--text-small"];

function readTokens() {
  var styles = getComputedStyle(stage);
  tokens.innerHTML = NAMES.map(function (n) {
    return "<div><dt>" + n + "</dt><dd>" + styles.getPropertyValue(n).trim() + "</dd></div>";
  }).join("");
}

toggle.addEventListener("click", function () {
  var on = stage.dataset.easyread !== "on";
  stage.dataset.easyread = on ? "on" : "off";
  toggle.setAttribute("aria-pressed", String(on));
  readTokens();
});

readTokens();
