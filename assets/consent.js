/* Cookie consent.
 *
 * Nothing in a non-essential category runs until the visitor says so. The
 * build rewrites every gated tag to <script type="text/plain" data-consent>,
 * which a browser parses but will not execute; this file turns the allowed
 * ones back into real scripts after a choice is made.
 *
 * Categories match the four the legal page describes, so what a visitor
 * switches off here is the same thing they read about there.
 */
(function () {
  "use strict";

  var KEY = "cfo-consent";
  var VERSION = 1;

  var CATS = [
    { id: "analytics", name: "Analytics",
      body: "Google Analytics: which pages get read, device type and a rough location from "
          + "your IP. No session recording." },
    { id: "replay", name: "Session recording",
      body: "Microsoft Clarity: records this visit and replays it to us as a video of the "
          + "page — clicks, scrolling and mouse movement. Typing in form fields is masked." },
    { id: "marketing", name: "Marketing",
      body: "The Apollo tracker looks up your IP to work out which company you are visiting "
          + "from. On our /cfo page only, the Meta Pixel reports the visit to Meta." }
  ];

  // ------------------------------------------------------------------ state
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return (v && v.v === VERSION) ? v : null;
    } catch (e) { return null; }
  }

  function write(choice) {
    choice.v = VERSION;
    choice.ts = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (e) {}
  }

  // Turn the parked tags for the granted categories into live scripts. Runs
  // once per tag: each is marked as it goes, so a later Save cannot double-fire
  // anything that is already running.
  function release(choice) {
    var parked = document.querySelectorAll("script[data-consent]");
    for (var i = 0; i < parked.length; i++) {
      var tag = parked[i];
      var cat = tag.getAttribute("data-consent");
      if (!choice[cat] || tag.hasAttribute("data-consent-done")) continue;
      tag.setAttribute("data-consent-done", "");
      var live = document.createElement("script");
      var src = tag.getAttribute("data-src");
      if (src) {
        live.src = src;
        live.async = true;
      } else {
        live.text = tag.textContent;
      }
      document.head.appendChild(live);
    }
  }

  // --------------------------------------------------------------- elements
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var banner, panel, reopen, lastFocus;

  function close(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function decide(choice) {
    write(choice);
    release(choice);
    close(banner); banner = null;
    close(panel); panel = null;
    showReopen();
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  function acceptAll() {
    decide({ analytics: true, replay: true, marketing: true });
  }

  function rejectAll() {
    decide({ analytics: false, replay: false, marketing: false });
  }

  // ----------------------------------------------------------------- banner
  function showBanner() {
    banner = el("div", "cc-bar");
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookies");
    banner.innerHTML =
      '<div class="cc-bar-in">'
      + '<p class="cc-bar-txt">We use cookies to see how the site is used, and on one page '
      + 'to measure advertising. Nothing beyond what the site needs to work runs until you '
      + 'choose. <a href="/legal#cookies">What each one does</a>.</p>'
      + '<div class="cc-bar-btns">'
      + '<button type="button" class="cc-btn cc-btn-ghost" data-cc="prefs">Preferences</button>'
      + '<button type="button" class="cc-btn cc-btn-ghost" data-cc="reject">Reject non-essential</button>'
      + '<button type="button" class="cc-btn cc-btn-solid" data-cc="accept">Accept all</button>'
      + '</div></div>';
    document.body.appendChild(banner);
    banner.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-cc]");
      if (!b) return;
      var a = b.getAttribute("data-cc");
      if (a === "accept") acceptAll();
      else if (a === "reject") rejectAll();
      else showPanel();
    });
  }

  // ------------------------------------------------------------ preferences
  function showPanel() {
    var saved = read() || { analytics: false, replay: false, marketing: false };
    lastFocus = document.activeElement;
    panel = el("div", "cc-wrap");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Cookie preferences");

    var rows = '<div class="cc-row cc-row-fixed">'
      + '<div><span class="cc-row-name">Strictly necessary</span>'
      + '<p class="cc-row-body">What the site needs to load and to send a form you fill in. '
      + 'These cannot be switched off.</p></div>'
      + '<span class="cc-always">Always on</span></div>';
    CATS.forEach(function (c) {
      rows += '<div class="cc-row">'
        + '<div><span class="cc-row-name">' + c.name + '</span>'
        + '<p class="cc-row-body">' + c.body + '</p></div>'
        + '<label class="cc-switch"><input type="checkbox" data-cat="' + c.id + '"'
        + (saved[c.id] ? " checked" : "") + '>'
        + '<span class="cc-slider" aria-hidden="true"></span>'
        + '<span class="cc-sr">' + c.name + '</span></label></div>';
    });

    panel.innerHTML =
      '<div class="cc-dialog">'
      + '<button type="button" class="cc-x" data-cc="close" aria-label="Close">×</button>'
      + '<h2 class="cc-h">Cookie preferences</h2>'
      + '<p class="cc-lede">Switch off anything you would rather we did not run. The site works '
      + 'the same either way. You can change this whenever you like.</p>'
      + rows
      + '<div class="cc-actions">'
      + '<button type="button" class="cc-btn cc-btn-ghost" data-cc="reject">Reject non-essential</button>'
      + '<button type="button" class="cc-btn cc-btn-solid" data-cc="save">Save choices</button>'
      + '</div>'
      + '<p class="cc-fine">Full detail of each service is on our '
      + '<a href="/legal#cookies">privacy and legal page</a>.</p>'
      + '</div>';
    document.body.appendChild(panel);

    panel.addEventListener("click", function (e) {
      if (e.target === panel) { closePanel(); return; }
      var b = e.target.closest && e.target.closest("[data-cc]");
      if (!b) return;
      var a = b.getAttribute("data-cc");
      if (a === "save") {
        var c = {};
        var boxes = panel.querySelectorAll("[data-cat]");
        for (var i = 0; i < boxes.length; i++) {
          c[boxes[i].getAttribute("data-cat")] = boxes[i].checked;
        }
        decide(c);
      } else if (a === "reject") {
        rejectAll();
      } else {
        closePanel();
      }
    });

    document.addEventListener("keydown", onKey);
    var first = panel.querySelector("button, input");
    if (first) first.focus();
  }

  function closePanel() {
    close(panel); panel = null;
    document.removeEventListener("keydown", onKey);
    if (!read()) { if (!banner) showBanner(); }
    else showReopen();
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  function onKey(e) {
    if (e.key === "Escape") closePanel();
  }

  // -------------------------------------------------- the standing cookie button
  function showReopen() {
    if (reopen) return;
    reopen = el("button", "cc-fab");
    reopen.type = "button";
    reopen.setAttribute("aria-label", "Cookie preferences");
    reopen.title = "Cookie preferences";
    reopen.innerHTML =
      '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      + 'stroke-width="1.8" stroke-linecap="round" aria-hidden="true">'
      + '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5Z"/>'
      + '<circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none"/>'
      + '<circle cx="14.5" cy="14.5" r="1.1" fill="currentColor" stroke="none"/>'
      + '<circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none"/></svg>';
    reopen.addEventListener("click", function () {
      if (!panel) showPanel();
    });
    document.body.appendChild(reopen);
  }

  // Any link or button marked data-cookie-prefs opens the panel, so the legal
  // page can offer one without knowing anything about this file.
  function wireLinks() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-cookie-prefs]");
      if (!t) return;
      e.preventDefault();
      if (!panel) showPanel();
    });
  }

  function init() {
    wireLinks();
    var saved = read();
    if (saved) {
      release(saved);
      showReopen();
    } else {
      showBanner();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
