// CFOLogic site runtime. Replaces the design tool's React renderer with the
// four behaviours the design actually needs: state patches (pyramid, values,
// carousel), chip filters (insights, case studies), the sticky-card jump, and
// the scroll-reveal. Everything else in the page is plain server-rendered HTML.
(function () {
  'use strict';

  var D = window.__DC || {};

  // ---- state patches -------------------------------------------------------
  var nodes = {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-dc-h]'), function (el) {
    nodes[el.getAttribute('data-dc-h')] = el;
  });

  var current = D.initial === undefined ? 0 : D.initial;

  function apply(id) {
    var patch = (D.patches || {})[id];
    if (patch === undefined) return;
    current = id;
    for (var nid in patch) {
      var el = nodes[nid];
      if (!el) continue;
      var fields = patch[nid];
      for (var key in fields) {
        if (key === '#text') el.textContent = fields[key];
        else el.setAttribute(key, fields[key]);
      }
    }
  }

  ['click', 'mouseenter', 'focus'].forEach(function (evt) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-dc-' + evt + ']'), function (el) {
      var target = el.getAttribute('data-dc-' + evt);
      if (target.indexOf('fn:') === 0) {
        if (target === 'fn:jump' && evt === 'click') el.addEventListener('click', jump);
        return;
      }
      // `target` is a handler path; where it lands depends on the current state,
      // so that pause/next/previous stay relative the way the design had them.
      var go = function () {
        var table = (D.trans || [])[current] || {};
        if (target in table) apply(table[target]);
      };
      el.addEventListener(evt, go);
      if (evt === 'click') {
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
        });
      }
    });
  });

  // ---- auto-advancing carousels -------------------------------------------
  // The table only holds a next state for the states the design left running, so
  // a paused state simply has nowhere to go and the rotation resumes on unpause.
  if (D.auto && D.auto.next) {
    setInterval(function () {
      var next = D.auto.next[current];
      if (next !== undefined) apply(Number(next));
    }, D.auto.interval);
  }

  // ---- chip filters --------------------------------------------------------
  var chips = document.querySelectorAll('[data-dc-chip]');
  if (chips.length && D.chip) {
    var picked = {};
    Array.prototype.forEach.call(chips, function (chip) {
      var group = chip.getAttribute('data-dc-chip');
      if (!(group in picked)) picked[group] = chip.getAttribute('data-dc-val');
      chip.addEventListener('click', function () {
        picked[group] = chip.getAttribute('data-dc-val');
        refilter();
      });
    });

    var items = document.querySelectorAll('[' + D.chip.itemAttr + ']');

    var refilter = function () {
      Array.prototype.forEach.call(chips, function (chip) {
        var on = picked[chip.getAttribute('data-dc-chip')] === chip.getAttribute('data-dc-val');
        chip.setAttribute('style', on ? D.chip.active : D.chip.inactive);
      });
      var shown = 0;
      Array.prototype.forEach.call(items, function (item) {
        var ok = true;
        for (var group in picked) {
          var want = picked[group];
          var have = item.getAttribute('data-f-' + group);
          if (have === null) continue;
          if (want !== D.chip.all[group] && want !== have) ok = false;
        }
        item.style.display = ok ? '' : 'none';
        if (ok) {
          if (D.chip.sticky) {
            item.style.top = (128 + shown * 20) + 'px';
            item.style.zIndex = shown + 1;
          }
          shown++;
        }
      });
      var count = document.querySelector('[data-dc-count]');
      if (count && D.chip.countLabel) {
        count.textContent = shown + (shown === 1 ? D.chip.countLabel[0] : D.chip.countLabel[1]);
      }
    };
  }

  // ---- sticky-card jump ----------------------------------------------------
  function jump(e) {
    if (e.target.closest('a,button')) return;
    if (window.getSelection && String(window.getSelection())) return;
    var el = e.currentTarget;
    var sticky = parseFloat(el.style.top) || 128;
    var prev = el.style.position;
    el.style.position = 'static';
    var top = el.getBoundingClientRect().top + window.scrollY;
    el.style.position = prev;
    window.scrollTo({ top: top - sticky - 12, behavior: 'smooth' });
  }

  // ---- scroll reveal -------------------------------------------------------
  var folds = document.querySelectorAll('[data-fold]');
  if (folds.length) {
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(folds, function (el) { el.classList.add('unfolded'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('unfolded'); io.unobserve(en.target); }
        });
      }, { threshold: D.fold || 0.2 });
      Array.prototype.forEach.call(folds, function (el) { io.observe(el); });
    }
  }
})();
