(function () {
  "use strict";
  var cfg = window.VURB_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var get = function (path) {
    return path.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, cfg);
  };
  var money = function (n) {
    var s = Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2);
    return (cfg.currency || "$") + s;
  };
  var prices = cfg.prices || {};

  // Product name
  var DEFAULT_NAME = "Vurb";
  var name = cfg.name || DEFAULT_NAME;
  if (name !== DEFAULT_NAME) {
    $$("[data-name]").forEach(function (el) { el.textContent = name; });
    $$("[data-name-attr]").forEach(function (el) {
      var a = el.getAttribute("data-name-attr");
      el.setAttribute(a, el.getAttribute(a).split(DEFAULT_NAME).join(name));
    });
    document.title = document.title.split(DEFAULT_NAME).join(name);
  }

  // Values from config
  $$("[data-price]").forEach(function (el) {
    var v = prices[el.getAttribute("data-price")];
    if (typeof v === "number") el.textContent = money(v);
  });
  var fill = function (sel, value) { if (value) $$(sel).forEach(function (el) { el.textContent = value; }); };
  fill("[data-free-words]", cfg.freeWordsPerWeek && cfg.freeWordsPerWeek.toLocaleString("en-US"));
  fill("[data-refund-days]", cfg.refundDays);
  fill("[data-device-limit]", cfg.proDeviceLimit);
  fill("[data-min-seats]", cfg.growthMinSeats);
  $$("[data-link]").forEach(function (el) {
    var v = get("links." + el.getAttribute("data-link"));
    if (v) el.href = v;
  });

  // Toast
  var toastTimer;
  function showToast(msg) {
    var toast = $("#toast"); // injected by layout.js
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 3200);
  }

  // Checkout links. "#" in config means not open yet.
  function applyCheckout(el) {
    var url = get("checkout." + el.getAttribute("data-checkout"));
    if (url && url !== "#") { el.href = url; el.removeAttribute("data-soon"); }
    else { el.href = "#pricing"; el.setAttribute("data-soon", ""); }
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
    showToast("Checkout isn't open yet. The free plan works today.");
  });

  // Monthly / yearly
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
    var pa = plan("amount", "pro"), pn = plan("note", "pro"), pb = plan("checkout", "pro");
    if (pa && pn && pb) {
      pa.textContent = money(yearly ? prices.proYearly / 12 : prices.proMonthly);
      pn.textContent = yearly
        ? "Billed " + money(prices.proYearly) + " per year" + (proSave > 0 ? " (" + proSave + "% less)" : "")
        : "Billed monthly";
      pb.setAttribute("data-checkout", yearly ? "proYearly" : "proMonthly");
      applyCheckout(pb);
    }
    var ga = plan("amount", "growth"), gn = plan("note", "growth");
    if (ga && gn) {
      ga.textContent = money(yearly ? prices.growthYearly : prices.growthMonthly);
      gn.textContent = (yearly ? "Billed yearly" : "Billed monthly") + seats;
    }
  }
  $$("[data-billing]").forEach(function (b) {
    b.addEventListener("click", function () { setBilling(b.getAttribute("data-billing")); });
  });
  if ($("[data-billing]")) setBilling("yearly");
  var badge = $("[data-save-badge]");
  if (badge) {
    var best = Math.max(proSave, growthSave);
    if (best > 0) badge.textContent = "(save up to " + best + "%)"; else badge.remove();
  }

  // Downloads and OS detection
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
  var labels = { mac: "Mac", windows: "Windows", linux: "Linux" };
  var os = detectOS();
  var hint = $("[data-os-hint]");
  if (os) {
    var btn = $('[data-os="' + os + '"]');
    if (btn) btn.classList.remove("btn-outline");
    $$("[data-download-label]").forEach(function (el) { el.textContent = "Download for " + labels[os]; });
    if (downloads[os]) $$("[data-download-primary]").forEach(function (el) { el.href = downloads[os]; });
    if (hint) hint.textContent = "Free to start. You're on " + labels[os] + ", so that one's highlighted.";
  } else if (hint) {
    hint.textContent = "It's a desktop app. Open this page on your computer to download.";
  }

  // Hero demo: pill listens, then the sentence is typed. One quiet loop.
  var text = $(".demo-text");
  var pill = $("[data-demo-pill]");
  var shot = $(".shot");
  if (text && pill && shot && !reduceMotion) {
    var sentence = text.textContent;
    var timer = null, running = false;
    var later = function (fn, ms) { timer = setTimeout(fn, ms); };

    function typeFrom(i) {
      if (!running) return;
      text.textContent = sentence.slice(0, i);
      if (i < sentence.length) later(function () { typeFrom(i + 1); }, 22);
      else later(cycle, 4500);
    }
    function cycle() {
      if (!running) return;
      text.textContent = "";
      pill.classList.add("off");
      later(function () {
        pill.classList.remove("off");
        later(function () {
          pill.classList.add("off");
          typeFrom(1);
        }, 2600);
      }, 900);
    }
    function start() { if (!running) { running = true; cycle(); } }
    function stop() {
      running = false;
      clearTimeout(timer);
      text.textContent = sentence;
      pill.classList.remove("off");
    }
    var inView = !("IntersectionObserver" in window);
    var sync = function () { inView && !document.hidden ? start() : stop(); };
    if (!inView) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { inView = en.isIntersecting; sync(); });
      }, { threshold: 0.4 }).observe(shot);
    }
    document.addEventListener("visibilitychange", sync);
    sync();
  }
})();
