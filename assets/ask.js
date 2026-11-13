/* Ask CFOLogic: a floating, glassy question dock on every page.
 *
 * Collapsed it reads "Ask CFOLogic"; on hover or focus it widens into a bar
 * with an input and, above it, the questions that belong to this page (the
 * same pattern as Ask Navigator on navigatorhq.ai). On phones it stays open.
 *
 * Layer 1: answers come only from cfologic.com itself, built into
 * /assets/ask-index.json at build time (curated answers for the main pages,
 * every post's FAQ, FAQ accordions on indexed service pages). Nothing is
 * generated, so nothing can be invented. A live AI answer (Layer 2) can slot
 * into answerTyped().
 */
(function () {
  "use strict";
  if (window.__askCFO) return;
  window.__askCFO = true;

  var BOOK = "https://cal.com/GrowthCFO";
  var STOP = ("a an the and or of to in on for with is are be do does can i we you your our my me it its this that " +
              "what how why when where who which about from at by as if so not no yes will would should could have has " +
              "there their they them us cfologic").split(" ");
  var stop = {}; STOP.forEach(function (w) { stop[w] = 1; });
  var EASE = "cubic-bezier(.2,.8,.2,1)";
  var GLASS = "background:rgba(255,255,255,.68);backdrop-filter:blur(24px) saturate(1.8);-webkit-backdrop-filter:blur(24px) saturate(1.8);" +
              "border:1px solid rgba(255,255,255,.7);";

  var css = [
    "@keyframes askUp{0%{transform:translate(-50%,24px);opacity:0}100%{transform:translate(-50%,0);opacity:1}}",
    "@keyframes askIn{0%{transform:translateY(12px);opacity:0}100%{transform:none;opacity:1}}",
    ".ask-dock{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:88;width:min(680px,calc(100vw - 32px));",
    "display:flex;flex-direction:column;gap:10px;align-items:stretch;animation:askUp .5s " + EASE + ";font-family:var(--font-body,inherit);color:var(--color-text,#111)}",
    ".ask-bar{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 12px;border-radius:999px;" + GLASS,
    "box-shadow:0 18px 50px rgba(0,43,102,.22),0 2px 8px rgba(0,43,102,.08),inset 0 1px 0 rgba(255,255,255,.8);transition:box-shadow .25s;margin:0}",
    ".ask-bar:focus-within{box-shadow:0 22px 60px rgba(0,71,171,.3),0 0 0 2px var(--color-accent-300,#93c5fd)}",
    ".ask-lead{display:flex;align-items:center;gap:9px;flex:none;cursor:pointer}",
    ".ask-orb{width:30px;height:30px;border-radius:50%;flex:none;background:radial-gradient(circle at 35% 30%,#dbe8ff 0,#6b9cff 38%,#1d4ed8 80%,#0b2f8f 100%);",
    "box-shadow:0 0 0 4px rgba(74,134,255,.14),0 4px 14px rgba(29,78,216,.35)}",
    ".ask-word{display:flex;align-items:center;gap:9px}",
    ".ask-word b{font-family:var(--font-heading,inherit);font-weight:700;font-size:14.5px;letter-spacing:-.01em;white-space:nowrap}",
    ".ask-word i{width:1px;height:22px;background:var(--color-neutral-300,#d1d5db);flex:none}",
    ".ask-bar input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:15.5px;color:var(--color-text,#111);padding:8px 0}",
    ".ask-bar input::placeholder{color:var(--color-neutral-500,#6b7280)}",
    ".ask-send{width:40px;height:40px;border-radius:50%;border:0;background-image:var(--grad-a,linear-gradient(135deg,#0047AB,#0064F1 48%,#378AFF));",
    "color:#fff;display:grid;place-items:center;cursor:pointer;padding:0;flex:none;transition:transform .2s}",
    ".ask-send:hover{transform:scale(1.06)}",
    ".ask-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 2px 4px;",
    "-webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}",
    ".ask-chips::-webkit-scrollbar{display:none}",
    ".ask-chip{white-space:nowrap;flex:none;border-radius:999px;padding:8px 14px;font:inherit;font-size:13px;color:var(--color-neutral-800,#1f2937);cursor:pointer;",
    "background:rgba(255,255,255,.62);backdrop-filter:blur(16px) saturate(1.6);-webkit-backdrop-filter:blur(16px) saturate(1.6);border:1px solid rgba(255,255,255,.75);",
    "box-shadow:0 4px 14px rgba(0,43,102,.08);transition:background .2s,color .2s,transform .2s}",
    ".ask-chip:hover{background:var(--color-accent-100,#dbeafe);color:var(--color-accent-800,#1e40af);transform:translateY(-1px)}",
    ".ask-panel{border-radius:20px;" + GLASS + "background:rgba(255,255,255,.82);box-shadow:0 24px 64px rgba(0,43,102,.26);",
    "max-height:min(460px,56vh);display:flex;flex-direction:column;overflow:hidden;animation:askIn .35s " + EASE + "}",
    ".ask-panel[hidden]{display:none}",
    ".ask-ph{display:flex;align-items:center;gap:8px;padding:10px 12px 10px 18px;border-bottom:1px solid rgba(15,23,42,.08)}",
    ".ask-ph b{font-family:var(--font-heading,inherit);font-size:14px}",
    ".ask-ghost{margin-left:auto;border:0;background:transparent;font:inherit;font-size:12px;color:var(--color-neutral-700,#374151);cursor:pointer;padding:6px 10px;border-radius:999px}",
    ".ask-ghost:hover{background:rgba(15,23,42,.06)}",
    ".ask-x{width:32px;height:32px;border-radius:50%;border:0;background:rgba(15,23,42,.07);color:var(--color-text,#111);display:grid;place-items:center;cursor:pointer;padding:0;font-size:18px;line-height:1}",
    ".ask-x:hover{background:rgba(15,23,42,.12)}",
    ".ask-thread{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:12px}",
    ".ask-q{align-self:flex-end;max-width:85%;background:var(--grad-a,linear-gradient(135deg,#0047AB,#0064F1 48%,#378AFF));color:#fff;padding:9px 14px;border-radius:16px 16px 4px 16px;font-size:14.5px;line-height:21px}",
    ".ask-a{font-size:14.5px;line-height:23px;margin:0}",
    ".ask-src{font-size:13px}",
    ".ask-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
    ".ask-more{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-600,#4b5563);margin:4px 0 0}",
    ".ask-list{display:flex;flex-direction:column;gap:6px}",
    ".ask-list .ask-chip{white-space:normal;text-align:left;border-radius:12px}",
    ".ask-note{font-size:12px;line-height:18px;color:var(--color-neutral-600,#4b5563);margin:0;padding:0 18px 12px}",
    /* collapse to the pill on hover-capable screens, expand on hover/focus/open */
    "@media (hover:hover) and (min-width:761px){",
    ".ask-dock{max-width:min(680px,calc(100vw - 32px));transition:max-width .45s " + EASE + "}",
    ".ask-bar{overflow:hidden}",
    ".ask-chips{max-height:60px;transition:opacity .3s,max-height .35s,margin-top .35s,transform .3s}",
    ".ask-bar input,.ask-send,.ask-word i{transition:opacity .25s,width .35s,margin .35s}",
    ".ask-dock:not(:hover):not(:focus-within):not(.open){max-width:186px}",
    ".ask-dock:not(:hover):not(:focus-within):not(.open) .ask-chips{opacity:0;max-height:0;margin-top:-10px;transform:translateY(8px);pointer-events:none}",
    ".ask-dock:not(:hover):not(:focus-within):not(.open) .ask-bar input{opacity:0;width:0;flex:0 0 0;min-width:0}",
    ".ask-dock:not(:hover):not(:focus-within):not(.open) .ask-send{opacity:0;width:0;margin-left:-10px}",
    ".ask-dock:not(:hover):not(:focus-within):not(.open) .ask-word i{opacity:0;width:0;margin-left:-9px}}",
    "@media (max-width:760px){.ask-dock{bottom:76px}.ask-word{display:none!important}.ask-dock:not(:focus-within):not(.open) .ask-chips{display:none}}"
  ].join("");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var path = location.pathname.replace(/index\.html$/, "");
  if (!/\/$/.test(path)) path += "/";

  var dock = document.createElement("div");
  dock.className = "ask-dock";
  dock.innerHTML =
    '<div class="ask-panel" role="dialog" aria-label="Ask CFOLogic" hidden>' +
      '<div class="ask-ph"><span class="ask-orb" style="width:22px;height:22px" aria-hidden="true"></span><b>Ask CFOLogic</b>' +
      '<button type="button" class="ask-ghost" data-act="home">All questions</button>' +
      '<button type="button" class="ask-x" aria-label="Close">×</button></div>' +
      '<div class="ask-thread" aria-live="polite"></div>' +
      '<p class="ask-note">Answers come from cfologic.com. For your own numbers, <a href="' + BOOK + '" target="_blank" rel="noopener">book a savings review</a>.</p>' +
    '</div>' +
    '<div class="ask-chips" aria-label="Suggested questions"></div>' +
    '<form class="ask-bar" role="search">' +
      '<span class="ask-lead"><span class="ask-orb" aria-hidden="true"></span><span class="ask-word"><b>Ask CFOLogic</b><i></i></span></span>' +
      '<input type="text" placeholder="Anything about CFOLogic…" aria-label="Ask CFOLogic" autocomplete="off" maxlength="200">' +
      '<button type="submit" class="ask-send" aria-label="Ask"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>' +
    '</form>';
  document.body.appendChild(dock);
  var panel = dock.querySelector(".ask-panel"), thread = dock.querySelector(".ask-thread");
  var chipsEl = dock.querySelector(".ask-chips"), input = dock.querySelector("input");

  var data = null, loading = null;
  function load() {
    if (data) return Promise.resolve(data);
    if (!loading) loading = fetch("/assets/ask-index.json").then(function (r) { return r.json(); })
      .then(function (d) { data = d; prepare(d); renderChips(); return d; });
    return loading;
  }
  function stem(w) { return w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, ""); }
  function toks(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9$% ]+/g, " ").split(/\s+/)
      .filter(function (w) { return w && !stop[w]; }).map(stem);
  }
  var df = {}, N = 0;
  function prepare(d) {
    N = d.entries.length;
    d.entries.forEach(function (e) {
      e._q = toks(e.q + " " + (e.k || "")); e._a = toks(e.a);
      var seen = {}; e._q.concat(e._a).forEach(function (t) { if (!seen[t]) { seen[t] = 1; df[t] = (df[t] || 0) + 1; } });
    });
  }
  function ctxIds() { return data.ctx[path] || data.ctx["*"]; }
  function search(q) {
    var qt = toks(q); if (!qt.length) return [];
    var here = {}; ctxIds().forEach(function (i) { here[i] = 1; });
    return data.entries.map(function (e, i) {
      var s = 0;
      qt.forEach(function (t) {
        var idf = Math.log(1 + N / (df[t] || 1));
        if (e._q.indexOf(t) >= 0) s += 2 * idf; else if (e._a.indexOf(t) >= 0) s += idf;
      });
      s = s / Math.sqrt(qt.length);
      if (s && here[i]) s *= 1.3;
      if (s && e.c) s *= 1.4;
      return { i: i, s: s };
    }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; });
  }
  function chip(i) { return '<button type="button" class="ask-chip" data-i="' + i + '">' + esc(data.entries[i].q) + '</button>'; }
  function renderChips() { chipsEl.innerHTML = ctxIds().map(chip).join(""); }
  function src(e) {
    var ext = /^https?:/.test(e.u);
    return '<a class="ask-src" href="' + esc(e.u) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '>Source: ' + esc(e.t) + ' →</a>';
  }
  function bookBtn() { return '<a class="btn btn-primary" href="' + BOOK + '" target="_blank" rel="noopener" style="text-decoration:none">Book a savings review</a>'; }
  function list(ids, label) {
    return ids.length ? '<p class="ask-more">' + esc(label) + '</p><div class="ask-list">' + ids.map(chip).join("") + '</div>' : "";
  }
  function openPanel() { panel.hidden = false; dock.classList.add("open"); }
  function closePanel() { panel.hidden = true; dock.classList.remove("open"); thread.innerHTML = ""; }
  function home() {
    openPanel();
    thread.innerHTML = list(ctxIds(), data.ctxLabel[path] || "Questions people ask");
  }
  function show(q, i, related) {
    var e = data.entries[i];
    openPanel();
    var more = (related || []).filter(function (j) { return j !== i; }).slice(0, 3);
    thread.innerHTML = '<div class="ask-q">' + esc(q) + '</div><p class="ask-a">' + esc(e.a) + '</p>' +
      '<div class="ask-row">' + src(e) + '</div><div class="ask-row">' + bookBtn() + '</div>' + list(more, "Related");
    thread.scrollTop = 0;
  }
  function answerTyped(q) {
    var r = search(q);
    if (window.gtag) try { gtag("event", "ask_cfologic", { question: q.slice(0, 100) }); } catch (e) {}
    if (!r.length || r[0].s < 1.2) {
      openPanel();
      thread.innerHTML = '<div class="ask-q">' + esc(q) + '</div><p class="ask-a">We don\'t have a written answer to that on the site yet. ' +
        'Bring it to a 30-minute savings review and ask us directly.</p><div class="ask-row">' + bookBtn() + '</div>' +
        list(ctxIds().slice(0, 4), "Questions people ask");
      return;
    }
    show(q, r[0].i, r.slice(1, 5).map(function (x) { return x.i; }));
  }
  function related(i) { return search(data.entries[i].q).map(function (x) { return x.i; }); }

  // load the index as soon as the visitor shows interest
  ["mouseenter", "focusin", "touchstart"].forEach(function (ev) { dock.addEventListener(ev, load, { once: true, passive: true }); });
  if (window.matchMedia && !window.matchMedia("(hover:hover) and (min-width:761px)").matches) load();

  dock.addEventListener("click", function (e) {
    var c = e.target.closest(".ask-chip");
    if (c) { var i = +c.getAttribute("data-i"); show(data.entries[i].q, i, related(i)); return; }
    if (e.target.closest(".ask-x")) { closePanel(); return; }
    if (e.target.closest('[data-act="home"]')) { home(); return; }
    if (e.target.closest(".ask-lead")) { load().then(function () { panel.hidden ? home() : closePanel(); }); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { closePanel(); input.blur(); } });
  dock.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault(); var q = input.value.trim(); if (!q) { load().then(home); return; }
    load().then(function () { answerTyped(q); input.value = ""; });
  });
})();
