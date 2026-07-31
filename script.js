/* ==========================================================================
   Justin Breshears — portfolio
   No dependencies. Every block below is an ENHANCEMENT: the page renders
   correctly, and is fully usable, if this file never loads or throws.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var motionOK = !window.matchMedia ||
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverOK = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  /* ── Year ─────────────────────────────────────────────────────────────── */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ── Nav scroll state ─────────────────────────────────────────────────── */
  var nav = $(".nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── Split headline ───────────────────────────────────────────────────────
     Walks TEXT NODES only, so inline markup inside the heading (the accented
     <span class="hl">) survives the split intact. Ships two copies per the
     library's rule: one intact and visually hidden for assistive tech, copy
     and paste and find-in-page; one split and aria-hidden for the eye.
     On any failure the original markup is put back verbatim.               */
  (function () {
    var h1 = $("[data-split]");
    if (!h1) return;
    var original = h1.innerHTML;

    try {
      var text = h1.textContent.replace(/\s+/g, " ").trim();

      var intact = document.createElement("span");
      intact.className = "sr-only";
      intact.textContent = text;

      var visible = document.createElement("span");
      visible.setAttribute("aria-hidden", "true");
      visible.innerHTML = original;

      var units = [];
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var parts = child.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
              var u = document.createElement("span");
              u.className = "u";
              u.textContent = part;
              u.style.setProperty("--i", String(units.length));
              units.push(u);
              frag.appendChild(u);
            });
            child.parentNode.replaceChild(frag, child);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      })(visible);

      if (!units.length) throw new Error("no units");
      /* n is floored at 2 so the CSS `--i / (--n - 1)` can never divide by 0 */
      visible.style.setProperty("--n", String(Math.max(2, units.length)));

      h1.innerHTML = "";
      h1.appendChild(intact);
      h1.appendChild(visible);

      if (motionOK) h1.setAttribute("data-armed", "");
      h1.setAttribute("data-split-done", "");

      if (motionOK) {
        void h1.offsetWidth; /* commit the offset state before releasing it */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { h1.removeAttribute("data-armed"); });
        });
      }
    } catch (err) {
      h1.innerHTML = original;
      h1.removeAttribute("data-armed");
      h1.setAttribute("data-split-done", "");
    }
  })();

  /* ── Plan drawing: dash lengths + pointer response ────────────────────── */
  (function () {
    var plan = $(".hero__plan");
    if (!plan || !motionOK) return;

    each($$(".plan__draw .pl, .plan__draw .tr", plan), function (el) {
      if (typeof el.getTotalLength !== "function") return;
      try {
        var len = Math.ceil(el.getTotalLength());
        el.style.setProperty("--len", String(len));
        /* The tracer is a single short dash with a gap covering the rest of
           the outline, so exactly one dot travels the path at a time. */
        if (el.classList.contains("tr")) {
          el.style.strokeDasharray = 42 + " " + Math.max(1, len - 42);
        }
      } catch (e) {}
    });

    /* Park the looping animations while the hero is off screen. */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { plan.classList.toggle("is-idle", !e.isIntersecting); });
      }, { rootMargin: "120px" }).observe(plan);
    }

    if (!hoverOK) return;
    var draw = $(".plan__draw", plan);
    var hero = $(".hero");
    if (!draw || !hero) return;
    var queued = false, px = 0, py = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        draw.style.setProperty("--px", px.toFixed(3));
        draw.style.setProperty("--py", py.toFixed(3));
      });
    }, { passive: true });
  })();

  /* ── Scroll-triggered reveal ──────────────────────────────────────────────
     JS opts elements in, so a no-JS page has nothing hidden. Nothing that is
     an ancestor of the sticky media column is ever given a transform.       */
  (function () {
    if (!motionOK || !("IntersectionObserver" in window)) return;
    var targets = $$(
      ".section__head, .row, .gauges, .cardx, .proofplate, .steps li, " +
      ".about__grid > div, .facts, .contact__inner > *"
    );
    if (!targets.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

    each(targets, function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i % 6, 5) * 55 + "ms";
      io.observe(el);
    });
  })();

  /* ── Indexed media companion ──────────────────────────────────────────────
     One active index, three drivers into the same setActive():
       pointer  (fine pointers only)
       focusin  (keyboard reaches the same index — the guard people skip)
       scroll   (nearest row to a reference band; the touch path)
     The list is a real list of real links and the default preview is authored
     into the markup, so removing all of this leaves a working section.      */
  (function () {
    var list = $(".index__list");
    var slot = $(".index__media .slot");
    if (!list || !slot) return;

    var rows = $$(".row", list);
    var shots = $$(".shot", slot);
    var caption = $("[data-slot-caption]");
    if (!rows.length || !shots.length) return;

    var DEFAULT_K = 0;
    var BAND = 0.42;
    var current = DEFAULT_K;

    function setActive(k) {
      k = Math.max(0, Math.min(Math.min(rows.length, shots.length) - 1, k | 0));
      if (k === current) return;
      current = k;
      each(rows, function (r, i) { r.classList.toggle("is-active", i === k); });
      each(shots, function (s, i) { s.classList.toggle("is-active", i === k); });
      if (caption && rows[k].dataset.site) caption.textContent = rows[k].dataset.site;
    }

    function indexOfRow(node) {
      var row = node && node.closest ? node.closest(".row") : null;
      return row ? Array.prototype.indexOf.call(rows, row) : -1;
    }

    /* Decode every preview up front. Without this the first hover shows an
       empty slot for however long the fetch takes. */
    each(slot.querySelectorAll("img"), function (img) {
      if (img.decode) img.decode().catch(function () {});
    });

    if (hoverOK) {
      list.addEventListener("pointerover", function (e) {
        var k = indexOfRow(e.target);
        if (k > -1) setActive(k);
      });
      list.addEventListener("pointerleave", function () { setActive(DEFAULT_K); });
    }

    list.addEventListener("focusin", function (e) {
      var k = indexOfRow(e.target);
      if (k > -1) setActive(k);
    });

    /* Scroll proximity — measured against each row's TOP edge, not its centre,
       so rows of unequal height don't make the tall ones sticky. */
    if (!hoverOK) {
      var ticking = false;
      var nearest = function () {
        var band = window.innerHeight * BAND;
        var best = 0, bestD = Infinity;
        each(rows, function (r, i) {
          var d = Math.abs(r.getBoundingClientRect().top - band);
          if (d < bestD) { bestD = d; best = i; }
        });
        setActive(best);
      };
      window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; nearest(); });
      }, { passive: true });
      nearest();
    }
  })();

  /* ── Live measurements ────────────────────────────────────────────────────
     Read out of this browser's own Performance API. Nothing is hard-coded and
     nothing is rounded in our favour; if a number is bad it prints bad.     */
  (function () {
    var panel = $("[data-gauges]");
    if (!panel || !("performance" in window)) return;

    var out = {};
    each($$("[data-metric]", panel), function (el) { out[el.getAttribute("data-metric")] = el; });

    /* The observers live in the head script so they cannot miss an entry.
       This block only renders what they collected. */
    var perf = window.__perf || { lcp: 0, cls: 0, lcpSeen: false };

    function write(key, text, good) {
      var el = out[key];
      if (!el) return;
      el.textContent = text;
      if (typeof good === "boolean") el.setAttribute("data-state", good ? "good" : "over");
    }

    function resources() {
      var entries = [];
      try { entries = performance.getEntriesByType("resource") || []; } catch (e) { return; }

      var jsBytes = 0, third = 0, origin = location.origin;
      entries.forEach(function (e) {
        var isThird = true;
        try { isThird = new URL(e.name, location.href).origin !== origin; } catch (err) {}
        if (isThird) third++;
        if (e.initiatorType === "script") {
          jsBytes += e.encodedBodySize || e.decodedBodySize || 0;
        }
      });

      /* Count the bytes of this file even when it is served from cache, so a
         repeat visit doesn't flatter the number to zero. */
      if (!jsBytes) {
        var self = entries.filter(function (e) { return /script\.js/.test(e.name); })[0];
        if (self) jsBytes = self.decodedBodySize || 0;
      }

      write("js", jsBytes ? (jsBytes / 1024).toFixed(1) + " KB" : "< 1 KB", jsBytes < 50 * 1024);
      write("third", String(third), third === 0);
    }

    var done = false;

    function render(final) {
      if (perf.lcpSeen) {
        write("lcp", (perf.lcp / 1000).toFixed(2) + " s", perf.lcp < 2500);
      } else if (final) {
        /* Say so rather than printing a number this browser never gave us. */
        write("lcp", "not reported");
      }
      write("cls", perf.cls.toFixed(3), perf.cls < 0.1);
      resources();
    }

    function finalise() {
      if (done) return;
      done = true;
      render(true);
    }

    /* LCP keeps updating until the first real interaction. Paint whatever has
       arrived, every 250ms, and only lock the panel on a genuine interaction
       or at the 8s mark — locking earlier would throw away a slow-but-real
       LCP and print "not reported" over a number that was on its way. */
    var poll = setInterval(function () { if (!done) render(false); }, 250);
    setTimeout(function () { clearInterval(poll); finalise(); }, 8000);

    ["keydown", "pointerdown"].forEach(function (t) {
      addEventListener(t, function () { clearInterval(poll); finalise(); },
        { once: true, passive: true });
    });
    render(false);
  })();
})();
