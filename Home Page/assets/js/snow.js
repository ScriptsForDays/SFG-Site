(function () {
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createDrop(w, h) {
    return {
      x: random(0, w),
      y: random(-h, h),
      len: random(12, 34),
      width: random(0.8, 1.6),
      speed: random(520, 1140),
      alpha: random(0.18, 0.68)
    };
  }

  function createRainEngine(overlay) {
    var canvas = document.createElement("canvas");
    canvas.className = "rain-canvas";
    overlay.innerHTML = "";
    overlay.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    if (!ctx) return null;

    var w = 0;
    var h = 0;
    var dpr = 1;
    var drops = [];
    var raf = 0;
    var last = 0;
    var hidden = document.hidden;

    function setSize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(window.innerWidth, 1);
      h = Math.max(window.innerHeight, 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var isSmallScreen = window.matchMedia("(max-width: 700px)").matches;
      var densityBase = isSmallScreen ? 0.095 : 0.115;
      var targetCount = Math.round((w * h) / 10000 * densityBase * 10);
      var count = Math.max(isSmallScreen ? 90 : 145, Math.min(targetCount, isSmallScreen ? 145 : 220));
      drops = [];
      for (var i = 0; i < count; i += 1) {
        drops.push(createDrop(w, h));
      }
    }

    function drawDrop(drop) {
      var topY = drop.y - drop.len;
      var grad = ctx.createLinearGradient(drop.x, topY, drop.x, drop.y);
      grad.addColorStop(0, "rgba(190, 220, 255, 0)");
      grad.addColorStop(0.3, "rgba(205, 228, 255, " + (drop.alpha * 0.45).toFixed(3) + ")");
      grad.addColorStop(1, "rgba(235, 246, 255, " + drop.alpha.toFixed(3) + ")");
      ctx.strokeStyle = grad;
      ctx.lineWidth = drop.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(drop.x, topY);
      ctx.lineTo(drop.x, drop.y);
      ctx.stroke();
    }

    function tick(now) {
      if (hidden) return;
      if (!last) last = now;
      var dt = Math.min((now - last) / 1000, 0.04);
      last = now;

      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < drops.length; i += 1) {
        var drop = drops[i];
        drop.y += drop.speed * dt;
        if (drop.y - drop.len > h) {
          drop.x = random(0, w);
          drop.y = random(-h * 0.25, -8);
          drop.len = random(12, 34);
          drop.width = random(0.8, 1.6);
          drop.speed = random(520, 1140);
          drop.alpha = random(0.18, 0.68);
        }
        drawDrop(drop);
      }
      raf = window.requestAnimationFrame(tick);
    }

    function start() {
      if (raf || hidden) return;
      last = 0;
      raf = window.requestAnimationFrame(tick);
    }

    function stop() {
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
    }

    function onVisibility() {
      hidden = document.hidden;
      if (hidden) {
        stop();
      } else {
        start();
      }
    }

    setSize();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);

    return {
      resize: setSize,
      destroy: function () {
        stop();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", stop);
      }
    };
  }

  function initRain() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var overlay = document.querySelector(".snow-overlay");
    if (!overlay) return;
    var engine = createRainEngine(overlay);
    if (!engine) return;

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        engine.resize();
      }, 160);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRain, { once: true });
  } else {
    initRain();
  }
})();
