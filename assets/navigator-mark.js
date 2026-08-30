// Navigator mark — round blooming-circles brand icon. Colors track the ambient
// theme via CSS vars (--color-accent ramp), so it recolors with the user's theme.
// <navigator-mark> animates; static / static="true" freezes at full bloom;
// static="false" animates — flip the attribute at runtime (e.g. while AI thinks).
(function(){
  var U = 0.70710678, N = 6, DUR = 4, STEPS = [100,200,300,400,500];
  var FB = {100:'#EDF4FF',200:'#D6E6FF',300:'#A0C7FF',400:'#7DB3FF',500:'#5A9FFF',700:'#0047AB'};
  function smooth(e0){ return e0*e0*(3-2*e0); }
  var NavigatorMark = /** @type {any} */ (function(){
    function C(){ return Reflect.construct(HTMLElement, [], C); }
    C.prototype = Object.create(HTMLElement.prototype);
    C.observedAttributes = ['static'];
    C.prototype.connectedCallback = function(){ this._render(); };
    C.prototype.attributeChangedCallback = function(){ if (this.isConnected) this._render(); };
    C.prototype._render = function(){
      var attr = this.getAttribute('static');
      var isStatic = (this.hasAttribute('static') && attr !== 'false') ||
        (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (this._mode === (isStatic ? 's' : 'a')) return;
      this._mode = isStatic ? 's' : 'a';
      var uid = 'nm' + Math.random().toString(36).slice(2,7);
      var css = ':host{display:inline-block;width:1em;height:1em}svg{display:block;width:100%;height:100%;overflow:visible}';
      var layers = '';
      for (var i = 0; i < N; i++) {
        var t = i/(N-1), max = 640 - (640-170)*t, inner = i === N-1;
        var step = STEPS[Math.min(4,i)];
        var fill = inner ? 'url(#'+uid+'-g)' : 'var(--color-accent-'+step+','+FB[step]+')';
        if (isStatic) {
          var e0 = (1+Math.cos(0.3*i))/2, s = 64 + (max-64)*smooth(e0);
          layers += '<circle cx="'+(U*s/2).toFixed(1)+'" cy="'+(-U*s/2).toFixed(1)+'" r="'+(s/2).toFixed(1)+'" fill="'+fill+'"/>';
        } else {
          css += '@keyframes '+uid+'-'+i+'{0%,100%{transform:scale(64)}50%{transform:scale('+max.toFixed(0)+')}}';
          layers += '<g style="animation:'+uid+'-'+i+' '+DUR+'s cubic-bezier(0.37,0,0.63,1) infinite;animation-delay:'+(0.3*i*DUR/(2*Math.PI)-DUR).toFixed(3)+'s"><circle cx="'+(U/2)+'" cy="'+(-U/2)+'" r="0.5" fill="'+fill+'"/></g>';
        }
      }
      var sh = this.shadowRoot || this.attachShadow({mode:'open'});
      sh.innerHTML = '<style>'+css+'</style>' +
        '<svg viewBox="-94 -547 641 641" aria-hidden="true">' +
        '<defs><linearGradient id="'+uid+'-g" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="var(--color-accent-700,'+FB[700]+')"/>' +
        '<stop offset="48%" stop-color="var(--color-accent,#0064F1)"/>' +
        '<stop offset="100%" stop-color="var(--color-accent-500,'+FB[500]+')"/>' +
        '</linearGradient></defs>' + layers + '</svg>';
    };
    return C;
  })();
  if (!customElements.get('navigator-mark')) customElements.define('navigator-mark', NavigatorMark);
})();
