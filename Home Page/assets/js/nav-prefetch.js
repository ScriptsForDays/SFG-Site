(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".site-nav-link[href]"));
  if (!links.length) return;

  var prefetched = Object.create(null);

  function isPrefetchable(href) {
    if (!href) return false;
    if (href.indexOf("#") === 0) return false;
    if (/^https?:\/\//i.test(href)) return false;
    if (/^mailto:|^tel:/i.test(href)) return false;
    return true;
  }

  function prefetch(href) {
    if (!isPrefetchable(href)) return;
    if (prefetched[href]) return;
    prefetched[href] = true;

    var link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = href;
    document.head.appendChild(link);
  }

  function prefetchFromEvent(event) {
    var anchor = event.currentTarget;
    if (!anchor) return;
    prefetch(anchor.getAttribute("href"));
  }

  for (var i = 0; i < links.length; i += 1) {
    var a = links[i];
    if (a.classList.contains("is-current")) continue;
    a.addEventListener("pointerenter", prefetchFromEvent, { once: true });
    a.addEventListener("focus", prefetchFromEvent, { once: true });
    a.addEventListener("touchstart", prefetchFromEvent, { once: true, passive: true });
  }

  function warmLikelyTargets() {
    for (var j = 0, warmed = 0; j < links.length && warmed < 2; j += 1) {
      var link = links[j];
      if (link.classList.contains("is-current")) continue;
      prefetch(link.getAttribute("href"));
      warmed += 1;
    }
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warmLikelyTargets, { timeout: 1200 });
  } else {
    window.setTimeout(warmLikelyTargets, 600);
  }
})();
