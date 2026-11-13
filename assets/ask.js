/* Ask CFOLogic: a floating question bar on every page.
 *
 * Layer 1 (this file): answers come only from cfologic.com itself, built into
 * /assets/ask-index.json at build time: curated answers for the main pages,
 * every Insights post's FAQ, and the FAQ accordions on service pages. It
 * suggests the questions that belong to the page you are on, and matches
 * typed questions against the whole index. Nothing is generated, so nothing
 * can be invented. A live AI answer (Layer 2) can slot into answerTyped().
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

  var css = [
    ".ask-pill{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:88;display:inline-flex;align-items:center;gap:10px;",
    "padding:12px 20px 12px 14px;border-radius:999px;border:1px solid var(--color-neutral-200,#e5e7eb);background:rgba(255,255,255,.92);",
    "backdrop-filter:blur(16px) saturate(1.6);-webkit-backdrop-filter:blur(16px) saturate(1.6);box-shadow:0 10px 30px rgba(0,71,171,.14);",
    "font-family:var(--font-heading,inherit);font-weight:var(--font-heading-weight,700);font-size:15px;color:var(--color-text,#111);cursor:pointer}",
    ".ask-pill:hover{border-color:var(--color-neutral-400,#9ca3af)}",
    ".ask-orb{width:22px;height:22px;border-radius:50%;flex:none;background:radial-gradient(circle at 35% 35%,#c7dcff 0,#4a86ff 45%,#1d4ed8 100%);",
    "box-shadow:0 0 0 4px rgba(74,134,255,.12)}",
    ".ask-panel{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:90;width:min(560px,calc(100vw - 24px));max-height:min(640px,calc(100vh - 110px));",
    "display:flex;flex-direction:column;background:#fff;border:1px solid var(--color-neutral-200,#e5e7eb);border-radius:18px;",
    "box-shadow:0 24px 60px rgba(15,23,42,.22);font-family:var(--font-body,inherit);color:var(--color-text,#111);overflow:hidden}",
    ".ask-panel[hidden]{display:none}",
    ".ask-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--color-neutral-200,#e5e7eb)}",
    ".ask-head strong{font-family:var(--font-heading,inherit);font-weight:var(--font-heading-weight,700);font-size:15px}",
    ".ask-x{margin-left:auto;border:0;background:none;font-size:22px;line-height:1;cursor:pointer;color:var(--color-neutral-600,#6b7280);padding:4px 6px}",
    ".ask-body{padding:16px;overflow:auto;flex:1}",
    ".ask-label{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-accent-700,#1d4ed8);margin:0 0 10px}",
    ".ask-chips{display:flex;flex-direction:column;gap:8px}",
    ".ask-chip{text-align:left;font:inherit;font-size:14.5px;line-height:21px;padding:10px 14px;border-radius:12px;border:1px solid var(--color-neutral-200,#e5e7eb);",
    "background:#fff;color:var(--color-text,#111);cursor:pointer}",
    ".ask-chip:hover{border-color:var(--color-accent-500,#3b82f6);background:var(--color-accent-50,#eff6ff)}",
    ".ask-ans{border:1px solid var(--color-neutral-200,#e5e7eb);border-radius:14px;padding:14px 16px;margin:0 0 12px}",
    ".ask-ans h4{font-family:var(--font-heading,inherit);font-weight:var(--font-heading-weight,700);font-size:16px;line-height:23px;margin:0 0 8px}",
    ".ask-ans p{font-size:14.5px;line-height:23px;margin:0}",
    ".ask-src{display:inline-block;margin-top:10px;font-size:13px}",
    ".ask-more{font-size:13px;color:var(--color-neutral-600,#6b7280);margin:14px 0 8px}",
    ".ask-foot{border-top:1px solid var(--color-neutral-200,#e5e7eb);padding:12px 14px 14px}",
    ".ask-form{display:flex;gap:8px}",
    ".ask-form input{flex:1;min-width:0;font:inherit;font-size:14.5px;padding:11px 14px;border:1px solid var(--color-neutral-300,#d1d5db);border-radius:999px;color:var(--color-text,#111);background:#fff}",
    ".ask-form button{white-space:nowrap}",
    ".ask-note{font-size:12px;line-height:18px;color:var(--color-neutral-600,#6b7280);margin:8px 2px 0}",
    ".ask-back{border:0;background:none;padding:0;font:inherit;font-size:13px;color:var(--color-accent-700,#1d4ed8);cursor:pointer;margin:0 0 10px}",
    "@media (max-width:640px){.ask-pill{left:auto;right:16px;transform:none;bottom:76px;padding:10px 16px 10px 12px;font-size:14px}",
    ".ask-panel{bottom:10px}}"
  ].join("");

  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var path = location.pathname.replace(/index\.html$/, "");
  if (!/\/$/.test(path)) path += "/";

  var pill = document.createElement("button");
  pill.type = "button"; pill.className = "ask-pill"; pill.setAttribute("aria-haspopup", "dialog");
  pill.innerHTML = '<span class="ask-orb" aria-hidden="true"></span>Ask CFOLogic';
  var panel = document.createElement("div");
  panel.className = "ask-panel"; panel.hidden = true;
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Ask CFOLogic");
  panel.innerHTML =
    '<div class="ask-head"><span class="ask-orb" aria-hidden="true"></span><strong>Ask CFOLogic</strong>' +
    '<button type="button" class="ask-x" aria-label="Close">×</button></div>' +
    '<div class="ask-body" aria-live="polite"></div>' +
    '<div class="ask-foot"><form class="ask-form"><input type="text" name="q" placeholder="Ask about our services, pricing approach or AI…" aria-label="Your question" autocomplete="off" maxlength="200">' +
    '<button class="btn btn-primary" type="submit">Ask</button></form>' +
    '<p class="ask-note">Answers come from cfologic.com. For your own numbers, <a href="' + BOOK + '" target="_blank" rel="noopener">book a savings review</a>.</p></div>';
  document.body.appendChild(pill); document.body.appendChild(panel);
  var body = panel.querySelector(".ask-body"), input = panel.querySelector("input");

  var data = null, loading = null;
  function load() {
    if (data) return Promise.resolve(data);
    if (!loading) loading = fetch("/assets/ask-index.json").then(function (r) { return r.json(); })
      .then(function (d) { data = d; prepare(d); return d; });
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
  function ctxIds() { return (data.ctx[path] || data.ctx["*"]); }
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
  function link(u, t) {
    var ext = /^https?:/.test(u);
    return '<a class="ask-src" href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '>Source: ' + esc(t) + ' →</a>';
  }
  function card(e) { return '<div class="ask-ans"><h4>' + esc(e.q) + '</h4><p>' + esc(e.a) + '</p>' + link(e.u, e.t) + '</div>'; }
  function chips(ids, label) {
    return '<p class="ask-label">' + esc(label) + '</p><div class="ask-chips">' +
      ids.map(function (i) { return '<button type="button" class="ask-chip" data-i="' + i + '">' + esc(data.entries[i].q) + '</button>'; }).join("") + '</div>';
  }
  function home() {
    var ids = ctxIds();
    body.innerHTML = chips(ids, data.ctxLabel[path] || "Questions people ask");
  }
  function show(i, related) {
    var e = data.entries[i];
    var more = (related || []).filter(function (j) { return j !== i; }).slice(0, 3);
    body.innerHTML = '<button type="button" class="ask-back">← All questions</button>' + card(e) +
      '<a class="btn btn-primary" href="' + BOOK + '" target="_blank" rel="noopener" style="text-decoration:none">Book a savings review</a>' +
      (more.length ? '<p class="ask-more">Related</p><div class="ask-chips">' + more.map(function (j) {
        return '<button type="button" class="ask-chip" data-i="' + j + '">' + esc(data.entries[j].q) + '</button>'; }).join("") + '</div>' : "");
    body.scrollTop = 0;
  }
  function answerTyped(q) {
    var r = search(q);
    if (!r.length || r[0].s < 1.2) {
      body.innerHTML = '<button type="button" class="ask-back">← All questions</button>' +
        '<div class="ask-ans"><h4>' + esc(q) + '</h4><p>We don\'t have a written answer to that on the site yet. ' +
        'Bring it to a 30-minute savings review and ask us directly, or try one of the questions below.</p></div>' +
        '<a class="btn btn-primary" href="' + BOOK + '" target="_blank" rel="noopener" style="text-decoration:none">Book a savings review</a>' +
        '<p class="ask-more">Questions people ask</p><div class="ask-chips">' + ctxIds().slice(0, 4).map(function (j) {
          return '<button type="button" class="ask-chip" data-i="' + j + '">' + esc(data.entries[j].q) + '</button>'; }).join("") + '</div>';
      return;
    }
    show(r[0].i, r.slice(1, 5).map(function (x) { return x.i; }));
    if (window.gtag) try { gtag("event", "ask_cfologic", { question: q.slice(0, 100) }); } catch (e) {}
  }
  function open() {
    load().then(function () { if (!body.innerHTML) home(); });
    panel.hidden = false; pill.hidden = true;
    setTimeout(function () { input.focus(); }, 30);
  }
  function close() { panel.hidden = true; pill.hidden = false; pill.focus(); }

  pill.addEventListener("click", open);
  panel.querySelector(".ask-x").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
  body.addEventListener("click", function (e) {
    var c = e.target.closest(".ask-chip"); if (c) { var i = +c.getAttribute("data-i"); show(i, related(i)); return; }
    if (e.target.closest(".ask-back")) home();
  });
  function related(i) { return search(data.entries[i].q).map(function (x) { return x.i; }); }
  panel.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault(); var q = input.value.trim(); if (!q) return;
    load().then(function () { answerTyped(q); input.value = ""; });
  });
})();
