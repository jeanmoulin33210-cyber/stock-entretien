/* --- V162 : verrou global de la vue testeur avant lancement --- */
(function(){
  const previousShowViewV162=showView;
  showView=function(id){
    if(id==='testerView' && !testerPreviewMode && !isJuryClosed() && !isJuryOfficiallyOpen()){
      /* Ne jamais afficher silencieusement une fiche active avant le lancement.
         renderTesterWaitingForLaunch() appelle lui-même showView('testerView'),
         donc on affiche directement la vue brute puis l'écran verrouillé. */
      if(typeof rawShowView==='function') rawShowView('testerView');
      else {
        document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
        document.getElementById('testerView')?.classList.add('active');
      }
      const hero=document.getElementById('sampleHero');if(hero)hero.style.display='none';
      const qs=document.getElementById('questions');if(qs)qs.style.display='none';
      document.querySelectorAll('.sample-actions').forEach(el=>el.style.display='none');
      const vp=document.getElementById('validationPanel');
      if(vp){
        vp.className='panel tester-closed-screen';
        vp.innerHTML='<div class="lock">🔒</div><h2>Accès verrouillé</h2><p>Le jury n’a pas encore été lancé. Aucune fiche de dégustation ne peut être ouverte avant que le responsable ait appuyé sur « Lancer ce jury ».</p><span class="date">Utilisez « Aperçu testeur » uniquement pour vérifier la présentation avant le lancement.</span>';
      }
      if(typeof startTesterLaunchWait==='function')startTesterLaunchWait();
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    return previousShowViewV162(id);
  };
})();
