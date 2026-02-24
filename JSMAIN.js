/* =============================================================
  Esoteric Ink - Boot + Cascade controller (WordPress pages)
  -------------------------------------------------------------
  Your old SPA view-switch JS is removed because WordPress pages
  handle navigation now.

  What remains:
  - Full boot “power on” flicker on each page load
    (no pre-flash because HTML starts with .ei-booting-full)
  - After boot ends: a quick top-to-bottom cascade

  Priority:
  - Any element with data-ei-cascade-first (or inside one) will
    animate first in the cascade.
============================================================= */
	document.addEventListener("DOMContentLoaded", function () {
		startVersionLabelEnforcer("3.14");
		//const root = document.getElementById("ei-spa-root");
		const root = document.getElementById("main");
		if (!root) return;
	  	// Run the flicker boot (random stagger).
		// Not sure if actually needed. 
		runFullBoot(root)
		runCascadeIn(root);

	function runFullBoot(root) {
		console.debug("fullboot." + jQuery(root).attr('id'))
		// Clear any prior timers (in case the theme re-initializes scripts)
		window.clearTimeout(runFullBoot._t);

	  const targets = Array.from(root.querySelectorAll(".ei-boot-chunk"));
	  if (targets.length === 0) {
		root.classList.remove("ei-booting-full");
		return;
	  }

	  function rand(min, max) { return min + Math.random() * (max - min); }

	  // Reset per-element CSS vars
	  targets.forEach(function (el) {
		el.style.removeProperty("--ei-fd");
		el.style.removeProperty("--ei-fdur");
		el.style.removeProperty("--ei-fseed");
	  });

	  // Root is already .ei-booting-full in HTML to prevent flashing.
	  // Keep it for the duration of the boot.
	  root.classList.add("ei-booting-full");

	  const maxDelay = 720;
	  const lateChance = 0.22;

	  targets.forEach(function (el) {
		const early = Math.random() > lateChance;
		const delay = early ? rand(0, maxDelay) : rand(maxDelay * 0.55, maxDelay * 1.35);
		const dur = rand(1050, 1750);
		const seed = rand(0, 999);

		el.style.setProperty("--ei-fd", Math.floor(delay) + "ms");
		el.style.setProperty("--ei-fdur", Math.floor(dur) + "ms");
		el.style.setProperty("--ei-fseed", seed.toFixed(2));
	  });
		root.classList.remove("ei-booting-full");
	  runFullBoot._t = window.setTimeout(function () {
		
	  }, 2200);
	}

	function runCascadeIn(root) {
	  // Remove any prior cascade
	  const prev = root.querySelectorAll(".ei-cascade-in");
	  prev.forEach(function (el) {
		el.classList.remove("ei-cascade-in");
		el.style.removeProperty("--ei-cd");
	  });

	  // Only cascade real content chunks
	  const chunks = Array.from(root.querySelectorAll(".ei-boot-chunk"));

	  function priorityOf(el) {
		if (el.hasAttribute("data-ei-cascade-first")) return -100000;
		const p = el.closest("[data-ei-cascade-first]");
		return p ? -100000 : 0;
	  }

	  // Sort by priority, then by on-screen position (top-to-bottom)
	  chunks.sort(function (a, b) {
		const pa = priorityOf(a);
		const pb = priorityOf(b);
		if (pa !== pb) return pa - pb;

		const ra = a.getBoundingClientRect();
		const rb = b.getBoundingClientRect();
		return (ra.top - rb.top) || (ra.left - rb.left);
	  });

	  for (let i = 0; i < chunks.length; i++) {
		const el = chunks[i];
		el.style.setProperty("--ei-cd", (i * 38) + "ms");
		el.classList.add("ei-cascade-in");
	  }
	}

	function startVersionLabelEnforcer(version) {
	  applyVersionLabel(version);
	  window.setTimeout(function () { applyVersionLabel(version); }, 300);
	  window.setTimeout(function () { applyVersionLabel(version); }, 1200);
	  window.setTimeout(function () { applyVersionLabel(version); }, 2500);

	  if (!window.MutationObserver) return;
	  const observer = new MutationObserver(function () {
		applyVersionLabel(version);
	  });
	  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
	}

	function applyVersionLabel(version) {
	  const normalizedLabel = "Esoteric Inc Subsystems Version " + version;
	  const versionLabelPattern = /(Esoteric\s+In(?:k|c)\s+Subsystems(?:\s+Version)?\s*)(\d+(?:\.\d+)?)/i;

	  // Explicit top-bar targets first: some themes split text into nested spans.
	  const titleTargets = document.querySelectorAll(
		".ei-topnav-title, .ei-topnav-brand, .topnav-title, [class*='topnav'][class*='title'], .site-title, .navbar-brand, header [class*='title']"
	  );
	  titleTargets.forEach(function (el) {
		const text = (el.textContent || "").trim();
		if (!text) return;
		if (/Esoteric\s+In(?:k|c)\s+Subsystems/i.test(text)) {
		  el.textContent = normalizedLabel;
		}
	  });

	  // Generic fallback: replace anywhere this label appears.
	  const allNodes = document.querySelectorAll("body *");
	  allNodes.forEach(function (el) {
		if (!el || el.children.length > 0) return;
		const text = el.textContent;
		if (!text || !versionLabelPattern.test(text)) return;
		el.textContent = text.replace(versionLabelPattern, "$1" + version);
	  });

	}
});
