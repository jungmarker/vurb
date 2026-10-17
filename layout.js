/*
 * Shared header and footer for every page.
 * Edit navigation, footer links or the logo here — nowhere else.
 * Load it as the first element inside <body>: <script src="layout.js"></script>
 * (pages in subfolders use ../layout.js; links are resolved from this file's location).
 */
(function () {
  "use strict";
  var script = document.currentScript;
  var base = script.src.replace(/layout\.js(?:[?#].*)?$/, "");
  var url = function (path) { return base + path; };

  // One-file logo swap: change these paths (or replace the files).
  var LOGO = "assets/mic.svg";

  var USE_CASES = [
    ["for/developers.html", "Developers"],
    ["for/writers.html", "Writers & creators"],
    ["for/sales.html", "Sales"],
    ["for/support.html", "Customer support"],
    ["for/students.html", "Students"],
    ["for/legal.html", "Lawyers"],
    ["for/accessibility.html", "Accessibility"],
    ["for/leaders.html", "Founders & managers"],
  ];
  var NAV = [
    ["features.html", "Features"],
    ["use-cases.html", "Use cases", USE_CASES],
    ["business.html", "Business"],
    ["pricing.html", "Pricing"],
    ["faq.html", "FAQ"],
  ];
  var FOOTER = [
    ["Product", [["features.html", "Features"], ["pricing.html", "Pricing"], ["download.html", "Download"], ["changelog.html", "What's new"], ["compare.html", "Compare"]]],
    ["Use cases", USE_CASES],
    ["Resources", [["faq.html", "FAQ"], ["support.html", "Support"], ["security.html", "Security"]]],
    ["Company", [["about.html", "About"], ["business.html", "Business"], ["mailto:sales@vurb.me", "Talk to sales"]]],
    ["Legal", [["terms.html", "Terms"], ["privacy.html", "Privacy"]]],
  ];

  // Which page are we on? ("" -> index.html)
  var here = location.href.split(/[?#]/)[0];
  var current = here.indexOf(base) === 0 ? here.slice(base.length) : "";
  if (current === "" || /\/$/.test(current)) current += "index.html";
  var isCurrent = function (path) { return path === current; };
  var inSection = function (item) {
    return isCurrent(item[0]) || (item[2] || []).some(function (c) { return isCurrent(c[0]); });
  };
  var esc = function (s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
  var href = function (p) { return /^(mailto:|https?:)/.test(p) ? p : url(p); };
  var link = function (item) {
    return '<a href="' + href(item[0]) + '"' + (isCurrent(item[0]) ? ' aria-current="page"' : "") + ">" + esc(item[1]) + "</a>";
  };

  var navItems = NAV.map(function (item) {
    var active = inSection(item) ? " is-active" : "";
    if (!item[2]) return '<li class="nav-item' + active + '">' + link(item) + "</li>";
    var sub = '<li><a href="' + url(item[0]) + '"' + (isCurrent(item[0]) ? ' aria-current="page"' : "") + ">All use cases</a></li>" +
      item[2].map(function (c) { return "<li>" + link(c) + "</li>"; }).join("");
    return '<li class="nav-item has-menu' + active + '">' +
      '<button type="button" class="nav-menu-btn" aria-expanded="false" aria-controls="menu-usecases">' + esc(item[1]) +
      ' <span aria-hidden="true" class="caret-down"></span></button>' +
      '<ul class="nav-menu" id="menu-usecases">' + sub + "</ul></li>";
  }).join("");

  var header =
    '<a class="skip-link" href="#main">Skip to content</a>' +
    '<header class="site-header"><div class="container header-inner">' +
      '<a class="brand" href="' + url("index.html") + '" aria-label="Vurb home">' +
        '<img src="' + url(LOGO) + '" alt="" width="15" height="20"><span data-name>Vurb</span></a>' +
      '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>' +
      '<nav class="site-nav" id="site-nav" aria-label="Main"><ul class="nav-list">' + navItems + "</ul>" +
        '<div class="header-actions">' +
          '<button class="text-btn" id="theme-toggle" type="button">Dark</button>' +
          '<a class="btn btn-small" href="' + url("download.html") + '"' + (isCurrent("download.html") ? ' aria-current="page"' : "") + ">Download</a>" +
        "</div></nav>" +
    "</div></header>";
  script.insertAdjacentHTML("beforebegin", header);

  var footer =
    '<footer class="site-footer"><div class="container">' +
      '<div class="footer-cols">' +
        '<div class="footer-brand"><a class="brand" href="' + url("index.html") + '"><img src="' + url(LOGO) + '" alt="" width="15" height="20"><span data-name>Vurb</span></a>' +
        '<p class="muted small">Dictation that runs on your computer.</p></div>' +
        FOOTER.map(function (col) {
          return '<div><h2 class="footer-h">' + esc(col[0]) + "</h2><ul>" +
            col[1].map(function (i) { return "<li>" + link(i) + "</li>"; }).join("") + "</ul></div>";
        }).join("") +
      "</div>" +
      '<p class="footer-legal">© 2026 <span data-name>Vurb</span></p>' +
    "</div></footer>" +
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>';

  function onReady() {
    var main = document.getElementById("main");
    (main || script).insertAdjacentHTML("afterend", footer);

    // Theme toggle
    var root = document.documentElement;
    var toggle = document.getElementById("theme-toggle");
    var sync = function () {
      var dark = root.getAttribute("data-theme") === "dark";
      toggle.textContent = dark ? "Light" : "Dark";
      toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    };
    sync();
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      sync();
    });

    // Mobile menu
    var navToggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") !== "true";
      navToggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("open", open);
      navToggle.textContent = open ? "Close" : "Menu";
    });

    // Use cases dropdown
    var menuBtn = document.querySelector(".nav-menu-btn");
    var item = menuBtn && menuBtn.parentNode;
    var setMenu = function (open) {
      menuBtn.setAttribute("aria-expanded", String(open));
      item.classList.toggle("menu-open", open);
    };
    if (menuBtn) {
      menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
      });
      document.addEventListener("click", function (e) { if (!item.contains(e.target)) setMenu(false); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") { setMenu(false); menuBtn.focus(); }
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady);
  else onReady();
})();
