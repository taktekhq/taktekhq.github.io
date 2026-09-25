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
  var hist = [], hp = 0;

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
      say("<b>js</b> <u>code</u>     run javascript on this page, like the dev console");
      say("<b>hijack</b>      every element becomes editable. refresh undoes it");
      say("<b>clear</b>       wipe the scroll");
      say("<b>reload</b>      reload the page, and everything you did to it");
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
    reload: function () {
      say("<u>reloading\u2026</u>");
      setTimeout(function () { location.reload(); }, 220);
    },
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

})();
