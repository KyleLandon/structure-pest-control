(function () {
  "use strict";

  var mapEl = document.getElementById("serviceMap");
  var drawMap = function () {
    if (!mapEl || !window.L || mapEl.dataset.mapReady) return;
    mapEl.dataset.mapReady = "1";
    var poth = [29.0694, -98.0797];
    var towns = [
      { name: "Poth", ll: poth, home: true },
      { name: "Floresville", ll: [29.1336, -98.1561] },
      { name: "La Vernia", ll: [29.3563, -98.1178] },
      { name: "Stockdale", ll: [29.2336, -97.9614] },
      { name: "Sutherland Springs", ll: [29.273, -98.0564] },
      { name: "Falls City", ll: [28.9791, -98.0189] },
      { name: "Karnes City", ll: [28.885, -97.9008] },
      { name: "Pleasanton", ll: [28.9672, -98.4786] },
      { name: "Seguin", ll: [29.5688, -97.9647] },
      { name: "San Antonio", ll: [29.4241, -98.4936] }
    ];

    var map = L.map(mapEl, {
      scrollWheelZoom: false,
      zoomControl: true
    });
    map.setView(poth, 9);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    var radius = L.circle(poth, {
      radius: 64374, // 40 miles
      color: "#168a46",
      weight: 2,
      fillColor: "#22c55e",
      fillOpacity: 0.14
    }).addTo(map);

    towns.forEach(function (town) {
      var marker = L.circleMarker(town.ll, {
        radius: town.home ? 8 : 5.5,
        color: town.home ? "#06192e" : "#0b5fa5",
        weight: 2,
        fillColor: town.home ? "#22c55e" : "#ffffff",
        fillOpacity: 1
      }).addTo(map);
      marker.bindTooltip(town.home ? "Poth · home base" : town.name, {
        permanent: !!town.home,
        direction: "top",
        offset: [0, -6],
        className: "map-tip"
      });
    });

    var frameArea = function () {
      map.invalidateSize();
      map.fitBounds(radius.getBounds(), { padding: [18, 18] });
    };
    frameArea();

    var resizeMap = function () { frameArea(); };
    var wrap = mapEl.closest(".reveal");
    if (wrap && "MutationObserver" in window) {
      var watcher = new MutationObserver(function () {
        if (wrap.classList.contains("is-visible")) {
          resizeMap();
          watcher.disconnect();
        }
      });
      watcher.observe(wrap, { attributes: true, attributeFilter: ["class"] });
    }
    window.addEventListener("load", resizeMap);
    setTimeout(resizeMap, 400);
  };
  if (mapEl) {
    var loadMap = function () {
      if (mapEl.dataset.mapLoading) return;
      mapEl.dataset.mapLoading = "1";
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/vendor/leaflet/leaflet.min.css";
      document.head.appendChild(css);
      var script = document.createElement("script");
      script.src = "/vendor/leaflet/leaflet.min.js";
      script.onload = drawMap;
      document.body.appendChild(script);
    };
    if ("IntersectionObserver" in window) {
      var mapWatch = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          mapWatch.disconnect();
          loadMap();
        }
      }, { rootMargin: "400px" });
      mapWatch.observe(mapEl);
    } else {
      loadMap();
    }
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var header = document.querySelector(".header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  var track = document.getElementById("marqueeTrack");
  if (track) track.innerHTML += track.innerHTML;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var reveals = document.querySelectorAll(".reveal, .steps");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    reveals.forEach(function (el, i) {
      if (el.classList.contains("reveal")) el.style.transitionDelay = Math.min((i % 4) * 60, 180) + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  var hero = document.querySelector(".hero");
  if (hero && finePointer && !reduceMotion) {
    var glowRaf = null;
    hero.addEventListener("mousemove", function (e) {
      if (glowRaf) return;
      glowRaf = requestAnimationFrame(function () {
        var r = hero.getBoundingClientRect();
        var mx = (e.clientX - r.left) / r.width - 0.5;
        var my = (e.clientY - r.top) / r.height - 0.5;
        hero.style.setProperty("--mx", mx.toFixed(3));
        hero.style.setProperty("--my", my.toFixed(3));
        glowRaf = null;
      });
    });
    hero.addEventListener("mouseleave", function () {
      hero.style.setProperty("--mx", 0);
      hero.style.setProperty("--my", 0);
    });
  }

  var eta = document.getElementById("storyEta");
  var report = document.getElementById("storyReport");
  if (eta && report) {
    var etaTitle = document.getElementById("storyEtaTitle");
    var etaText = document.getElementById("storyEtaText");
    var etaBar = document.getElementById("storyEtaBar");

    var setEta = function (title, html, pct, arrived) {
      etaTitle.textContent = title;
      etaText.innerHTML = html;
      etaBar.style.transform = "scaleX(" + (pct / 100) + ")";
      eta.classList.toggle("is-arrived", !!arrived);
    };

    if (reduceMotion) {
      setEta("On the way", "Your tech arrives in <b>20 min</b>", 68, false);
      report.classList.add("is-on");
    } else {
      var steps = [
        [0,     function () { setEta("Appointment booked", "Thursday, 9:00 AM &middot; <b>Confirmed</b>", 15, false); report.classList.remove("is-on"); }],
        [2600,  function () { setEta("On the way", "Your tech arrives in <b>20 min</b>", 40, false); }],
        [4600,  function () { setEta("On the way", "Your tech arrives in <b>8 min</b>", 75, false); }],
        [6600,  function () { setEta("Arrived", "Starting your inspection now", 100, true); }],
        [8400,  function () { report.classList.add("is-on"); }],
        [13500, null]
      ];
      var runStory = function () {
        steps.forEach(function (s) {
          if (s[1]) setTimeout(s[1], s[0]);
        });
        setTimeout(runStory, steps[steps.length - 1][0]);
      };
      setTimeout(runStory, 900);
    }
  }

  if (finePointer) {
    var spots = document.querySelectorAll(".bento__card:not(.bento__card--cta), .feature, .step, .plan, .review");
    spots.forEach(function (card) {
      card.classList.add("spot");
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--sx", (e.clientX - r.left) + "px");
        card.style.setProperty("--sy", (e.clientY - r.top) + "px");
      });
    });
  }

  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.classList.add("is-magnet");
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.setProperty("--tx", (dx * 10).toFixed(1) + "px");
        btn.style.setProperty("--ty", (dy * 8).toFixed(1) + "px");
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.setProperty("--tx", "0px");
        btn.style.setProperty("--ty", "0px");
      });
    });
  }

  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");

  if (form) {
    var setStatus = function (msg, type) {
      status.textContent = msg;
      status.className = "form__status" + (type ? " is-" + type : "");
    };

    var validate = function () {
      var ok = true;
      var required = form.querySelectorAll("[required]");
      required.forEach(function (el) {
        var valid = el.checkValidity() && el.value.trim() !== "";
        el.classList.toggle("is-invalid", !valid);
        if (!valid) ok = false;
      });
      return ok;
    };

    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("is-invalid") && e.target.checkValidity()) {
        e.target.classList.remove("is-invalid");
      }
    });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      setStatus("", "");

      if (!validate()) {
        setStatus("Please fill in the highlighted fields.", "error");
        var first = form.querySelector(".is-invalid");
        if (first) first.focus();
        return;
      }

      var data = Object.fromEntries(new FormData(form).entries());
      data.source = "structurepesttx.com";
      data.page = window.location.href;

      submitBtn.disabled = true;
      var original = submitBtn.textContent;
      submitBtn.textContent = "Sending…";

      try {
        var res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data)
        });
        var body = {};
        try { body = await res.json(); } catch (_) {}

        if (!res.ok || body.ok === false) {
          throw new Error(body.error || "Request failed");
        }

        form.reset();
        setStatus("Thanks! We received your request and will be in touch shortly.", "success");
      } catch (err) {
        setStatus(
          "Something went wrong sending your request. Please call us at (830) 555-0123.",
          "error"
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    });
  }
})();
