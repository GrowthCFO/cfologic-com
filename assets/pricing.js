/* Founders pricing: self-serve estimator.
 *
 * Every figure below comes from the published fee structure. The estimator
 * never invents a price: where the real fee is scoped rather than fixed it
 * says so instead of showing a number. Annual payment takes 20% off the
 * recurring subscription lines only, never off usage or filings.
 */
(function () {
  "use strict";

  var ANNUAL_OFF = 0.20;
  // returns a year for each filing frequency a state can assign
  var FREQ = { monthly: 12, quarterly: 4, annually: 1 };

  // "Starting at" sits above the figure wherever the fee is scoped
  // rather than fixed, the way the rest of this market writes it.
  var LEAD = '<span style="display:block;font-size:12.5px;font-weight:600;'
           + 'letter-spacing:0.02em;line-height:16px;margin-bottom:5px;opacity:.72">'
           + '%s</span>';

  var PLANS = {
    seed:       { name: "Seed",       fee: 99,   fixed: true,  family: "seed",
                  note: "Annual revenue under $250K, up to 30 transactions a month." },
    seedplus:   { name: "Seed Plus",  fee: 149,  fixed: true,  family: "seed",
                  note: "Annual revenue up to $500K, 31 to 75 transactions a month." },
    essentials: { name: "Essentials", fee: 199,  fixed: false, federal: 1000, family: "standard",
                  note: "Books and statements. No payroll, AR or AP." },
    startup:    { name: "Startup",    fee: 450,  fixed: false, federal: 1500, family: "standard",
                  note: "Payroll in one state, AR, and AP with bill pay." },
    growing:    { name: "Growing",    fee: 1000, fixed: false, federal: 2500, family: "standard",
                  note: "Adds FP&A, spend management and a custom chart of accounts." },
    scaleup:    { name: "Scaleup",    fee: null, fixed: false, federal: null, family: "standard",
                  note: "Multi-state or multi-entity, with reporting built to your spec." }
  };

  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  };

  function readInputs() {
    var el = $("pc-form");
    if (!el) return null;
    var g = function (name) {
      var f = el.querySelector('[name="' + name + '"]:checked');
      return f ? f.value : null;
    };
    var n = function (id) {
      var f = $(id);
      return f ? parseInt(f.value, 10) || 0 : 0;
    };
    return {
      billing:  g("pc-billing") || "monthly",
      revenue:  g("pc-revenue") || "u250",
      txn:      n("pc-txn"),
      payroll:  g("pc-payroll") || "none",
      ar:       $("pc-ar") && $("pc-ar").checked,
      ap:       $("pc-ap") && $("pc-ap").checked,
      entities: ($("pc-entities") && $("pc-entities").checked) ? 2 : 1,
      // seed extras
      nav:      $("pc-nav") && $("pc-nav").checked,
      catchup:  n("pc-catchup"),
      inctax:   $("pc-inctax") && $("pc-inctax").checked,
      ststates: n("pc-st-states"),
      stfreq:   g("pc-st-freq") || "quarterly",
      // standard extras
      cfohrs:   n("pc-cfohrs"),
      states:   n("pc-states"),
      federal:  g("pc-federal") || "no"
    };
  }

  // Which plan the answers land on. Seed is checked last and wins where the
  // business genuinely qualifies, because it is the cheaper route in.
  function pickPlan(v) {
    var key;
    if (v.entities > 1 || v.payroll === "multiple" || v.txn > 200) {
      key = "scaleup";
    } else if (v.txn > 100 || v.payroll === "one10") {
      key = "growing";
    } else if (v.txn > 30 || v.payroll !== "none" || v.ar || v.ap) {
      key = "startup";
    } else {
      key = "essentials";
    }

    var simple = !v.ar && !v.ap && v.payroll === "none" && v.entities === 1;
    if (simple) {
      if (v.revenue === "u250" && v.txn <= 30) {
        key = "seed";
      } else if ((v.revenue === "u250" || v.revenue === "u500") && v.txn <= 75) {
        key = "seedplus";
      }
    }
    return key;
  }

  function estimate(v) {
    var key = pickPlan(v);
    var plan = PLANS[key];
    var sub = [];      // recurring, discountable
    var usage = [];    // recurring, not discountable
    var once = [];     // paid once, ever
    var yearly = [];   // paid again every year
    var filed = [];    // billed per return, when it is filed

    if (plan.fee !== null) {
      sub.push({ label: plan.name + " plan", amount: plan.fee });
    }

    if (plan.family === "seed") {
      if (v.nav) sub.push({ label: "CEO Navigator™ Basic", amount: 99 });
      if (v.inctax) sub.push({ label: "Income tax support", amount: 100, from: true });
      if (v.catchup > 0) {
        once.push({ label: "Catch-up bookkeeping, " + v.catchup +
                           (v.catchup === 1 ? " month" : " months"),
                    amount: 49 * v.catchup, unit: "$49 for each past month" });
      }
      once.push({ label: "One-time setup", amount: 199, unit: "Charged once, at the start" });
      var returns = v.ststates * (FREQ[v.stfreq] || 4);
      if (returns > 0) {
        filed.push({ label: "Sales tax, " + returns +
                            (returns === 1 ? " return" : " returns") + " a year",
                     amount: 100 * returns, from: true,
                     unit: v.ststates + (v.ststates === 1 ? " state" : " states") +
                           ", filing " + v.stfreq + ". From $100 per return filed." });
      }
    } else {
      if (v.states > 0) {
        yearly.push({ label: "State filings, " + v.states +
                             (v.states === 1 ? " state" : " states"),
                      amount: 300 * v.states, unit: "$300 per state, per year" });
      }
      if (v.federal === "yes" && plan.federal) {
        yearly.push({ label: "Federal return", amount: plan.federal,
                      unit: "Set by your plan \u2014 " + plan.name });
      } else if (v.federal === "yes") {
        yearly.push({ label: "Federal return", amount: 0, quoted: true,
                      unit: "Scoped with you" });
      }
    }

    if (v.cfohrs > 0) {
      usage.push({ label: "CFO on call, " + v.cfohrs +
                          (v.cfohrs === 1 ? " hour" : " hours") + " a month",
                   amount: 150 * v.cfohrs, unit: "$150 an hour" });
    }

    var subTotal = sub.reduce(function (a, b) { return a + b.amount; }, 0);
    var useTotal = usage.reduce(function (a, b) { return a + b.amount; }, 0);
    var onceTotal = once.reduce(function (a, b) { return a + b.amount; }, 0);
    var yearTotal = yearly.reduce(function (a, b) { return a + b.amount; }, 0);
    var filedTotal = filed.reduce(function (a, b) { return a + b.amount; }, 0);
    var annual = v.billing === "annual";
    var discount = annual ? subTotal * ANNUAL_OFF : 0;

    return {
      key: key, plan: plan, sub: sub, usage: usage, once: once, yearly: yearly, filed: filed,
      annual: annual, discount: discount,
      monthly: subTotal - discount + useTotal,
      perYear: (subTotal - discount) * 12,
      onceTotal: onceTotal, yearTotal: yearTotal, filedTotal: filedTotal,
      scoped: !plan.fixed
    };
  }


  // ------------------------------------------------- fee comparison
  // Answers "what do I save?" rather than "which plan am I on?". Tax is
  // counted on both sides, including where ours is the dearer line.
  var FC_PLANS = {
    essentials: { name: "Essentials", fee: 199,  federal: 1000 },
    startup:    { name: "Startup",    fee: 450,  federal: 1500 },
    growing:    { name: "Growing",    fee: 1000, federal: 2500 }
  };

  function fcNum(id) {
    var el = $(id);
    if (!el) return 0;
    var n = parseFloat(el.value);
    return (isFinite(n) && n > 0) ? n : 0;
  }

  function renderCompare(annual) {
    if (!$("fc-form")) return;
    var picked = document.querySelector('[name="fc-plan"]:checked');
    var plan = FC_PLANS[picked ? picked.value : "startup"];

    var theirsYear = (fcNum("fc-book") + fcNum("fc-ops") + fcNum("fc-cfo")) * 12
                     + fcNum("fc-tax");
    var ourMonthly = annual ? plan.fee * (1 - ANNUAL_OFF) : plan.fee;
    var oursYear = ourMonthly * 12 + plan.federal;
    var diff = theirsYear - oursYear;
    var pct = theirsYear > 0 ? Math.round(Math.abs(diff) / theirsYear * 100) : 0;

    $("fc-now").textContent = money(theirsYear);
    $("fc-ours").textContent = money(oursYear);
    $("fc-now-mo").textContent = money(theirsYear / 12) + " a month";
    $("fc-ours-mo").textContent = money(oursYear / 12) + " a month"
                                 + (annual ? ", billed annually" : "");

    var head = $("fc-headline"), sub = $("fc-sub"), note = $("fc-note");
    if (theirsYear === 0) {
      head.textContent = "Add what you pay";
      sub.textContent = "Fill in a figure or two above and the comparison appears here.";
      $("fc-diff").textContent = "\u2014";
      note.hidden = true;
      return;
    }
    if (diff > 0) {
      head.textContent = "You would save " + money(diff);
      sub.textContent = pct + " percent lower a year, on the scope you have described.";
      $("fc-diff").textContent = "\u2212" + money(diff);
    } else if (diff < 0) {
      head.textContent = money(-diff) + " more a year";
      sub.textContent = "On these figures we are the dearer option for this scope.";
      $("fc-diff").textContent = "+" + money(-diff);
    } else {
      head.textContent = "Line ball";
      sub.textContent = "On these figures the two come out the same.";
      $("fc-diff").textContent = money(0);
    }
    note.hidden = false;
    note.innerHTML = annual
      ? "Includes the 20% annual payment discount on the CFOLogic subscription."
      : "Switch to annual payment at the top of the page and this gap widens by 20% of our subscription.";
  }

  // ----------------------------------------------------------------- render
  function line(label, amount, muted, from, quoted, unit) {
    return '<div class="pc-line' + (muted ? " pc-line-muted" : "") + '">' +
           '<span>' + label +
           (unit ? '<em class="pc-unit">' + unit + '</em>' : "") +
           '</span><span>' +
           (quoted ? "Quoted" : (from ? "from " : "") + money(amount)) + '</span></div>';
  }

  function render() {
    var v = readInputs();
    if (!v) return;
    var r = estimate(v);

    // seed / standard extras visibility
    var groups = document.querySelectorAll("[data-pc-family]");
    for (var i = 0; i < groups.length; i++) {
      groups[i].hidden = groups[i].getAttribute("data-pc-family") !== r.plan.family;
    }

    $("pc-plan-name").textContent = r.plan.name;
    $("pc-plan-note").textContent = r.plan.note;

    var head, big, sublabel;
    if (r.plan.fee === null) {
      big = "Custom";
      sublabel = "Scoped with you, then fixed for the year.";
    } else {
      big = (r.scoped ? LEAD.replace("%s", "Starting at") : "") +
            money(r.monthly) + '<span class="pc-per">/month</span>';
      sublabel = r.annual
        ? "Billed annually. " + money(r.perYear) + " a year for the subscription."
        : "Billed monthly. Switch to annual and take 20% off the subscription.";
    }
    $("pc-total").innerHTML = big;
    $("pc-total-note").textContent = sublabel;

    head = "";
    r.sub.forEach(function (x) { head += line(x.label, x.amount, false, x.from); });
    if (r.discount > 0) {
      head += '<div class="pc-line pc-line-save"><span>Annual payment, 20% off subscription</span>' +
              '<span>−' + money(r.discount) + '</span></div>';
    }
    r.usage.forEach(function (x) { head += line(x.label, x.amount, false, false); });
    $("pc-breakdown").innerHTML = head ||
      '<div class="pc-line pc-line-muted"><span>Scoped on a call</span><span>&mdash;</span></div>';

    var ol = "";
    r.once.forEach(function (x) {
      ol += line(x.label, x.amount, false, x.from, x.quoted, x.unit);
    });
    $("pc-once").innerHTML = ol;
    $("pc-once-wrap").hidden = r.once.length === 0;
    $("pc-once-total").textContent = money(r.onceTotal);

    var yl = "";
    r.yearly.forEach(function (x) {
      yl += line(x.label, x.amount, false, x.from, x.quoted, x.unit);
    });
    $("pc-year").innerHTML = yl;
    $("pc-year-wrap").hidden = r.yearly.length === 0;
    $("pc-year-total").textContent = money(r.yearTotal);

    var fl = "";
    r.filed.forEach(function (x) {
      fl += line(x.label, x.amount, false, x.from, x.quoted, x.unit);
    });
    $("pc-filed").innerHTML = fl;
    $("pc-filed-wrap").hidden = r.filed.length === 0;
    $("pc-filed-total").textContent = money(r.filedTotal);

    $("pc-scoped").hidden = !r.scoped;

    // the plan cards follow the same billing switch
    var prices = document.querySelectorAll("[data-mo]");
    for (var j = 0; j < prices.length; j++) {
      var el = prices[j];
      var mo = parseInt(el.getAttribute("data-mo"), 10);
      var shown = r.annual ? Math.round(mo * (1 - ANNUAL_OFF)) : mo;
      var pre = el.getAttribute("data-prefix");
      el.innerHTML = (pre ? LEAD.replace("%s", pre) : "") +
        "$" + shown.toLocaleString("en-US") +
        '<span style="font-size:16px;font-weight:400">/mo</span>';
      var sub = el.parentNode.querySelector("[data-mo-sub]");
      if (sub) {
        sub.textContent = r.annual
          ? "Billed annually at " + money(mo * 12 * (1 - ANNUAL_OFF)) + " a year"
          : "Billed monthly";
      }
    }

    renderCompare(r.annual);

    var ro = $("pc-st-readout");
    if (ro) {
      var n = v.ststates * (FREQ[v.stfreq] || 4);
      ro.textContent = n === 0 ? "No sales tax returns."
        : "That is " + n + (n === 1 ? " return" : " returns") + " a year, from $"
          + (100 * n).toLocaleString("en-US") + ".";
    }

    // live value read-outs on the sliders and steppers
    var outs = document.querySelectorAll("[data-pc-out]");
    for (var k = 0; k < outs.length; k++) {
      var src = $(outs[k].getAttribute("data-pc-out"));
      if (!src) continue;
      var val = parseInt(src.value, 10);
      var cap = outs[k].getAttribute("data-pc-cap");
      outs[k].textContent = (cap && val >= parseInt(cap, 10)) ? val + "+" : String(val);
    }
  }

  function step(id, by, min, max) {
    var el = $(id);
    if (!el) return;
    var n = (parseInt(el.value, 10) || 0) + by;
    el.value = Math.max(min, Math.min(max, n));
    render();
  }

  function init() {
    var cmp = $("fc-form");
    if (cmp) {
      cmp.addEventListener("input", function () { render(); });
      cmp.addEventListener("change", function () { render(); });
    }
    var form = $("pc-form");
    if (!form) return;
    form.addEventListener("input", render);
    form.addEventListener("change", render);
    form.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-pc-step]") : null;
      if (!b) return;
      e.preventDefault();
      var parts = b.getAttribute("data-pc-step").split(",");
      step(parts[0], parseInt(parts[1], 10), parseInt(parts[2], 10), parseInt(parts[3], 10));
    });
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
