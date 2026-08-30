// <lead-capture> — slim fixed pill (bottom-left) that expands to a one-field
// email form. Non-intrusive: pill only until clicked, hides after signup.
// Leads POST to formsubmit.co (leads@cfologic.com) + a GA4 generate_lead event.
(function(){
  var EP = 'https://formsubmit.co/ajax/prasad@cfologic.com';
  var KEY = 'cfo-lead-done';
  function C(){ return Reflect.construct(HTMLElement, [], C); }
  C.prototype = Object.create(HTMLElement.prototype);
  C.prototype.connectedCallback = function(){
    if (this._done) return; this._done = true;
    try { if (localStorage.getItem(KEY)) { this.style.display = 'none'; return; } } catch(e){}
    var sh = this.attachShadow({mode:'open'});
    sh.innerHTML = '<style>'
      + ':host{position:fixed;bottom:18px;left:18px;z-index:89;font-family:inherit}'
      + '.pill{display:flex;align-items:center;gap:8px;white-space:nowrap;border:0;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;letter-spacing:0.02em;color:#fff;background:var(--grad-a,linear-gradient(135deg,#0047AB,#0064F1 48%,#378AFF));padding:10px 16px;border-radius:999px;box-shadow:0 6px 20px rgba(0,71,171,0.28)}'
      + '.pill:hover{box-shadow:0 8px 26px rgba(0,71,171,0.4)}'
      + '.pill:focus-visible,.send:focus-visible,.x:focus-visible{outline:2px solid var(--color-accent,#0064F1);outline-offset:2px}'
      + '.card{width:288px;background:rgba(253,253,253,0.6);backdrop-filter:blur(20px) saturate(1.6);-webkit-backdrop-filter:blur(20px) saturate(1.6);border:1px solid var(--color-neutral-200,#e2e6ec);border-radius:16px;box-shadow:0 12px 36px rgba(0,71,171,0.18);padding:18px}'
      + '.t{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}'
      + 'h3{margin:0;font-size:14.5px;font-weight:700;color:var(--color-text,#10151d)}'
      + 'p{margin:5px 0 12px;font-size:12.5px;line-height:1.55;color:var(--color-neutral-700,#4d5a6b)}'
      + '.x{border:0;background:none;cursor:pointer;font-size:16px;line-height:1;color:var(--color-neutral-500,#7c8798);padding:2px}'
      + '.x:hover{color:var(--color-text,#10151d)}'
      + 'form{display:flex;flex-wrap:wrap;gap:8px}'
      + '.q{margin:0 0 10px}'
      + '.ql{display:block;font-size:10.5px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--color-neutral-500,#7c8798);margin:0 0 6px}'
      + '.chips{display:flex;flex-wrap:wrap;gap:6px}'
      + '.chip{border:1px solid var(--color-neutral-300,#c9d0da);background:#fff;color:var(--color-neutral-700,#4d5a6b);font-family:inherit;font-size:12px;font-weight:600;padding:5px 11px;border-radius:999px;cursor:pointer}'
      + '.chip:hover{border-color:var(--color-accent,#0064F1);color:var(--color-accent-700,#0047AB)}'
      + '.chip.on{background:var(--color-accent-100,#EDF4FF);border-color:var(--color-accent,#0064F1);color:var(--color-accent-800,#00378A)}'
      + '.chip:focus-visible{outline:2px solid var(--color-accent,#0064F1);outline-offset:2px}'
      + 'input{flex:1;min-width:0;font-family:inherit;font-size:13px;padding:9px 11px;border:1px solid var(--color-neutral-300,#c9d0da);border-radius:10px;background:#fff;color:var(--color-text,#10151d)}'
      + 'input:focus{outline:2px solid var(--color-accent,#0064F1);outline-offset:1px;border-color:transparent}'
      + '.send{border:0;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;color:#fff;background:var(--grad-a,linear-gradient(135deg,#0047AB,#0064F1 48%,#378AFF));padding:9px 14px;border-radius:10px}'
      + '.send:disabled{opacity:0.55;cursor:default}'
      + '.capin{padding:6px 8px;font-size:13px;border:1px solid var(--color-neutral-300,#c9d0da);border-radius:10px;font-family:inherit;color:var(--color-text,#10151d);background:#fff;text-align:center}'
      + '.capin:focus{outline:2px solid var(--color-accent,#0064F1);outline-offset:1px;border-color:transparent}'
      + '.msg{margin:10px 0 0;font-size:12px}'
      + '</style>'
      + '<button class="pill" type="button"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="0"></rect><path d="m2 7 10 6 10-6"></path></svg>Talk to a CFO</button>';
    var self = this, pill = sh.querySelector('.pill');
    pill.addEventListener('click', function(){
      pill.style.display = 'none';
      var a = 2 + Math.floor(Math.random()*7), b = 2 + Math.floor(Math.random()*7);
      var d = document.createElement('div'); d.className = 'card';
      d.innerHTML = '<div class="t"><h3>Talk to a CFO</h3><button class="x" type="button" aria-label="Close">\u00d7</button></div>'
        + '<p>Leave your email and we\u2019ll come back within one business day. No pitch, no drip sequence.</p>'
        + '<div class="q" data-q="role"><span class="ql">I am a\u2026</span><span class="chips">'
        +   '<button type="button" class="chip">Founder / CEO</button><button type="button" class="chip">CFO / Finance leader</button><button type="button" class="chip">Capital provider</button><button type="button" class="chip">CPA firm</button>'
        + '</span></div>'
        + '<div class="q" data-q="revenue"><span class="ql">Annual revenue / portfolio</span><span class="chips">'
        +   '<button type="button" class="chip">Under $5M</button><button type="button" class="chip">$5\u201325M</button><button type="button" class="chip">$25\u2013100M</button><button type="button" class="chip">$100M+</button>'
        + '</span></div>'
        + '<div class="q" data-q="interest" data-multi><span class="ql">Interested in (pick any)</span><span class="chips">'
        +   '<button type="button" class="chip">Financial operations</button><button type="button" class="chip">FP&A</button><button type="button" class="chip">Fractional CFO</button><button type="button" class="chip">Deal support</button><button type="button" class="chip">Other</button>'
        + '</span></div>'
        + '<form><input type="text" class="stack" placeholder="Biggest bottleneck right now (optional)" aria-label="Biggest bottleneck" style="flex:100%;margin-bottom:8px">'
        + '<input type="text" class="hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">'
        + '<span class="cap" style="display:flex;align-items:center;gap:8px;flex:100%"><span class="ql" style="margin:0">Quick check: '+a+' + '+b+' =</span><input type="text" inputmode="numeric" class="capin" required aria-label="Anti-spam check: '+a+' plus '+b+'" style="flex:0 0 52px"></span>'
        + '<input type="email" required placeholder="you@company.com" aria-label="Work email"><button class="send" type="submit">Send</button></form>';
      d.querySelectorAll('.q').forEach(function(q){
        q.addEventListener('click', function(ev){
          var c = ev.target.closest('.chip'); if (!c) return;
          if (q.hasAttribute('data-multi')) { c.classList.toggle('on'); return; }
          q.querySelectorAll('.chip').forEach(function(x){ x.classList.remove('on'); });
          c.classList.add('on');
        });
      });
      sh.appendChild(d);
      d.querySelector('.x').addEventListener('click', function(){ d.remove(); pill.style.display = 'flex'; });
      var form = d.querySelector('form');
      form.addEventListener('submit', function(ev){
        ev.preventDefault();
        var m = d.querySelector('.msg') || form.parentNode.appendChild(Object.assign(document.createElement('p'), {className:'msg'}));
        if (form.querySelector('.hp').value) return; // honeypot: silently drop bots
        if (parseInt(form.querySelector('.capin').value, 10) !== a + b) {
          m.style.color = '#B42318'; m.textContent = 'That sum isn\u2019t right \u2014 try again.';
          return;
        }
        m.textContent = '';
        var email = form.querySelector('input[type=email]').value, btn = form.querySelector('.send');
        var pick = function(name){ return Array.prototype.map.call(d.querySelectorAll('[data-q="'+name+'"] .chip.on'), function(c){ return c.textContent; }).join(', '); };
        btn.disabled = true; btn.textContent = '\u2026';
        fetch(EP, {method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'},
          body: JSON.stringify({email: email, role: pick('role'), revenue: pick('revenue'), interest: pick('interest'), bottleneck: form.querySelector('.stack').value, page: location.hostname + location.pathname, _subject: 'CFOLogic website lead'})})
        .then(function(r){ if(!r.ok) throw 0; return r.json(); })
        .then(function(){
          try { localStorage.setItem(KEY, '1'); } catch(e){}
          if (window.gtag) gtag('event', 'generate_lead', {method: 'lead_capture'});
          d.innerHTML = '<h3>Thanks \u2014 you\u2019re on the list.</h3><p style="margin-bottom:0">We\u2019ll be in touch shortly.</p>';
          setTimeout(function(){ self.style.display = 'none'; }, 2600);
        })
        .catch(function(){
          btn.disabled = false; btn.textContent = 'Send';
          m.style.color = '#B42318';
          m.textContent = 'Couldn\u2019t send \u2014 email us at hello@cfologic.com';
        });
      });
      d.querySelector('input[type=email]').focus();
    });
  };
  if (!customElements.get('cfo-lead-capture')) customElements.define('cfo-lead-capture', C);
})();
