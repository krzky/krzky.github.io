/* ==========================================================================
   KAY — interactions
   Vanilla JS, no dependencies. Everything degrades gracefully without JS.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.getElementById("site-header");
  var themeToggle = document.getElementById("theme-toggle");
  var menu = document.getElementById("menu");
  var menuOpen = document.getElementById("menu-open");
  var menuClose = document.getElementById("menu-close");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme ---------- */
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "dark" ? "#141312" : "#f7f1e8");
    }
  }

  if (themeToggle) {
    applyTheme(root.dataset.theme === "dark" ? "dark" : "light");
    themeToggle.addEventListener("click", function () {
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
    });
  }

  /* ---------- Header elevation on scroll ---------- */
  var lastScrolled = null;
  function onScroll() {
    var scrolled = window.scrollY > 8;
    if (scrolled !== lastScrolled) {
      header.classList.toggle("is-scrolled", scrolled);
      lastScrolled = scrolled;
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    if (!menu || !menuOpen) return;
    menu.classList.toggle("is-open", open);
    menuOpen.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      // Wait for the panel to become visible before moving focus into it.
      requestAnimationFrame(function () {
        if (menuClose) menuClose.focus({ preventScroll: true });
      });
    } else {
      menuOpen.focus({ preventScroll: true });
    }
  }

  if (menuOpen) {
    menuOpen.addEventListener("click", function () {
      setMenu(true);
    });
  }
  if (menuClose) {
    menuClose.addEventListener("click", function () {
      setMenu(false);
    });
  }
  if (menu) {
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
  }
  document.addEventListener("keydown", function (event) {
    if (!menu || !menu.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      setMenu(false);
      return;
    }

    // Keep keyboard focus inside the open menu dialog.
    if (event.key === "Tab") {
      var focusables = menu.querySelectorAll('a[href], button:not([disabled])');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------- Scroll reveal ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  // Gentle stagger for elements that share a row.
  reveals.forEach(function (el) {
    var siblings = el.parentElement ? el.parentElement.children : [];
    var index = Array.prototype.indexOf.call(siblings, el);
    if (index > 0) {
      el.style.transitionDelay = Math.min(index, 3) * 70 + "ms";
    }
  });

  if ("IntersectionObserver" in window && !prefersReduced.matches) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  // Scroll-position spy: deterministic even when jumping between anchors.
  var navTicking = false;

  function updateActive() {
    var marker = window.scrollY + window.innerHeight * 0.4;
    var current = "";
    sections.forEach(function (section) {
      if (section.offsetTop <= marker) current = section.id;
    });
    setActive(current);
    navTicking = false;
  }

  function requestActiveUpdate() {
    if (navTicking) return;
    navTicking = true;
    window.requestAnimationFrame(updateActive);
  }

  if (sections.length) {
    updateActive();
    window.addEventListener("scroll", requestActiveUpdate, { passive: true });
    window.addEventListener("resize", requestActiveUpdate);
  }
})();
