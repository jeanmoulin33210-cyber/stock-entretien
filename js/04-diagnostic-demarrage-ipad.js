(function(){
  var modernOk=true;
  try{
    new Function("var x={a:1}; return x?.a ?? 0;");
  }catch(e){
    modernOk=false;
  }

  window.forceIpadAppRefresh=function(){
    try{
      var base=window.location.href.split('#')[0].split('?')[0];
      window.location.replace(base+'?v=269-ipad-'+(new Date().getTime()));
    }catch(e){
      window.location.reload(true);
    }
  };

  function showDiag(title,msg){
    var box=document.getElementById('ipadStartupDiagnostic');
    var t=document.getElementById('ipadDiagTitle');
    var m=document.getElementById('ipadDiagText');
    if(t)t.innerHTML=title;
    if(m)m.innerHTML=msg;
    if(box)box.style.display='block';
  }

  if(!modernOk){
    window.setTimeout(function(){
      showDiag(
        'Safari / iPadOS trop ancien pour le moteur actuel',
        'La page HTML est bien chargée en v269, mais ce Safari ne comprend pas certaines instructions JavaScript de l’application. Dites-moi la version iPadOS affichée dans Réglages &gt; Général &gt; Informations.'
      );
    },100);
    return;
  }

  window.setTimeout(function(){
    var engineOk=(typeof window.renderHome==='function');
    var badge=document.getElementById('appBuildBadge');
    if(engineOk){
      if(badge){
        badge.innerHTML='v269 · OK';
        badge.style.background='#e6f5ee';
        badge.style.color='#146c4e';
      }
    }else{
      if(badge){
        badge.innerHTML='v269 · moteur arrêté';
        badge.style.background='#fff0d8';
        badge.style.color='#8c5a00';
      }
      showDiag(
        'L’application ne s’est pas démarrée',
        'Le fichier v269 est affiché, mais le moteur JavaScript n’a pas démarré. Sur iPad, essayez d’abord « Forcer l’actualisation iPad ». Si le message revient, dites-moi exactement ce qui est affiché ici.'
      );
    }
  },5000);
})();
