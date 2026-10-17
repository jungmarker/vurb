(function () {
  "use strict";
  var cfg = window.VURB_CONFIG || {};
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var money = function (n) {
    var s = Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2);
    return (cfg.currency || "$") + s;
  };
  var get = function (path) {
    return path.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, cfg);
  };

  // ---- Product name ----
  var DEFAULT_NAME = "Vurb.me";
  var name = cfg.name || DEFAULT_NAME;
  if (name !== DEFAULT_NAME) {
    $$("[data-name]").forEach(function (el) { el.textContent = name; });
    $$("[data-name-attr]").forEach(function (el) {
      var attr = el.getAttribute("data-name-attr");
      el.setAttribute(attr, el.getAttribute(attr).split(DEFAULT_NAME).join(name));
    });
    document.title = document.title.split(DEFAULT_NAME).join(name);
  }

  // ---- Prices & values from config ----
  var prices = cfg.prices || {};
  $$("[data-price]").forEach(function (el) {
    var v = prices[el.getAttribute("data-price")];
    if (typeof v === "number") el.textContent = money(v);
  });
  $$("[data-free-words]").forEach(function (el) {
    if (cfg.freeWordsPerWeek) el.textContent = cfg.freeWordsPerWeek.toLocaleString("en-US");
  });
  $$("[data-refund-days]").forEach(function (el) { if (cfg.refundDays) el.textContent = cfg.refundDays; });
  $$("[data-device-limit]").forEach(function (el) { if (cfg.proDeviceLimit) el.textContent = cfg.proDeviceLimit; });
  $$("[data-link]").forEach(function (el) {
    var v = get("links." + el.getAttribute("data-link"));
    if (v) el.href = v;
  });

  // ---- Theme toggle ----
  var root = document.documentElement;
  var toggle = $("#theme-toggle");
  function syncToggle() {
    var dark = root.getAttribute("data-theme") !== "light";
    toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }
  if (toggle) {
    syncToggle();
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncToggle();
    });
  }

  // ---- Toast ----
  var toast = $("#toast");
  var toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 3200);
  }

  // ---- Checkout buttons ("#" = coming soon) ----
  function applyCheckout(el) {
    var url = get("checkout." + el.getAttribute("data-checkout"));
    if (url && url !== "#") {
      el.href = url;
      el.removeAttribute("data-soon");
    } else {
      el.href = "#pricing";
      el.setAttribute("data-soon", "");
    }
  }
  $$("[data-checkout]").forEach(applyCheckout);
  $$("[data-checkout-link]").forEach(function (el) {
    var url = get("checkout." + el.getAttribute("data-checkout-link"));
    if (url && url !== "#") el.href = url;
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-soon]");
    if (!el) return;
    e.preventDefault();
    showToast("Coming soon: checkout isn't open yet. The Free plan is available now.");
  });

  // ---- Billing toggle (Pro + Growth) ----
  $$("[data-min-seats]").forEach(function (el) { if (cfg.growthMinSeats) el.textContent = cfg.growthMinSeats; });
  var pct = function (monthly, yearlyTotal) {
    return monthly && yearlyTotal ? Math.round((1 - yearlyTotal / (monthly * 12)) * 100) : 0;
  };
  var proSave = pct(prices.proMonthly, prices.proYearly);
  var growthSave = pct(prices.growthMonthly, prices.growthYearly * 12);
  var seats = cfg.growthMinSeats ? " · " + cfg.growthMinSeats + "-seat minimum" : "";
  var plan = function (attr, key) { return $("[data-plan-" + attr + '="' + key + '"]'); };

  function setBilling(period) {
    var yearly = period === "yearly";
    $$("[data-billing]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-billing") === period));
    });
    var proAmt = plan("amount", "pro"), proNote = plan("note", "pro"), proBtn = plan("checkout", "pro");
    if (proAmt && proNote && proBtn) {
      proAmt.textContent = money(yearly ? prices.proYearly / 12 : prices.proMonthly);
      proNote.textContent = yearly
        ? "Billed " + money(prices.proYearly) + " per year" + (proSave > 0 ? " · save " + proSave + "%" : "")
        : "Billed monthly";
      proBtn.setAttribute("data-checkout", yearly ? "proYearly" : "proMonthly");
      applyCheckout(proBtn);
    }
    var gAmt = plan("amount", "growth"), gNote = plan("note", "growth");
    if (gAmt && gNote) {
      gAmt.textContent = money(yearly ? prices.growthYearly : prices.growthMonthly);
      gNote.textContent = (yearly ? "Billed yearly" : "Billed monthly") + seats;
    }
  }
  $$("[data-billing]").forEach(function (b) {
    b.addEventListener("click", function () { setBilling(b.getAttribute("data-billing")); });
  });
  if ($("[data-billing]")) setBilling("yearly");
  var badge = $("[data-save-badge]");
  if (badge) {
    var best = Math.max(proSave, growthSave);
    if (best > 0) badge.textContent = "Save up to " + best + "%"; else badge.remove();
  }

  // ---- Downloads + OS detection ----
  var downloads = cfg.downloads || {};
  $$("[data-download]").forEach(function (el) {
    var url = downloads[el.getAttribute("data-download")];
    if (url) el.href = url;
  });
  function detectOS() {
    var p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "").toLowerCase();
    var ua = navigator.userAgent.toLowerCase();
    if (/android|iphone|ipad|ipod/.test(ua)) return null;
    if (p.indexOf("mac") > -1 || ua.indexOf("mac os") > -1) return "mac";
    if (p.indexOf("win") > -1 || ua.indexOf("windows") > -1) return "windows";
    if (p.indexOf("linux") > -1 || ua.indexOf("linux") > -1 || ua.indexOf("x11") > -1) return "linux";
    return null;
  }
  var labels = { mac: "macOS", windows: "Windows", linux: "Linux" };
  var os = detectOS();
  var hint = $("[data-os-hint]");
  if (os) {
    var btn = $('[data-os="' + os + '"]');
    if (btn) { btn.classList.remove("btn-ghost"); btn.classList.add("btn-primary"); }
    $$("[data-download-label]").forEach(function (el) { el.textContent = "Download for " + labels[os]; });
    if (downloads[os]) $$("[data-download-primary]").forEach(function (el) { el.href = downloads[os]; });
    if (hint) hint.textContent = "Looks like you're on " + labels[os] + ". Other platforms are listed too.";
  } else if (hint) {
    hint.textContent = name + " is a desktop app. Open this page on your Mac or PC to download.";
  }

  // ---- Scroll reveal ----
  var reveals = $$(".reveal");
  // Stagger siblings that reveal together (cards, steps, plans, stats).
  reveals.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains("reveal"); });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i, 6) * 80 + "ms");
  });
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // ---- Live demo: key down -> waveform pill -> text appears ----
  var demo = $(".demo");
  var demoText = $(".demo-text");
  if (demo && demoText && !reduceMotion) {
    var phrases = [
      "Running ten minutes late, save me a seat!",
      "¿Nos vemos a las ocho en el café?",
      "Ship it once the tests pass. Nice work, team.",
    ];
    var idx = 0, timer = null, running = false;
    var setState = function (s) { demo.setAttribute("data-state", s); };
    var later = function (fn, ms) { timer = setTimeout(fn, ms); };

    function typeOut(text) {
      demoText.textContent = "";
      text.split(" ").forEach(function (word, i) {
        var s = document.createElement("span");
        s.className = "w";
        s.style.animationDelay = i * 45 + "ms";
        s.textContent = (i ? " " : "") + word;
        demoText.appendChild(s);
      });
    }
    function cycle() {
      if (!running) return;
      setState("idle");
      demoText.textContent = "";
      later(function () {
        setState("rec");
        later(function () {
          setState("done");
          typeOut(phrases[idx]);
          idx = (idx + 1) % phrases.length;
          later(cycle, 3400);
        }, 2300);
      }, 1100);
    }
    function start() { if (!running) { running = true; cycle(); } }
    function stop() { running = false; clearTimeout(timer); }

    var inView = !("IntersectionObserver" in window);
    var sync = function () { inView && !document.hidden ? start() : stop(); };
    if (!inView) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { inView = en.isIntersecting; sync(); });
      }, { threshold: 0.3 }).observe(demo);
    }
    document.addEventListener("visibilitychange", sync);
    sync();
  }
})();
