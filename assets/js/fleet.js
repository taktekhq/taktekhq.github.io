/* ==========================================================================
   The Fleet board on the home page: 32 status dots moving through their
   states the way a real Fleet does. Queued agents pick up work and working
   ones finish. One agent at a time needs a person, and it waits until a
   person reaches it: hover it (or tap it) and it goes back to work, and
   somewhere else another one gets stuck. Nothing on the page says so.

   With reduced motion the dots don't drift on their own, but reaching a
   stuck one still frees it.
   ========================================================================== */

(function () {
  "use strict";

  var board = document.querySelector("[data-fleet]");
  if (!board) return;

  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dots = Array.prototype.slice.call(board.children);
  var start = dots.map(function (d) { return d.className; });

  function state(d) { return d.className.replace(/^st st--(\w+).*$/, "$1"); }
  function set(d, s) { d.className = "st st--" + s; }
  function all(s) { return dots.filter(function (d) { return state(d) === s; }); }
  function any(list) { return list.length ? list[Math.floor(Math.random() * list.length)] : null; }

  // Exactly one dot needs a person, never the one you just freed.
  function stickOne(not) {
    if (all("blocked").length) return;
    var pool = dots.filter(function (d) { return d !== not && state(d) !== "blocked"; });
    var busy = pool.filter(function (d) { return state(d) === "working"; });
    var d = any(busy.length ? busy : pool);
    if (d) set(d, "blocked");
  }

  function free(d) {
    if (state(d) !== "blocked") return;
    set(d, "working");
    d.classList.add("is-freed");
    setTimeout(function () { stickOne(d); }, 160);
  }

  board.addEventListener("pointerover", function (e) { if (e.target.parentNode === board) free(e.target); });
  board.addEventListener("pointerdown", function (e) { if (e.target.parentNode === board) free(e.target); });

  stickOne(null);
  if (still) return;

  var resetting = false;
  function tick() {
    if (resetting) return;
    var w = any(all("working"));
    if (w) set(w, "done");
    var q = any(all("queued"));
    if (q) set(q, "working");
    if (!all("working").length && !all("queued").length) {
      // The Fleet is done except whoever is waiting on a person. Start over.
      resetting = true;
      setTimeout(function () {
        resetting = false;
        dots.forEach(function (d, i) { d.className = start[i]; });
        dots.forEach(function (d) { if (state(d) === "blocked") set(d, "working"); });
        stickOne(null);
      }, 1800);
    }
  }

  var timer = null;
  function run() { if (!timer) timer = setInterval(tick, 1100); }
  function stop() { clearInterval(timer); timer = null; }
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : run(); });
  run();
})();
