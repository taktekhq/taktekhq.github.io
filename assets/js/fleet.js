/* ==========================================================================
   The Fleet board on the home page: 32 status dots moving through their
   states the way a real Fleet does. Queued agents pick up work, working ones
   finish, now and then one needs a person and then carries on. When the
   whole Fleet is done, it starts again. It's an illustration, and the page
   says so. Reduced motion: it stays as drawn.
   ========================================================================== */

(function () {
  "use strict";

  var board = document.querySelector("[data-fleet]");
  if (!board || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var dots = Array.prototype.slice.call(board.children);
  var start = dots.map(function (d) { return d.className; });
  var blockedFor = new Map();

  function state(d) { return d.className.replace("st st--", ""); }
  function set(d, s) { d.className = "st st--" + s; }
  function pick(s) {
    var c = dots.filter(function (d) { return state(d) === s; });
    return c.length ? c[Math.floor(Math.random() * c.length)] : null;
  }

  function tick() {
    var b = pick("blocked");
    if (b) {
      var n = (blockedFor.get(b) || 0) + 1;
      blockedFor.set(b, n);
      if (n > 3) { set(b, "working"); blockedFor.delete(b); }
    }
    var w = pick("working");
    if (w) set(w, Math.random() < 0.06 && !b ? "blocked" : "done");
    var q = pick("queued");
    if (q) set(q, "working");
    if (dots.every(function (d) { return state(d) === "done"; })) {
      setTimeout(function () { dots.forEach(function (d, i) { d.className = start[i]; }); }, 1800);
    }
  }

  var timer = null;
  function run() { if (!timer) timer = setInterval(tick, 900); }
  function stop() { clearInterval(timer); timer = null; }
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : run(); });
  run();
})();
