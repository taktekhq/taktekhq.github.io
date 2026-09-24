/* ==========================================================================
   A gravity field, after robbietilton.com.

   Lifted from hobeichlegal.com, where it was ported and then tuned twice. Pull
   falls off with the square of proximity rather than linearly, so a card can
   carry a strong field without dragging its neighbour into it.

   Pointer-fine only, and it does nothing at all if the visitor asked for
   reduced motion.
   ========================================================================== */

(function () {
  "use strict";

  /* --- Cursor ------------------------------------------------------------
     A gravity field, after robbietilton.com.

     Every attractor projects a field that reaches `radius` pixels past its own
     edge. Inside that field two things happen at once, both scaled by how close
     the pointer is: the element leans toward the pointer by up to `pull` px,
     and the cursor is dragged toward the element by `grab` of the remaining
     distance. Over something clickable the cursor then dissolves entirely and
     the element is left carrying the interaction on its own.

     Distance is measured to the nearest point on the element's box, not its
     centre, so a wide card does not yank the cursor across the screen and the
     field feels the same depth on every side. */

  var finePointer =
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(hover: none)").matches;

  if (finePointer) {
    var cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);
    document.documentElement.classList.add("has-cursor");

    /* dissolve: the cursor disappears inside, because the element itself is
       now the affordance. Raised-but-not-clickable surfaces keep it visible,
       otherwise the pointer would vanish over half the page. */
    var FIELDS = [
      { sel: ".row",     pull: 14, grab: 0.28, radius: 40, dissolve: false },
      { sel: ".mark",    pull: 7,  grab: 0.5,  radius: 20, dissolve: true },
      { sel: "footer a", pull: 7,  grab: 0.5,  radius: 20, dissolve: true },
      { sel: ".modebtn", pull: 6,  grab: 0.55, radius: 18, dissolve: true },
      { sel: ".doc a",   pull: 5,  grab: 0.5,  radius: 18, dissolve: true }
    ];

    var bodies = [];

    /* An element can match more than one selector here: a service card is both
       .card--link and .card. Registering it twice gave it two configs writing
       to the same custom properties, each undoing the other, so the card never
       moved. First match wins. */
    var claimed = [];

    FIELDS.forEach(function (f) {
      document.querySelectorAll(f.sel).forEach(function (el) {
        if (claimed.indexOf(el) > -1) return;
        claimed.push(el);
        /* The attribute is what the stylesheet hooks the transform onto. */
        if (f.pull) el.setAttribute("data-magnetic", "");
        bodies.push({ el: el, cfg: f, mx: 0, my: 0 });
      });
    });

    var shown = false;
    var x = 0;
    var y = 0;
    var queued = false;

    var clamp = function (v, lo, hi) {
      return v < lo ? lo : v > hi ? hi : v;
    };

    var settle = function (b) {
      if (b.mx === 0 && b.my === 0) return;
      b.mx = 0;
      b.my = 0;
      b.el.style.setProperty("--mx", "0px");
      b.el.style.setProperty("--my", "0px");
    };

    var step = function () {
      queued = false;

      var gx = 0;
      var gy = 0;
      var best = 0;
      var dissolve = false;

      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        var r = b.el.getBoundingClientRect();

        /* The element is already displaced by its own pull, so undo that
           before measuring or the two feed each other. */
        var left = r.left - b.mx;
        var top = r.top - b.my;
        var right = left + r.width;
        var bottom = top + r.height;

        if (!r.width || !r.height) {
          settle(b);
          continue;
        }

        var nx = clamp(x, left, right);
        var ny = clamp(y, top, bottom);
        var dx = nx - x;
        var dy = ny - y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > b.cfg.radius) {
          settle(b);
          continue;
        }

        var t = 1 - dist / b.cfg.radius;
        var inside = dist === 0;

        if (b.cfg.pull) {
          var ox = clamp((x - (left + r.width / 2)) / (r.width / 2), -1, 1);
          var oy = clamp((y - (top + r.height / 2)) / (r.height / 2), -1, 1);
          /* Squared falloff. Full strength under the pointer, but decaying
             fast outside the element, so neighbours in a row stop reaching
             into the same gap and knocking into each other. */
          var f = t * t;
          b.mx = ox * b.cfg.pull * f;
          b.my = oy * b.cfg.pull * f;
          b.el.style.setProperty("--mx", b.mx.toFixed(2) + "px");
          b.el.style.setProperty("--my", b.my.toFixed(2) + "px");
        }

        /* Strongest field wins, so overlapping attractors do not fight. */
        if (t > best) {
          best = t;
          gx = dx * b.cfg.grab * t;
          gy = dy * b.cfg.grab * t;
        }

        if (inside && b.cfg.dissolve) dissolve = true;
      }

      cursor.style.left = x + gx + "px";
      cursor.style.top = y + gy + "px";
      cursor.classList.toggle("is-dissolved", dissolve);
    };

    var schedule = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(step);
    };

    document.addEventListener(
      "mousemove",
      function (e) {
        x = e.clientX;
        y = e.clientY;
        if (!shown) {
          cursor.style.display = "block";
          shown = true;
        }
        schedule();
      },
      { passive: true }
    );

    /* Scrolling moves the fields past a stationary pointer, so the whole thing
       has to be recomputed even when the mouse has not moved. */
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("click", schedule);

    document.addEventListener("mouseleave", function () {
      cursor.style.display = "none";
      shown = false;
      bodies.forEach(settle);
    });

    document.addEventListener("mousedown", function () {
      cursor.classList.add("is-pressing");
    });
    document.addEventListener("mouseup", function () {
      cursor.classList.remove("is-pressing");
    });
  }

})();
