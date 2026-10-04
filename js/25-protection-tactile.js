(function(){
  'use strict';
  var startX=0, startY=0, moved=false, tracking=false, suppressClickUntil=0;
  var MOVE_TOLERANCE=10; // pixels CSS : un vrai glissement n'est pas un clic
  var SUPPRESS_MS=320;   // bloque uniquement le clic fantôme juste après le glissement

  function point(ev){
    var t=(ev.touches&&ev.touches[0])||(ev.changedTouches&&ev.changedTouches[0]);
    return t ? {x:t.clientX,y:t.clientY} : null;
  }
  function interactiveTarget(el){
    return el && el.closest ? el.closest('button, a, [role="button"], [onclick]') : null;
  }

  document.addEventListener('touchstart', function(ev){
    if(!interactiveTarget(ev.target)) { tracking=false; moved=false; return; }
    var p=point(ev); if(!p) return;
    startX=p.x; startY=p.y; moved=false; tracking=true;
  }, {passive:true, capture:true});

  document.addEventListener('touchmove', function(ev){
    if(!tracking || moved) return;
    var p=point(ev); if(!p) return;
    var dx=p.x-startX, dy=p.y-startY;
    if(Math.sqrt(dx*dx+dy*dy) > MOVE_TOLERANCE) moved=true;
  }, {passive:true, capture:true});

  document.addEventListener('touchend', function(){
    if(tracking && moved) suppressClickUntil=Date.now()+SUPPRESS_MS;
    tracking=false;
  }, {passive:true, capture:true});

  document.addEventListener('touchcancel', function(){
    tracking=false; moved=false;
  }, {passive:true, capture:true});

  document.addEventListener('click', function(ev){
    if(Date.now() < suppressClickUntil && interactiveTarget(ev.target)){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }
  }, true);
})();
