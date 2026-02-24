/* =============================================================
  Esoteric Ink - Boot + Cascade controller (WordPress pages)
  -------------------------------------------------------------
  What remains:
  - Full boot "power on" flicker on each page load
    (no pre-flash because HTML starts with .ei-booting-full)
  - After boot ends: a quick top-to-bottom cascade

  Priority:
  - Any element with data-ei-cascade-first (or inside one) will
    animate first in the cascade.
============================================================= */
(function () {
  var BOOT_DURATION_MS = 2200;
  var TARGET_VERSION = "3.14";

  function initEsotericInk() {
    startVersionLabelEnforcer(TARGET_VERSION);
    applyTemporaryServiceStatus();

    var root = document.getElementById("ei-spa-root") || document.getElementById("main");
    if (!root) return;

    var bootDuration = runFullBoot(root);
    window.clearTimeout(initEsotericInk._cascadeTimer);
    initEsotericInk._cascadeTimer = window.setTimeout(function () {
      runCascadeIn(root);
    }, bootDuration);
  }

  function runFullBoot(root) {
    console.debug("fullboot." + (root.id || "unknown-root"));

    window.clearTimeout(runFullBoot._t);

    var targets = Array.from(root.querySelectorAll(".ei-boot-chunk"));
    if (targets.length === 0) {
      root.classList.remove("ei-booting-full");
      return 0;
    }

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    targets.forEach(function (el) {
      el.style.removeProperty("--ei-fd");
      el.style.removeProperty("--ei-fdur");
      el.style.removeProperty("--ei-fseed");
    });

    root.classList.add("ei-booting-full");

    var maxDelay = 720;
    var lateChance = 0.22;

    targets.forEach(function (el) {
      var early = Math.random() > lateChance;
      var delay = early ? rand(0, maxDelay) : rand(maxDelay * 0.55, maxDelay * 1.35);
      var dur = rand(1050, 1750);
      var seed = rand(0, 999);

      el.style.setProperty("--ei-fd", Math.floor(delay) + "ms");
      el.style.setProperty("--ei-fdur", Math.floor(dur) + "ms");
      el.style.setProperty("--ei-fseed", seed.toFixed(2));
    });

    runFullBoot._t = window.setTimeout(function () {
      root.classList.remove("ei-booting-full");
    }, BOOT_DURATION_MS);

    return BOOT_DURATION_MS;
  }

  function runCascadeIn(root) {
    var prev = root.querySelectorAll(".ei-cascade-in");
    prev.forEach(function (el) {
      el.classList.remove("ei-cascade-in");
      el.style.removeProperty("--ei-cd");
    });

    var chunks = Array.from(root.querySelectorAll(".ei-boot-chunk")).filter(function (el) {
      return !el.classList.contains("ei-topnav") && !el.closest(".ei-topnav");
    });

    function priorityOf(el) {
      if (el.hasAttribute("data-ei-cascade-first")) return -100000;
      return el.closest("[data-ei-cascade-first]") ? -100000 : 0;
    }

    chunks.sort(function (a, b) {
      var pa = priorityOf(a);
      var pb = priorityOf(b);
      if (pa !== pb) return pa - pb;

      var ra = a.getBoundingClientRect();
      var rb = b.getBoundingClientRect();
      return (ra.top - rb.top) || (ra.left - rb.left);
    });

    for (var i = 0; i < chunks.length; i += 1) {
      var el = chunks[i];
      el.style.setProperty("--ei-cd", i * 38 + "ms");
      el.classList.add("ei-cascade-in");
    }
  }

  function startVersionLabelEnforcer(version) {
    applyVersionLabel(version);

    if (Array.isArray(startVersionLabelEnforcer._timers)) {
      startVersionLabelEnforcer._timers.forEach(function (timerId) {
        window.clearTimeout(timerId);
      });
    }

    startVersionLabelEnforcer._timers = [
      window.setTimeout(function () {
        applyVersionLabel(version);
      }, 300),
      window.setTimeout(function () {
        applyVersionLabel(version);
      }, 1200),
      window.setTimeout(function () {
        applyVersionLabel(version);
      }, 2500)
    ];

    if (!window.MutationObserver || !document.body) return;

    if (startVersionLabelEnforcer._observer) {
      startVersionLabelEnforcer._observer.disconnect();
    }

    var queued = false;
    function applyQueued() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        applyVersionLabel(version);
      });
    }

    var observer = new MutationObserver(function () {
      applyQueued();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    startVersionLabelEnforcer._observer = observer;
  }

  function applyVersionLabel(version) {
    var normalizedLabel = "ESOTERIC INK SUBSYSTEMS™ v" + version;
    var versionLabelPattern =
      /(Esoteric\s+In(?:k|c)\s+Subsystems(?:\s*™)?(?:\s+Version|\s+v)?\s*)(\d+(?:\.\d+)?)/i;

    var titleTargets = document.querySelectorAll(
      ".ei-topnav-title, .ei-topnav-brand, .topnav-title, [class*='topnav'][class*='title'], .site-title, .navbar-brand, header [class*='title']"
    );

    titleTargets.forEach(function (el) {
      var text = (el.textContent || "").trim();
      if (!text) return;
      if (/Esoteric\s+In(?:k|c)\s+Subsystems/i.test(text)) {
        el.textContent = normalizedLabel;
      }
    });

    if (!document.body || !document.createTreeWalker) return;

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node = walker.nextNode();

    while (node) {
      var parent = node.parentElement;
      if (
        parent &&
        parent.tagName !== "SCRIPT" &&
        parent.tagName !== "STYLE" &&
        versionLabelPattern.test(node.nodeValue)
      ) {
        node.nodeValue = node.nodeValue.replace(versionLabelPattern, "$1" + version);
      }
      node = walker.nextNode();
    }
  }

  function applyTemporaryServiceStatus() {
    var path = window.location && window.location.pathname ? window.location.pathname.toLowerCase() : "/";
    var isHome =
      path === "/" ||
      path === "/home" ||
      path === "/home/" ||
      path.endsWith("/index.html") ||
      path.endsWith("/home.html");
    var root = document.getElementById("ei-spa-root") || document.getElementById("main") || document.body;

    var homeNavLinks = document.querySelectorAll(
      ".ei-topnav-button[href='/'], .ei-topnav-button[href='/home/'], .ei-topnav-button[href='/home'], .ei-topnav-button[href='index.html'], .ei-topnav-button[href='./'], .ei-topnav-button[href='home.html']"
    );

    homeNavLinks.forEach(function (link) {
      var current = (link.textContent || "").trim();
      if (!current) return;
      if (/temp down/i.test(current)) return;
      link.textContent = current + " (TEMP DOWN)";
    });

    if (!isHome) return;

    if (!document.getElementById("ei-home-temp-status")) {
      var notice = document.createElement("section");
      notice.id = "ei-home-temp-status";
      notice.className = "ei-panel ei-boot-chunk";
      notice.style.marginBottom = "1.25rem";
      notice.innerHTML =
        "<h2 class='ei-section-title'>Homepage Temporary Downstate</h2>" +
        "<p>Home is in temporary maintenance and will be back within 24 hours.</p>" +
        "<div class='ei-callout'><strong>Service status:</strong> Socials and About are online right now.</div>";

      var shell = root.querySelector(".ei-shell") || root;
      var nav = shell.querySelector(".ei-topnav");
      if (nav && nav.parentNode) {
        nav.insertAdjacentElement("afterend", notice);
      } else {
        shell.insertBefore(notice, shell.firstChild);
      }
    }

    var sectionsToHide = root.querySelectorAll(".ei-stream, .ei-home-stack, .ei-contact, .ei-footer");
    sectionsToHide.forEach(function (el) {
      el.style.display = "none";
    });

    var homeSubtitle = root.querySelector(".ei-hero .ei-subtitle, .ei-subtitle");
    if (homeSubtitle) {
      homeSubtitle.textContent =
        "Homepage is temporarily down for maintenance. Socials and About remain available.";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEsotericInk);
  } else {
    initEsotericInk();
  }
})();
