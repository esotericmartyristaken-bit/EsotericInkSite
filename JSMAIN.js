/* =============================================================
  Esoteric Ink - Boot + Cascade controller (WordPress pages)
  -------------------------------------------------------------
  What remains:
  - Full boot "power on" flicker on each page load
    (element-level only, no global dimming layer)
  - After boot ends: a quick top-to-bottom cascade

  Priority:
  - Any element with data-ei-cascade-first (or inside one) will
    animate first in the cascade.
============================================================= */
(function () {
  var TARGET_VERSION = "3.86";
  var TEMP_DOWN_DEFAULT = false;
  var runtime = window.__eiRuntime || {};

  function clearExistingRuntime(state) {
    if (!state) return;
    if (state.observer) state.observer.disconnect();
    if (state.navClickHandler) {
      document.removeEventListener("click", state.navClickHandler);
      state.navClickHandler = null;
    }
    if (state.navPopHandler) {
      window.removeEventListener("popstate", state.navPopHandler);
      state.navPopHandler = null;
    }
    if (state.optionClickHandler) {
      document.removeEventListener("click", state.optionClickHandler);
      state.optionClickHandler = null;
    }
    if (state.navAbortController) {
      try {
        state.navAbortController.abort();
      } catch (_) {}
      state.navAbortController = null;
    }
    if (Array.isArray(state.versionTimers)) {
      state.versionTimers.forEach(function (timerId) {
        window.clearTimeout(timerId);
      });
    }
    window.clearTimeout(state.bootTimer);
    window.clearTimeout(state.cascadeTimer);
    if (state.versionRaf) window.cancelAnimationFrame(state.versionRaf);
  }

  clearExistingRuntime(window.__eiRuntime);

  runtime.observer = null;
  runtime.versionTimers = [];
  runtime.bootTimer = 0;
  runtime.cascadeTimer = 0;
  runtime.versionRaf = 0;
  runtime.navPopHandler = null;
  runtime.navClickHandler = null;
  runtime.navAbortController = null;
  runtime.navRequestSeq = 0;
  runtime.cleanup = function () {
    clearExistingRuntime(runtime);
  };
  window.__eiRuntime = runtime;

  function shouldRunCascade(root) {
    return root.getAttribute("data-ei-cascade-after-boot") === "true";
  }

  function initEsotericInk() {
    bindSpaNavigation();
    renderCurrentDocument(false);
  }

  function renderCurrentDocument(allowCascade) {
    startVersionLabelEnforcer(TARGET_VERSION);

    var root = document.getElementById("ei-spa-root") || document.getElementById("main");
    if (!root) return;

    initUserOptions(root);
    applyTemporaryServiceStatus(root);
    applyAmbientRandomization(root);

    var bootDuration = runFullBoot(root);
    window.clearTimeout(runtime.cascadeTimer);
    if (allowCascade && shouldRunCascade(root)) {
      runtime.cascadeTimer = window.setTimeout(function () {
        runCascadeIn(root);
      }, bootDuration);
    }
  }

  function runFullBoot(root) {
    console.debug("fullboot." + (root.id || "unknown-root"));

    window.clearTimeout(runtime.bootTimer);

    var targets = collectBootTargets(root);
    if (targets.length === 0) {
      return 0;
    }

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    targets.forEach(function (el) {
      el.style.removeProperty("--ei-fd");
      el.style.removeProperty("--ei-fdur");
      el.style.removeProperty("--ei-fseed");
      el.style.removeProperty("--ei-mono");
      el.style.removeProperty("--ei-mboost");
      el.style.removeProperty("--ei-fx");
    });

    root.classList.remove("ei-flicker-pass");
    void root.offsetWidth;
    root.classList.add("ei-flicker-pass");

    var maxDelay = 170;

    var decorated = targets.map(function (el, index) {
      var rect = el.getBoundingClientRect();
      return {
        el: el,
        top: Math.max(0, rect.top || 0),
        left: Math.max(0, rect.left || 0),
        index: index
      };
    });

    decorated.sort(function (a, b) {
      return (a.top - b.top) || (a.left - b.left) || (a.index - b.index);
    });

    var maxAnimationEndMs = 0;
    decorated.forEach(function (entry, order) {
      var el = entry.el;
      var yFactor = Math.min(1, entry.top / Math.max(window.innerHeight || 1, 1));
      var waveDelay = yFactor * maxDelay;
      var orderDelay = order * 9;
      var jitter = rand(-24, 48);
      var phaseNudge = (order % 5) * 7;
      var topBias = Math.max(0, 110 - (entry.top * 0.26));
      var delay = Math.max(0, waveDelay + orderDelay + phaseNudge + jitter - topBias);
      if (order < 4) delay = rand(0, 36);
      var isButtonLike =
        el.matches &&
        el.matches("a, button, .ei-stream-item, .ei-route-card, .ei-route-link");
      var hasImage = el.matches && el.matches(".ei-stream-item--with-image, .ei-route-card--with-image");
      var verticalTail = yFactor * rand(40, 110);
      var settleSpread = rand(0, 170);
      var dur = hasImage ? rand(620, 860) : (isButtonLike ? rand(520, 760) : rand(430, 620));
      dur += verticalTail + settleSpread;
      var seed = rand(0, 999);
      var monoChance = hasImage ? 0.92 : (isButtonLike ? 0.44 : 0.16);
      var mono = Math.random() < monoChance ? (hasImage ? rand(0.90, 1.0) : rand(0.72, 0.96)) : 0;
      var fxRoll = Math.random();
      var fxName = fxRoll < 0.34 ? "eiPowerFlickerChunkA" : (fxRoll < 0.67 ? "eiPowerFlickerChunkB" : "eiPowerFlickerChunkC");
      var animationEnd = delay + dur;
      if (animationEnd > maxAnimationEndMs) maxAnimationEndMs = animationEnd;

      el.style.setProperty("--ei-fd", Math.floor(delay) + "ms");
      el.style.setProperty("--ei-fdur", Math.floor(dur) + "ms");
      el.style.setProperty("--ei-fseed", seed.toFixed(2));
      el.style.setProperty("--ei-mono", mono.toFixed(2));
      el.style.setProperty("--ei-mboost", hasImage ? "1.48" : "1.00");
      el.style.setProperty("--ei-fx", fxName);
    });

    var bootDuration = Math.max(620, Math.ceil(maxAnimationEndMs + 130));
    runtime.bootTimer = window.setTimeout(function () {
      root.classList.remove("ei-flicker-pass");
    }, bootDuration + 180);

    return bootDuration;
  }

  function applyAmbientRandomization(root) {
    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    var pulseFx = ["eiBorderFlowA", "eiBorderFlowB", "eiBorderFlowC"];
    var pulseEase = ["linear", "cubic-bezier(0.20, 0.78, 0.22, 1.0)", "cubic-bezier(0.28, 0.72, 0.24, 1.0)"];
    Array.from(root.querySelectorAll(".ei-stream-item, .ei-route-card")).forEach(function (el) {
      var fx = pulseFx[Math.floor(Math.random() * pulseFx.length)];
      var ease = pulseEase[Math.floor(Math.random() * pulseEase.length)];
      el.style.setProperty("--ei-pulse-fx", fx);
      el.style.setProperty("--ei-pulse-dur", rand(3.9, 6.8).toFixed(2) + "s");
      el.style.setProperty("--ei-pulse-delay", (-rand(0.2, 6.4)).toFixed(2) + "s");
      el.style.setProperty("--ei-pulse-ease", ease);
    });

    var holoFx = ["eiHoloFlowA", "eiHoloFlowB", "eiHoloFlowC"];
    Array.from(root.querySelectorAll(".ei-stream-title, .ei-route-title")).forEach(function (el) {
      var fx = holoFx[Math.floor(Math.random() * holoFx.length)];
      el.style.setProperty("--ei-holo-fx", fx);
      el.style.setProperty("--ei-holo-dur", rand(6.4, 10.6).toFixed(2) + "s");
      el.style.setProperty("--ei-holo-delay", (-rand(0.2, 7.6)).toFixed(2) + "s");
    });

    var headingFx = ["eiHoloSweepA", "eiHoloSweepB", "eiHoloSweepC"];
    Array.from(root.querySelectorAll(".ei-title, .ei-socials-title, .ei-section-title")).forEach(function (el) {
      var fx = headingFx[Math.floor(Math.random() * headingFx.length)];
      el.style.setProperty("--ei-holo-fx", fx);
      el.style.setProperty("--ei-holo-dur", rand(5.8, 8.8).toFixed(2) + "s");
      el.style.setProperty("--ei-holo-delay", (-rand(0.1, 6.6)).toFixed(2) + "s");
    });
  }

  function bindSpaNavigation() {
    if (runtime.navClickHandler) {
      document.removeEventListener("click", runtime.navClickHandler);
      runtime.navClickHandler = null;
    }
    if (runtime.navPopHandler) {
      window.removeEventListener("popstate", runtime.navPopHandler);
      runtime.navPopHandler = null;
    }

    runtime.navClickHandler = function (event) {
      var link = event.target && event.target.closest
        ? event.target.closest("a.ei-topnav-button[href]")
        : null;
      if (!link) return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if ((link.getAttribute("target") || "").toLowerCase() === "_blank") return;

      var href = link.getAttribute("href") || "";
      if (!/\.html(?:[#?].*)?$/i.test(href)) return;

      event.preventDefault();
      navigateToPage(href, true);
    };

    runtime.navPopHandler = function () {
      navigateToPage(window.location.pathname + window.location.search + window.location.hash, false);
    };

    document.addEventListener("click", runtime.navClickHandler);
    window.addEventListener("popstate", runtime.navPopHandler);
  }

  async function navigateToPage(targetHref, pushState) {
    try {
      if (!window.fetch || !window.DOMParser || !window.URL) {
        window.location.href = targetHref;
        return;
      }

      var absolute = new URL(targetHref, window.location.href);
      if (absolute.origin !== window.location.origin) {
        window.location.href = absolute.href;
        return;
      }

      var requestSeq = (runtime.navRequestSeq || 0) + 1;
      runtime.navRequestSeq = requestSeq;

      if (runtime.navAbortController) {
        try {
          runtime.navAbortController.abort();
        } catch (_) {}
      }
      var controller = window.AbortController ? new AbortController() : null;
      runtime.navAbortController = controller;

      var response = await fetch(absolute.pathname + absolute.search, {
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      });
      if (requestSeq !== runtime.navRequestSeq) return;
      if (!response.ok) {
        window.location.href = absolute.href;
        return;
      }

      var html = await response.text();
      if (requestSeq !== runtime.navRequestSeq) return;
      var parsed = new DOMParser().parseFromString(html, "text/html");
      var nextRoot = parsed.getElementById("ei-spa-root");
      var currentRoot = document.getElementById("ei-spa-root");
      if (!nextRoot || !currentRoot) {
        window.location.href = absolute.href;
        return;
      }

      var currentShell = currentRoot.querySelector(".ei-shell");
      var nextShell = nextRoot.querySelector(".ei-shell");
      if (!currentShell || !nextShell) {
        window.location.href = absolute.href;
        return;
      }

      document.title = parsed.title || document.title;
      currentRoot.className = nextRoot.className;
      currentShell.replaceWith(nextShell);

      if (pushState) {
        history.pushState({ ei: true }, "", absolute.pathname + absolute.search + absolute.hash);
      }

      renderCurrentDocument(true);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.error("[EI] navigation fallback:", error);
      window.location.href = targetHref;
    } finally {
      runtime.navAbortController = null;
    }
  }

  function collectBootTargets(root) {
    var primary = Array.from(root.querySelectorAll(".ei-boot-chunk"));
    var detail = Array.from(
      root.querySelectorAll(".ei-stream-item, .ei-route-card, .ei-route-link")
    );
    var seen = new Set();
    var merged = [];

    function pushUnique(el) {
      if (!el || seen.has(el)) return;
      seen.add(el);
      merged.push(el);
    }

    primary.forEach(pushUnique);
    detail.forEach(pushUnique);
    return merged;
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

    if (Array.isArray(runtime.versionTimers)) {
      runtime.versionTimers.forEach(function (timerId) {
        window.clearTimeout(timerId);
      });
    }

    runtime.versionTimers = [
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

    if (runtime.observer) {
      runtime.observer.disconnect();
    }

    var queued = false;
    function applyQueued() {
      if (queued) return;
      queued = true;
      var schedule = window.requestAnimationFrame || function (cb) {
        return window.setTimeout(cb, 16);
      };
      runtime.versionRaf = schedule(function () {
        queued = false;
        applyVersionLabel(version);
      });
    }

    var observer = new MutationObserver(function () {
      applyQueued();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    runtime.observer = observer;
  }

  function applyVersionLabel(version) {
    var normalizedLabel = "ESOTERIC INK SUBSYSTEMS™ v" + version;
    var versionLabelPattern =
      /(Esoteric\s+In(?:k|c)\s+Subsystems(?:\s*™)?(?:\s+Version|\s+v)?\s*)(\d+(?:\.\d+)?)/i;

    var brandTargets = document.querySelectorAll(".ei-topnav-brand");
    brandTargets.forEach(function (brand) {
      var titleEl = brand.querySelector(".ei-topnav-title");
      var brandText = (brand.textContent || "").trim();
      if (!/Esoteric\s+In(?:k|c)\s+Subsystems/i.test(brandText)) return;

      if (!titleEl) {
        brand.textContent = "";
        titleEl = document.createElement("span");
        titleEl.className = "ei-topnav-title";
        brand.appendChild(titleEl);
      }
      titleEl.textContent = normalizedLabel;
    });

    var titleTargets = document.querySelectorAll(
      ".ei-topnav-title, .topnav-title, [class*='topnav'][class*='title'], .site-title, .navbar-brand, header [class*='title']"
    );

    titleTargets.forEach(function (el) {
      var text = (el.textContent || "").trim();
      if (!text) return;
      if (/Esoteric\s+In(?:k|c)\s+Subsystems/i.test(text)) {
        el.textContent = normalizedLabel;
      }
    });

    if (!document.body || !document.createTreeWalker || !window.NodeFilter) return;

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
        var replaced = node.nodeValue.replace(versionLabelPattern, "$1" + version);
        if (replaced !== node.nodeValue) {
          node.nodeValue = replaced;
        }
      }
      node = walker.nextNode();
    }
  }

  function initUserOptions(root) {
    if (runtime.optionClickHandler) {
      document.removeEventListener("click", runtime.optionClickHandler);
      runtime.optionClickHandler = null;
    }
  }

  function applyTemporaryServiceStatus(root) {
    var tempDownEnabled =
      window.EI_TEMP_DOWN === true ||
      (root && root.getAttribute("data-ei-temp-down") === "true") ||
      TEMP_DOWN_DEFAULT;
    if (!tempDownEnabled) return;

    var path = window.location && window.location.pathname ? window.location.pathname.toLowerCase() : "/";
    var isHome =
      path === "/" ||
      path === "/home" ||
      path === "/home/" ||
      path.endsWith("/index.html") ||
      path.endsWith("/home.html");
    root = root || document.getElementById("ei-spa-root") || document.getElementById("main") || document.body;

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
