/* =========================================================
   FindYourPeople – display & accessibility settings
   Loaded in <head> so the saved theme is applied BEFORE the page
   draws (no flash of the wrong colours).

   Settings:  theme (system | light | dark), text size,
              high contrast, easy-read text, reduce motion.
   Storage:   saved in this browser's localStorage ONLY when the
              user changes something (key "fyp-display"). Nothing
              is sent anywhere. Defaults follow the device settings.
   AI-assisted: first draft generated with Claude (Anthropic).
   ========================================================= */

(function () {
  "use strict";

  var KEY = "fyp-display";
  var root = document.documentElement;
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var darkMQ = mq("(prefers-color-scheme: dark)");

  /** Defaults respect the user's device/OS accessibility settings. */
  function defaults() {
    return {
      theme: "system",
      text: "normal",
      contrast: mq("(prefers-contrast: more)").matches,
      readable: false,
      motion: mq("(prefers-reduced-motion: reduce)").matches,
    };
  }

  function load() {
    var p = defaults();
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
      for (var k in p) if (Object.prototype.hasOwnProperty.call(saved, k)) p[k] = saved[k];
    } catch (e) { /* storage blocked or corrupt – just use defaults */ }
    return p;
  }

  function isDefault(p) {
    var d = defaults();
    for (var k in d) if (d[k] !== p[k]) return false;
    return true;
  }

  function save(p) {
    try {
      // Store nothing unless the user has actually changed a setting
      if (isDefault(p)) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, JSON.stringify(p));
    } catch (e) { /* private mode etc. – settings still work for this visit */ }
  }

  function isDark(p) {
    return p.theme === "dark" || (p.theme === "system" && darkMQ.matches);
  }

  function setAttr(name, value) {
    if (value) root.setAttribute(name, value);
    else root.removeAttribute(name);
  }

  function apply(p) {
    root.setAttribute("data-theme", isDark(p) ? "dark" : "light");
    setAttr("data-text", p.text === "large" || p.text === "xlarge" ? p.text : "");
    setAttr("data-contrast", p.contrast ? "high" : "");
    setAttr("data-readable", p.readable ? "on" : "");
    setAttr("data-motion", p.motion ? "reduce" : "");
  }

  var prefs = load();
  apply(prefs);   // runs immediately, before <body> is drawn

  // ---------- UI wiring (after the DOM exists) ----------
  document.addEventListener("DOMContentLoaded", function () {
    var toggle  = document.getElementById("theme-toggle");
    var opener  = document.getElementById("a11y-open");
    var dialog  = document.getElementById("a11y-dialog");
    var form    = document.getElementById("a11y-form");
    var reset   = document.getElementById("a11y-reset");
    var status  = document.getElementById("a11y-status");
    var footerOpener = document.getElementById("a11y-open-footer");
    var lastOpener = null;

    function syncUI() {
      var dark = isDark(prefs);
      toggle.setAttribute("aria-pressed", String(dark));

      form.querySelectorAll('input[name="theme"]').forEach(function (r) { r.checked = r.value === prefs.theme; });
      form.querySelectorAll('input[name="text"]').forEach(function (r) { r.checked = r.value === prefs.text; });
      form.elements.contrast.checked = !!prefs.contrast;
      form.elements.readable.checked = !!prefs.readable;
      form.elements.motion.checked = !!prefs.motion;
    }

    function update(changes, message) {
      for (var k in changes) prefs[k] = changes[k];
      apply(prefs);
      save(prefs);
      syncUI();
      if (message) {
        // Announce visual changes for screen reader users
        status.textContent = "";
        setTimeout(function () { status.textContent = message; }, 50);
      }
    }

    // Quick dark-mode toggle in the header
    toggle.addEventListener("click", function () {
      var nowDark = !isDark(prefs);
      update({ theme: nowDark ? "dark" : "light" }, nowDark ? "Dark mode on" : "Light mode on");
    });

    // Settings change live as you pick them
    form.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "theme" || t.name === "text") update(fromForm());
      else if (t.type === "checkbox") update(fromForm());
    });

    function fromForm() {
      var themeEl = form.querySelector('input[name="theme"]:checked');
      var textEl = form.querySelector('input[name="text"]:checked');
      return {
        theme: themeEl ? themeEl.value : "system",
        text: textEl ? textEl.value : "normal",
        contrast: form.elements.contrast.checked,
        readable: form.elements.readable.checked,
        motion: form.elements.motion.checked,
      };
    }

    reset.addEventListener("click", function () {
      update(defaults(), "Display settings reset to default");
    });

    // Open / close the dialog
    function openDialog(e) {
      lastOpener = e.currentTarget;
      syncUI();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    opener.addEventListener("click", openDialog);
    if (footerOpener) footerOpener.addEventListener("click", openDialog);

    dialog.addEventListener("close", function () {
      if (lastOpener) lastOpener.focus();
    });
    // Click on the dimmed backdrop closes it
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });

    // Follow the device theme live while set to "Match my device"
    var onSystemChange = function () { if (prefs.theme === "system") { apply(prefs); syncUI(); } };
    if (darkMQ.addEventListener) darkMQ.addEventListener("change", onSystemChange);

    syncUI();
  });
})();
