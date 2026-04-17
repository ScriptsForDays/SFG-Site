(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll(".js-executor-card"));
  var liveVersions = Array.prototype.slice.call(document.querySelectorAll(".js-live-version"));
  if (!cards.length && !liveVersions.length) return;

  var URL_EXPLOITS = "https://weao.xyz/api/status/exploits";
  var URL_VERSIONS_CURRENT = "https://weao.xyz/api/versions/current";

  async function fetchJson(url) {
    var response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }

  function normalizeHash(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function setLiveVersionText(target, value) {
    for (var i = 0; i < liveVersions.length; i += 1) {
      var el = liveVersions[i];
      if (normalizeHash(el.getAttribute("data-live-target")).toLowerCase() !== target) continue;
      el.textContent = value || "Unavailable";
    }
  }

  function normalizePlatformName(value) {
    var v = normalizeHash(value).toLowerCase();
    if (v === "ios" || v === "i os") return "ios";
    if (v === "android") return "android";
    if (v === "windows") return "windows";
    if (v === "mobile") return "mobile";
    return v;
  }

  function getByClass(root, className) {
    return root.querySelector("." + className);
  }

  function setStatusTag(tag, isUpdated) {
    if (!tag) return;
    tag.classList.remove("executor-tag--updated", "executor-tag--outdated");
    if (isUpdated) {
      tag.classList.add("executor-tag--updated");
      tag.textContent = "Updated";
    } else {
      tag.classList.add("executor-tag--outdated");
      tag.textContent = "Outdated";
    }
  }

  function chooseDownloadUrl(card, exploit) {
    var override = normalizeHash(card && card.getAttribute("data-download-url"));
    if (override) return override;
    return (
      normalizeHash(exploit && exploit.purchaselink) ||
      normalizeHash(exploit && exploit.websitelink) ||
      normalizeHash(exploit && exploit.discordlink) ||
      "https://whatexpsare.online/"
    );
  }

  function applyExploitData(card, exploit) {
    var versionEl = getByClass(card, "js-roblox-version");
    var statusEl = getByClass(card, "js-executor-status");
    var downloadEl = getByClass(card, "js-executor-download");
    if (downloadEl) {
      downloadEl.href = chooseDownloadUrl(card, exploit);
    }

    if (!exploit) {
      if (versionEl) versionEl.textContent = "Unavailable";
      setStatusTag(statusEl, false);
      return;
    }

    if (versionEl) {
      versionEl.textContent = normalizeHash(exploit.rbxversion) || "Unavailable";
    }
    setStatusTag(statusEl, Boolean(exploit.updateStatus));

  }

  function findExploit(exploits, name, platform) {
    var targetName = normalizeHash(name).toLowerCase();
    var targetPlatform = normalizePlatformName(platform);
    for (var i = 0; i < exploits.length; i += 1) {
      var item = exploits[i];
      if (normalizeHash(item && item.title).toLowerCase() !== targetName) continue;
      if (!targetPlatform) return item;
      var actualPlatform = normalizePlatformName(item && item.platform);
      if (actualPlatform === targetPlatform) return item;
    }
    return null;
  }

  function findAllByName(exploits, name) {
    var targetName = normalizeHash(name).toLowerCase();
    var out = [];
    for (var i = 0; i < exploits.length; i += 1) {
      var item = exploits[i];
      if (normalizeHash(item && item.title).toLowerCase() === targetName) {
        out.push(item);
      }
    }
    return out;
  }

  function applyFallbackToAll() {
    for (var i = 0; i < cards.length; i += 1) {
      applyExploitData(cards[i], null);
    }
  }

  async function refreshExecutorData() {
    try {
      var responses = await Promise.allSettled([fetchJson(URL_EXPLOITS), fetchJson(URL_VERSIONS_CURRENT)]);
      var exploitPayload = responses[0].status === "fulfilled" ? responses[0].value : [];
      var versionsPayload = responses[1].status === "fulfilled" ? responses[1].value : null;
      var exploits = Array.isArray(exploitPayload) ? exploitPayload : [];

      if (versionsPayload) {
        setLiveVersionText("windows", normalizeHash(versionsPayload.Windows));
        setLiveVersionText("android", "2.714");
        setLiveVersionText("ios", "2.714");
      } else {
        setLiveVersionText("windows", "Unavailable");
        setLiveVersionText("android", "2.714");
        setLiveVersionText("ios", "2.714");
      }

      for (var i = 0; i < cards.length; i += 1) {
        var card = cards[i];
        var name = normalizeHash(card.getAttribute("data-executor-name")).toLowerCase();
        var platform = normalizeHash(card.getAttribute("data-executor-platform"));

        if (name === "delta" && platform.toLowerCase() === "mobile") {
          var deltaEntries = findAllByName(exploits, "Delta");
          if (!deltaEntries.length) {
            applyExploitData(card, null);
            continue;
          }
          var labels = [];
          var hasAndroid = findExploit(deltaEntries, "Delta", "Android");
          var hasIos = findExploit(deltaEntries, "Delta", "iOS");
          if (hasAndroid && normalizeHash(hasAndroid.rbxversion)) labels.push("Android " + normalizeHash(hasAndroid.rbxversion));
          if (hasIos && normalizeHash(hasIos.rbxversion)) labels.push("iOS " + normalizeHash(hasIos.rbxversion));
          applyExploitData(card, {
            rbxversion: labels.join(" | ") || "Unavailable",
            updateStatus: Boolean(hasAndroid && hasAndroid.updateStatus) && Boolean(hasIos && hasIos.updateStatus),
            purchaselink: hasAndroid && hasAndroid.purchaselink,
            websitelink: (hasAndroid && hasAndroid.websitelink) || (hasIos && hasIos.websitelink),
            discordlink: (hasAndroid && hasAndroid.discordlink) || (hasIos && hasIos.discordlink)
          });
          continue;
        }

        if (name === "codex" && platform.toLowerCase() === "android") {
          var codexEntries = findAllByName(exploits, "Codex");
          if (!codexEntries.length) {
            applyExploitData(card, null);
            continue;
          }
          var codexAndroid = findExploit(codexEntries, "Codex", "Android");
          var codexIos = findExploit(codexEntries, "Codex", "iOS");
          var codexIosVersion = codexIos && normalizeHash(codexIos.rbxversion);
          var codexAndroidVersion = codexAndroid && normalizeHash(codexAndroid.rbxversion);
          applyExploitData(card, {
            rbxversion: "Android " + (codexAndroidVersion || "Unavailable") + " | iOS " + (codexIosVersion || "Not listed"),
            updateStatus: Boolean(codexAndroid && codexAndroid.updateStatus) && Boolean(codexIos ? codexIos.updateStatus : false),
            purchaselink: codexAndroid && codexAndroid.purchaselink,
            websitelink: (codexAndroid && codexAndroid.websitelink) || (codexIos && codexIos.websitelink),
            discordlink: (codexAndroid && codexAndroid.discordlink) || (codexIos && codexIos.discordlink)
          });
          continue;
        }

        var exploit = findExploit(exploits, name, platform);
        if (exploit) {
          applyExploitData(card, exploit);
          continue;
        }

        applyExploitData(card, null);
      }
    } catch (_err) {
      applyFallbackToAll();
      setLiveVersionText("windows", "Unavailable");
      setLiveVersionText("android", "2.714");
      setLiveVersionText("ios", "2.714");
    }
  }

  refreshExecutorData();
  window.setInterval(refreshExecutorData, 300000);
})();
