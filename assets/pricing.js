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
    essentials: { name: "Essentials", fee: 300,  fixed: false, federal: 1000, family: "standard",
                  note: "Books and statements. No payroll, AR or AP." },
    startup:    { name: "Startup",    fee: 600,  fixed: false, federal: 1500, family: "standard",
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
      accounts: n("pc-accounts"),
      payroll:  g("pc-payroll") || "none",
      heads:    n("pc-heads"),
      ar:       $("pc-ar") && $("pc-ar").checked,
      ap:       $("pc-ap") && $("pc-ap").checked,
      entities: n("pc-entities"),
      // seed extras
      nav:      $("pc-nav") && $("pc-nav").checked,
      catchup:  n("pc-catchup"),
      inctax:   $("pc-inctax") && $("pc-inctax").checked,
      salestax: n("pc-salestax"),
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
    } else if (v.txn > 100 || (v.payroll !== "none" && v.heads > 5)) {
      key = "growing";
    } else if (v.txn > 30 || v.payroll !== "none" || v.ar || v.ap || v.accounts > 4) {
      key = "startup";
    } else {
      key = "essentials";
    }

    var simple = !v.ar && !v.ap && v.payroll === "none" && v.entities === 1;
    if (simple) {
      if (v.revenue === "u250" && v.txn <= 30 && v.accounts <= 2) {
        key = "seed";
      } else if ((v.revenue === "u250" || v.revenue === "u500") &&
                 v.txn <= 75 && v.accounts <= 3) {
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
    var once = [];     // one-time or annual

    if (plan.fee !== null) {
      sub.push({ label: plan.name + " plan", amount: plan.fee });
    }

    if (plan.family === "seed") {
      if (v.nav) sub.push({ label: "CEO Navigator™ Basic", amount: 99 });
      if (v.inctax) sub.push({ label: "Income tax support", amount: 100, from: true });
      if (v.payroll !== "none" && v.heads > 0) {
        usage.push({ label: "Payroll, " + v.heads + (v.heads === 1 ? " employee" : " employees"),
                     amount: 49 * v.heads, unit: "$49 per employee, per payrun" });
      }
      if (v.catchup > 0) {
        once.push({ label: "Catch-up bookkeeping, " + v.catchup +
                           (v.catchup === 1 ? " month" : " months"),
                    amount: 49 * v.catchup });
      }
      once.push({ label: "One-time setup", amount: 199 });
      if (v.salestax > 0) {
        once.push({ label: "Sales tax, " + v.salestax +
                           (v.salestax === 1 ? " filing" : " filings") + " a year",
                    amount: 100 * v.salestax, from: true });
      }
    } else {
      if (v.states > 0) {
        once.push({ label: "State filings, " + v.states +
                           (v.states === 1 ? " state" : " states"),
                    amount: 300 * v.states });
      }
      if (v.federal === "yes" && plan.federal) {
        once.push({ label: "Federal return, " + plan.name, amount: plan.federal });
      } else if (v.federal === "yes") {
        once.push({ label: "Federal return", amount: 0, quoted: true });
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
    var annual = v.billing === "annual";
    var discount = annual ? subTotal * ANNUAL_OFF : 0;

    return {
      key: key, plan: plan, sub: sub, usage: usage, once: once,
      annual: annual, discount: discount,
      monthly: subTotal - discount + useTotal,
      perYear: (subTotal - discount) * 12,
      onceTotal: onceTotal,
      scoped: !plan.fixed
    };
  }

  // ----------------------------------------------------------------- render
  function line(label, amount, muted, from, quoted) {
    return '<div class="pc-line' + (muted ? " pc-line-muted" : "") + '">' +
           '<span>' + label + '</span><span>' +
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
    // payroll headcount only matters when payroll is on
    var heads = $("pc-heads-wrap");
    if (heads) heads.hidden = v.payroll === "none";

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
    r.once.forEach(function (x) { ol += line(x.label, x.amount, false, x.from, x.quoted); });
    $("pc-once").innerHTML = ol;
    $("pc-once-wrap").hidden = r.once.length === 0;
    $("pc-once-total").textContent = money(r.onceTotal);

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
