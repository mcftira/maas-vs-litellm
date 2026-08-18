/* LLM gateway döntési anyag — interakciók (vanilla JS, külső függőség nélkül) */
(function () {
  "use strict";

  /* ---------- 1 · Side-rail aktív szakasz ---------- */
  var railLinks = Array.prototype.slice.call(document.querySelectorAll("#railToc a"));
  if (railLinks.length && "IntersectionObserver" in window) {
    var railObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        railLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
        var link = railLinks.filter(function (a) {
          return a.getAttribute("href") === "#" + en.target.id;
        })[0];
        if (link) link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    railLinks.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute("href"));
      if (sec) railObs.observe(sec);
    });
  }

  /* ---------- 2 · Mobil menü (details) ---------- */
  var menu = document.querySelector(".topbar__menu");
  if (menu) {
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { menu.removeAttribute("open"); });
    });
    document.addEventListener("click", function (e) {
      if (menu.hasAttribute("open") && !menu.contains(e.target)) {
        menu.removeAttribute("open");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.hasAttribute("open")) menu.removeAttribute("open");
    });
  }

  /* ---------- 3 · Funkciómátrix szűrés ---------- */
  var chipsWrap = document.getElementById("matrixChips");
  var diffToggle = document.getElementById("diffToggle");
  var matrix = document.getElementById("featureMatrix");

  function applyMatrixFilter() {
    if (!matrix || !chipsWrap) return;
    var active = chipsWrap.querySelector(".chip.is-active");
    var filter = active ? active.getAttribute("data-filter") : "all";
    var diffOnly = !!(diffToggle && diffToggle.checked);
    matrix.querySelectorAll("tbody").forEach(function (tb) {
      var inCat = filter === "all" || tb.getAttribute("data-cat") === filter;
      var visible = 0;
      tb.querySelectorAll("tr:not(.matrix__cat)").forEach(function (row) {
        var show = inCat && !(diffOnly && row.getAttribute("data-same") === "1");
        row.style.display = show ? "" : "none";
        if (show) visible += 1;
      });
      var catRow = tb.querySelector(".matrix__cat");
      if (catRow) catRow.style.display = inCat && visible > 0 ? "" : "none";
    });
  }

  if (chipsWrap) {
    chipsWrap.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        chipsWrap.querySelectorAll(".chip").forEach(function (c) {
          var on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        applyMatrixFilter();
      });
    });
  }
  if (diffToggle) diffToggle.addEventListener("change", applyMatrixFilter);

  /* ---------- 4 · Tooltip a mátrix-cellákhoz ---------- */
  var tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.id = "cell-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);

  var hoverTimer = null;
  var activeTarget = null;
  var pinned = false;

  function showTooltip(target) {
    var note = target.getAttribute("data-note");
    if (!note) return;
    if (activeTarget && activeTarget !== target) hideTooltip();
    tooltip.textContent = note;
    activeTarget = target;
    target.setAttribute("aria-describedby", "cell-tooltip");
    tooltip.classList.add("is-visible");
    var rect = target.getBoundingClientRect();
    var tt = tooltip.getBoundingClientRect();
    var left = rect.left + rect.width / 2 - tt.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tt.width - 8));
    var top = rect.top - tt.height - 8;
    if (top < 8) top = rect.bottom + 8;
    tooltip.style.left = Math.round(left) + "px";
    tooltip.style.top = Math.round(top) + "px";
  }

  function hideTooltip() {
    window.clearTimeout(hoverTimer);
    hoverTimer = null;
    if (activeTarget) activeTarget.removeAttribute("aria-describedby");
    activeTarget = null;
    pinned = false;
    tooltip.classList.remove("is-visible");
  }

  document.addEventListener("pointerover", function (e) {
    var t = e.target.closest ? e.target.closest("[data-note]") : null;
    if (!t || e.pointerType === "touch") return;
    window.clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(function () { showTooltip(t); }, 800);
  });
  document.addEventListener("pointerout", function (e) {
    var t = e.target.closest ? e.target.closest("[data-note]") : null;
    if (!t) return;
    window.clearTimeout(hoverTimer);
    if (!pinned && document.activeElement !== t) hideTooltip();
  });
  document.addEventListener("focusin", function (e) {
    var t = e.target.closest ? e.target.closest("[data-note]") : null;
    if (t) { window.clearTimeout(hoverTimer); showTooltip(t); }
  });
  document.addEventListener("focusout", function (e) {
    if (activeTarget && e.target === activeTarget && !pinned) hideTooltip();
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-note]") : null;
    if (t) {
      if (activeTarget === t && pinned) { hideTooltip(); return; }
      pinned = true;
      showTooltip(t);
    } else if (activeTarget && !tooltip.contains(e.target)) {
      hideTooltip();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hideTooltip();
  });
  window.addEventListener("scroll", function () {
    /* Fókusz által kiváltott tooltip maradjon: a fókuszálás okozta görgetés ne tüntesse el. */
    if (!pinned && document.activeElement !== activeTarget) hideTooltip();
  }, { passive: true });
  window.addEventListener("resize", hideTooltip, { passive: true });

  /* ---------- 5 · Hálózati döntési widget ---------- */
  var widget = document.getElementById("patternWidget");
  var result = document.getElementById("patternResult");

  var PATTERNS = {
    "A": {
      tag: "A minta",
      title: "Csak laptopos hozzáférés — ma ez elég",
      bullets: [
        "Minden fogyasztó emberi fejlesztő (IDE, coding ágens): a laptopok egyenként érik el mindkét végpontot.",
        "On-prem GLM: LAN/VPN a klaszter felé; Foundry: TLS 443 egress a publikus végpontra.",
        "Nem kell klaszter → Azure kapcsolat, tűzfalnyitás, ExpressRoute."
      ],
      note: "Korlát: amint in-cluster workload (pipeline, ágens, gateway) hív Foundryt, B vagy C minta kell."
    },
    "A+": {
      tag: "A minta — privát változat",
      title: "Laptopos hozzáférés, privát végponton át",
      bullets: [
        "A laptopok a Foundry privát végpontját érik el pont–hely (P2S) VPN-nel vagy a vállalati hálózatról ExpressRoute-on át.",
        "A PNA akár Disabled is lehet — a publikus végpont kikapcsolható.",
        "Klaszter-oldali kapcsolat így sem kell: a fogyasztók továbbra is csak laptopok."
      ],
      note: "Korlát ugyanaz: in-cluster workload megjelenésekor B helyett C minta kell."
    },
    "B": {
      tag: "B minta",
      title: "Klaszter-gateway + egress FQDN-allowlist",
      bullets: [
        "A LiteLLM gateway (és az in-cluster ágensek, pipeline-ok) a vállalati forward proxyn át, FQDN-allowlisttel érik a Foundry publikus végpontját TLS 443-on.",
        "A PNA „Selected networks“ állással a bank kimenő IP-ire szűkíthető.",
        "Nincs ExpressRoute-projekt, hetek helyett napok alatt bevezethető; a kontrollpont az egress proxy."
      ],
      note: "Az AKS sehol nincs az útvonalban: a hívás a Foundry FQDN-re megy, nem ügyfél-AKS-re."
    },
    "C": {
      tag: "C minta",
      title: "Private Link ExpressRoute-on + DNS-resolver",
      bullets: [
        "PNA: Disabled — a Foundry csak privát végponton érhető el, a forgalom nem érinti a publikus internetet.",
        "ExpressRoute (vagy S2S VPN) + Private Endpoint az Azure VNetben; az on-prem DNS az Azure Private DNS Resolver felé forwardolja a privatelink zónát.",
        "A legszigorúbb hálózati megfelelés — ára: ExpressRoute-kapcsolat, DNS-topológia, hosszabb bevezetés."
      ],
      note: "Banki default, ha a compliance publikus endpointot nem enged — ütemezése a 08. szakasz 30–90 napos sávjába tartozik."
    }
  };

  function pickPatternKey() {
    var consumers = widget.querySelector("input[name=\"consumers\"]:checked");
    var pub = widget.querySelector("input[name=\"public\"]:checked");
    if (!consumers || !pub) return "C";
    if (consumers.value === "laptop") return pub.value === "yes" ? "A" : "A+";
    return pub.value === "yes" ? "B" : "C";
  }

  function renderPattern() {
    if (!result) return;
    var p = PATTERNS[pickPatternKey()];
    result.textContent = "";
    var card = document.createElement("div");
    card.className = "pattern-card";

    var tag = document.createElement("span");
    tag.className = "pattern-card__tag";
    tag.textContent = "Ajánlott: " + p.tag;
    card.appendChild(tag);

    var title = document.createElement("p");
    title.className = "pattern-card__title";
    title.textContent = p.title;
    card.appendChild(title);

    var ul = document.createElement("ul");
    p.bullets.forEach(function (b) {
      var li = document.createElement("li");
      li.textContent = b;
      ul.appendChild(li);
    });
    card.appendChild(ul);

    var note = document.createElement("p");
    note.className = "pattern-card__note";
    note.textContent = p.note;
    card.appendChild(note);

    result.appendChild(card);
  }

  if (widget && result) {
    widget.addEventListener("change", renderPattern);
    renderPattern();
  }
})();
