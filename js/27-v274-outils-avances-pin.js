/* V272 — Code PIN obligatoire à chaque ouverture des Outils avancés */
(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }
  var details=null, modal=null, input=null, error=null, confirmBtn=null, cancelBtn=null, resultsDetailsBtn=null;
  var opening=false;
  var pendingAction=null;
  var pendingMode='advanced';

  function setModalCopy(mode){
    if(!modal)return;
    var h=modal.querySelector('h3');
    var p=modal.querySelector('p');
    pendingMode=mode||'advanced';
    if(pendingMode==='results-details'){
      if(h)h.textContent='Détails protégés';
      if(p)p.textContent='Saisissez votre code PIN pour afficher les détails des résultats.';
      if(confirmBtn)confirmBtn.textContent='Ouvrir les détails';
    }else{
      if(h)h.textContent='Outils avancés protégés';
      if(p)p.textContent='Saisissez votre code PIN pour ouvrir les outils avancés.';
      if(confirmBtn)confirmBtn.textContent='Ouvrir les outils';
    }
  }

  function closeModal(){
    if(modal)modal.classList.remove('show');
    if(input)input.value='';
    if(error)error.textContent='';
    opening=false;
    pendingAction=null;
    pendingMode='advanced';
  }

  function openModal(mode,action){
    if(!modal)return;
    pendingAction=typeof action==='function'?action:null;
    setModalCopy(mode);
    if(input)input.value='';
    if(error)error.textContent='';
    modal.classList.add('show');
    opening=true;
    setTimeout(function(){ try{input&&input.focus();}catch(e){} },60);
  }

  async function validatePin(){
    var pin=String(input&&input.value||'').trim();
    if(!/^\d{4,8}$/.test(pin)){
      if(error)error.textContent='Saisissez votre code PIN (4 à 8 chiffres).';
      if(input)input.focus();
      return;
    }
    if(confirmBtn){
      confirmBtn.disabled=true;
      confirmBtn.textContent='Vérification…';
    }
    try{
      var ok=(typeof verifyPin==='function') ? await verifyPin(pin) : false;
      if(!ok){
        if(error)error.textContent='Code PIN incorrect.';
        if(input){input.value='';input.focus();}
        return;
      }
      var action=pendingAction;
      var mode=pendingMode;
      closeModal();
      if(action){
        action();
      }else if(mode==='advanced'&&details){
        details.open=true;
        details.dataset.pinOpened='1';
      }
    }catch(e){
      if(error)error.textContent='Impossible de vérifier le code PIN.';
    }finally{
      if(confirmBtn){
        confirmBtn.disabled=false;
        setModalCopy(pendingMode);
      }
    }
  }

  function requestOpen(e){
    if(!details)return;

    /* La fermeture reste immédiate. Le PIN n'est demandé qu'à l'ouverture. */
    if(details.open){
      return;
    }

    e.preventDefault();

    if(typeof securityEnabled!=='function' || !securityEnabled()){
      alert('Activez d’abord un code PIN dans « Sécurité administrateur » pour protéger les Outils avancés.');
      try{
        if(typeof openSecurityModal==='function')openSecurityModal();
      }catch(_){}
      return;
    }

    openModal('advanced',function(){
      if(details){
        details.open=true;
        details.dataset.pinOpened='1';
      }
    });
  }

  function requestResultsDetailsOpen(e){
    var view=document.getElementById('adminView');
    if(!view)return;

    /* La fermeture des détails reste immédiate et ne redemande pas le PIN. */
    if(view.classList.contains('show-results-details'))return;

    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();

    if(typeof securityEnabled!=='function' || !securityEnabled()){
      alert('Activez d’abord un code PIN dans « Sécurité administrateur » pour protéger Détails.');
      try{
        if(typeof openSecurityModal==='function')openSecurityModal();
      }catch(_){}
      return;
    }

    openModal('results-details',function(){
      if(typeof toggleSimpleResultsDetails==='function'){
        toggleSimpleResultsDetails();
      }
    });
  }

  function bind(){
    details=$('advancedTools');
    modal=$('advancedToolsPinModalV272');
    input=$('advancedToolsPinInputV272');
    error=$('advancedToolsPinErrorV272');
    confirmBtn=$('advancedToolsPinConfirmV272');
    cancelBtn=$('advancedToolsPinCancelV272');
    resultsDetailsBtn=$('simpleResultsMoreBtn');

    if(!modal)return;

    if(details&&details.dataset.pinGuardBound!=='1'){
      details.dataset.pinGuardBound='1';
      var summary=details.querySelector('summary');
      if(summary)summary.addEventListener('click',requestOpen,true);
    }

    if(resultsDetailsBtn&&resultsDetailsBtn.dataset.pinGuardBound!=='1'){
      resultsDetailsBtn.dataset.pinGuardBound='1';
      resultsDetailsBtn.addEventListener('click',requestResultsDetailsOpen,true);
    }

    if(confirmBtn&&!confirmBtn.dataset.pinGuardBound){
      confirmBtn.dataset.pinGuardBound='1';
      confirmBtn.addEventListener('click',validatePin);
    }
    if(cancelBtn&&!cancelBtn.dataset.pinGuardBound){
      cancelBtn.dataset.pinGuardBound='1';
      cancelBtn.addEventListener('click',closeModal);
    }
    if(input&&!input.dataset.pinGuardBound){
      input.dataset.pinGuardBound='1';
      input.addEventListener('keydown',function(e){
        if(e.key==='Enter'){e.preventDefault();validatePin();}
        if(e.key==='Escape'){e.preventDefault();closeModal();}
      });
    }
    if(!modal.dataset.pinGuardBound){
      modal.dataset.pinGuardBound='1';
      modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
  setTimeout(bind,500);
})();
