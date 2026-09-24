/* ==========================================================================
   taktek terminal
   --------------------------------------------------------------------------
   Click the wordmark. Everything below runs in this tab and only this tab.

   No fetch, no storage, no state that survives a refresh. `js` evals in page
   scope, which the browser's own console already allows, so it hands out
   nothing the visitor did not already have. It is deliberately impossible to
   seed from the URL: a console you can fill from a link is a reflected XSS
   vector wearing an easter egg costume.
   ========================================================================== */

(function () {
  "use strict";

  var mark = document.querySelector(".mark");
  var host = document.querySelector("[data-term]");
  if (!mark || !host) return;

  var NOTES = [
    ["two-verbs-for-a-mac", "Two verbs, and evidence for both"],
    ["stop-after-two-failures", "The same step failed twice, so it stopped"],
    ["assert-on-a-different-channel", "Assert on a channel you did not write to"],
    ["stop-an-llm-inventing-facts", "How I stop an LLM from inventing facts"]
  ];
  var WORK = [
    ["hobeichlegal.com", "Lebanese company law, and the four sites that sell it"],
    ["closet.ai", "Zara, Bershka and Stradivarius in Lebanon, in one place"],
    ["bucksbuddy.com", "Track your expenses"],
    ["ghazl.ai", "One photo into ready-to-post scenes"],
    ["fitnessspotlb.com", "Private personal training in Aley"],
    ["sawfarnews.com", "\u0635\u0648\u0641\u0631 \u0646\u064a\u0648\u0632, news for Sawfar and Lebanon"]
  ];

  var el = document.createElement("div");
  el.className = "term";
  el.innerHTML =
    '<div class="term__bar"><span class="term__dot"></span><span>taktek &mdash; local shell</span>' +
    '<span class="term__x" role="button" tabindex="0" title="Close">esc</span></div>' +
    '<div class="term__out" aria-live="polite"></div>' +
    '<div class="term__line"><span class="term__ps">&rsaquo;</span>' +
    '<input class="term__in" autocomplete="off" autocapitalize="off" spellcheck="false" ' +
    'aria-label="Terminal input" enterkeyhint="go"></div>';
  host.appendChild(el);

  var out = el.querySelector(".term__out");
  var input = el.querySelector(".term__in");
  var hist = [], hp = 0, game = null;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function say(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }
  function open_() {
    el.classList.add("on");
    if (!out.childElementCount) {
      say("<b>taktek</b> &mdash; a shell that runs in your tab and nowhere else.");
      say("<u>Nothing here leaves your browser. Type</u> <i>help</i><u>.</u>");
    }
    input.focus();
  }
  function close_() {
    el.classList.remove("on");
    if (game) { game.stop(); game = null; }
  }

  mark.addEventListener("click", function (e) {
    e.preventDefault();
    el.classList.contains("on") ? close_() : open_();
  });
  el.querySelector(".term__x").addEventListener("click", close_);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && el.classList.contains("on")) close_();
  });

  /* --- commands ---------------------------------------------------------- */

  var CMDS = {
    help: function () {
      say("<b>help</b>        this");
      say("<b>ls</b>          what is here");
      say("<b>notes</b>       the writing");
      say("<b>open</b> <u>n</u>      open something, by number or name");
      say("<b>whoami</b>      you, roughly");
      say("<b>theme</b>       flip it");
      say("<b>asteroids</b>   " + "← → turn, ↑ thrust, space shoot, q quit");
      say("<b>js</b> <u>code</u>     run javascript on this page, like the dev console");
      say("<b>hijack</b>      every element becomes editable. refresh undoes it");
      say("<b>clear</b>       wipe the scroll");
      say("<b>exit</b>        close, or press esc");
    },
    ls: function () {
      WORK.forEach(function (w, i) {
        say("<i>" + (i + 1) + "</i>  <b>" + w[0] + "</b>  <u>" + esc(w[1]) + "</u>");
      });
      say("<u>notes/  terms/  privacy/  support/</u>");
    },
    notes: function () {
      NOTES.forEach(function (n, i) {
        say("<i>" + (i + 1) + "</i>  <b>" + esc(n[1]) + "</b>");
      });
      say("<u>open 1</u>  or  <u>open " + NOTES[0][0] + "</u>");
    },
    open: function (a) {
      if (!a) return say("<u>open what? try</u> <i>ls</i> <u>or</u> <i>notes</i>");
      var n = parseInt(a, 10), url = null;
      if (n >= 1 && n <= WORK.length && String(n) === a.trim()) url = "https://" + WORK[n - 1][0];
      if (!url) {
        WORK.forEach(function (w) { if (w[0].indexOf(a) === 0) url = "https://" + w[0]; });
        NOTES.forEach(function (x) { if (x[0].indexOf(a) === 0) url = "/notes/" + x[0] + "/"; });
      }
      if (!url) return say("<u>no such thing: " + esc(a) + "</u>");
      say("<u>opening " + esc(url) + "</u>");
      window.open(url, "_blank", "noopener");
    },
    whoami: function () {
      say("<b>" + esc(navigator.userAgent.split(") ")[0].split("(").pop()) + "</b>");
      say("<u>viewport</u> " + innerWidth + "×" + innerHeight +
          "  <u>dpr</u> " + (devicePixelRatio || 1) +
          "  <u>lang</u> " + esc(navigator.language));
      say("<u>you are a guest, and the shell is yours while you are here.</u>");
    },
    theme: function () {
      var m = document.getElementById("mode");
      if (m) { m.checked = !m.checked; say("<u>flipped</u>"); }
    },
    clear: function () { out.innerHTML = ""; },
    exit: close_,
    sudo: function () { say("<u>nice try. everything here is already yours.</u>"); },
    js: function (a) {
      if (!a) return say("<u>js &lt;code&gt;. it evaluates on this page, same as the console.</u>");
      try {
        /* Typed by the visitor, in the visitor's own tab. Same power the dev
           console gives, and nothing here can be triggered by a link. */
        var r = (0, eval)(a);
        say("<i>&lt;</i> " + esc(r === undefined ? "undefined" :
            (typeof r === "object" ? JSON.stringify(r) : String(r))).slice(0, 2000));
      } catch (err) {
        say("<b>" + esc(err.name) + "</b> <u>" + esc(err.message) + "</u>");
      }
    },
    hijack: function () {
      document.designMode = document.designMode === "on" ? "off" : "on";
      say(document.designMode === "on"
        ? "<i>the page is yours.</i> <u>click anything and type. refresh puts it back.</u>"
        : "<u>handed back.</u>");
    },
    asteroids: function () { game = asteroids(); }
  };
  CMDS.cat = CMDS.open;
  CMDS.man = CMDS.help;
  CMDS["?"] = CMDS.help;

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") { e.preventDefault(); if (hp > 0) input.value = hist[--hp] || ""; return; }
    if (e.key === "ArrowDown") { e.preventDefault(); if (hp < hist.length) input.value = hist[++hp] || ""; return; }
    if (e.key !== "Enter") return;
    var raw = input.value.trim();
    input.value = "";
    if (!raw) return;
    hist.push(raw); hp = hist.length;
    say('<span class="term__ps">&rsaquo;</span> ' + esc(raw));
    var sp = raw.indexOf(" ");
    var cmd = (sp < 0 ? raw : raw.slice(0, sp)).toLowerCase();
    var arg = sp < 0 ? "" : raw.slice(sp + 1);
    (CMDS[cmd] || function () {
      say("<u>" + esc(cmd) + ": not a command. try</u> <i>help</i>");
    })(arg);
  });

  /* --- asteroids ---------------------------------------------------------
     Vector, wrapping, and the rocks split twice. Rendered in the page's own
     ink so it belongs to the site rather than sitting on top of it. */

  function asteroids() {
    var c = document.createElement("canvas");
    var W = 640, H = 340;
    c.width = W * 2; c.height = H * 2;
    c.style.height = H + "px";
    el.insertBefore(c, el.querySelector(".term__line"));
    var g = c.getContext("2d");
    g.scale(2, 2);

    var ink = getComputedStyle(document.body).color;
    var sig = getComputedStyle(document.documentElement).getPropertyValue("--signal").trim() || "#00A862";

    var ship = { x: W / 2, y: H / 2, a: -Math.PI / 2, vx: 0, vy: 0, dead: 0 };
    var rocks = [], shots = [], keys = {}, score = 0, lives = 3, wave = 0, raf = 0, over = false;

    function mkRock(x, y, r) {
      var a = Math.random() * 6.28, s = (3.2 - r / 22) * (0.5 + Math.random() * 0.6);
      var v = [], n = 9 + ((Math.random() * 4) | 0);
      for (var i = 0; i < n; i++) v.push(0.68 + Math.random() * 0.5);
      return { x: x, y: y, r: r, vx: Math.cos(a) * s, vy: Math.sin(a) * s, v: v, rot: (Math.random() - 0.5) * 0.02, an: 0 };
    }
    function spawn() {
      wave++;
      for (var i = 0; i < 3 + wave; i++) {
        var edge = Math.random() < 0.5;
        rocks.push(mkRock(edge ? 0 : Math.random() * W, edge ? Math.random() * H : 0, 34));
      }
    }
    spawn();

    function key(e) {
      var d = e.type === "keydown";
      var k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", " ", "a", "d", "w"].indexOf(k) > -1) e.preventDefault();
      if (k === "q" && d) { stop(); say("<u>score " + score + ". back to the prompt.</u>"); return; }
      keys[k] = d;
    }
    function wrap(o) {
      if (o.x < 0) o.x += W; if (o.x > W) o.x -= W;
      if (o.y < 0) o.y += H; if (o.y > H) o.y -= H;
    }

    function step() {
      if (keys.arrowleft || keys.a) ship.a -= 0.062;
      if (keys.arrowright || keys.d) ship.a += 0.062;
      if (keys.arrowup || keys.w) { ship.vx += Math.cos(ship.a) * 0.13; ship.vy += Math.sin(ship.a) * 0.13; }
      if (keys[" "] && !ship.cool && !ship.dead) {
        shots.push({ x: ship.x + Math.cos(ship.a) * 10, y: ship.y + Math.sin(ship.a) * 10,
                     vx: Math.cos(ship.a) * 6 + ship.vx, vy: Math.sin(ship.a) * 6 + ship.vy, life: 58 });
        ship.cool = 9;
      }
      if (ship.cool) ship.cool--;
      ship.vx *= 0.991; ship.vy *= 0.991;
      ship.x += ship.vx; ship.y += ship.vy; wrap(ship);
      if (ship.dead) ship.dead--;

      shots.forEach(function (s) { s.x += s.vx; s.y += s.vy; s.life--; wrap(s); });
      shots = shots.filter(function (s) { return s.life > 0; });

      rocks.forEach(function (r) { r.x += r.vx; r.y += r.vy; r.an += r.rot; wrap(r); });

      for (var i = rocks.length - 1; i >= 0; i--) {
        for (var j = shots.length - 1; j >= 0; j--) {
          var dx = rocks[i].x - shots[j].x, dy = rocks[i].y - shots[j].y;
          if (dx * dx + dy * dy < rocks[i].r * rocks[i].r) {
            score += Math.round(120 / rocks[i].r) * 10;
            if (rocks[i].r > 15) {
              rocks.push(mkRock(rocks[i].x, rocks[i].y, rocks[i].r / 2));
              rocks.push(mkRock(rocks[i].x, rocks[i].y, rocks[i].r / 2));
            }
            rocks.splice(i, 1); shots.splice(j, 1);
            break;
          }
        }
      }
      if (!ship.dead) {
        for (var k2 = 0; k2 < rocks.length; k2++) {
          var ax = rocks[k2].x - ship.x, ay = rocks[k2].y - ship.y;
          if (ax * ax + ay * ay < (rocks[k2].r + 6) * (rocks[k2].r + 6)) {
            lives--; ship.dead = 110;
            ship.x = W / 2; ship.y = H / 2; ship.vx = ship.vy = 0;
            if (lives <= 0) over = true;
            break;
          }
        }
      }
      if (!rocks.length) spawn();
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = ink; g.lineWidth = 1.2; g.lineJoin = "round";

      rocks.forEach(function (r) {
        g.beginPath();
        for (var i = 0; i < r.v.length; i++) {
          var a = r.an + (i / r.v.length) * 6.283, rr = r.r * r.v[i];
          i ? g.lineTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr)
            : g.moveTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr);
        }
        g.closePath(); g.stroke();
      });

      g.fillStyle = sig;
      shots.forEach(function (s) { g.fillRect(s.x - 1.3, s.y - 1.3, 2.6, 2.6); });

      if (!ship.dead || Math.floor(ship.dead / 8) % 2) {
        g.save(); g.translate(ship.x, ship.y); g.rotate(ship.a);
        g.beginPath(); g.moveTo(11, 0); g.lineTo(-7, 6); g.lineTo(-4, 0); g.lineTo(-7, -6);
        g.closePath(); g.stroke();
        if ((keys.arrowup || keys.w) && !ship.dead) {
          g.beginPath(); g.moveTo(-5, 3); g.lineTo(-11 - Math.random() * 5, 0); g.lineTo(-5, -3);
          g.strokeStyle = sig; g.stroke(); g.strokeStyle = ink;
        }
        g.restore();
      }

      g.fillStyle = ink;
      g.font = '600 12px ui-monospace, monospace';
      g.fillText("score " + score, 12, 20);
      g.fillText("ships " + Math.max(0, lives), 12, 36);
      if (over) {
        g.font = '600 20px ui-monospace, monospace';
        g.fillText("game over — q to quit", W / 2 - 108, H / 2);
      }
    }

    function loop() { if (!over) step(); draw(); raf = requestAnimationFrame(loop); }
    function stop() {
      cancelAnimationFrame(raf);
      removeEventListener("keydown", key); removeEventListener("keyup", key);
      c.remove(); game = null; input.focus();
    }

    addEventListener("keydown", key); addEventListener("keyup", key);
    loop();
    say("<u>asteroids. arrows to fly, space to shoot, q to quit.</u>");
    c.scrollIntoView({ block: "nearest" });
    return { stop: stop };
  }
})();
