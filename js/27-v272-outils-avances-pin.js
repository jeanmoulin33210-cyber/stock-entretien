/* V272 — Code PIN obligatoire à chaque ouverture des Outils avancés */
(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }
  var details=null, modal=null, input=null, error=null, confirmBtn=null, cancelBtn=null;
  var opening=false;

  function closeModal(){
    if(modal)modal.classList.remove('show');
    if(input)input.value='';
    if(error)error.textContent='';
    opening=false;
  }

  function openModal(){
    if(!modal)return;
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
      closeModal();
      if(details){
        details.open=true;
        details.dataset.pinOpened='1';
      }
    }catch(e){
      if(error)error.textContent='Impossible de vérifier le code PIN.';
    }finally{
      if(confirmBtn){
        confirmBtn.disabled=false;
        confirmBtn.textContent='Ouvrir les outils';
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

    openModal();
  }

  function bind(){
    details=$('advancedTools');
    modal=$('advancedToolsPinModalV272');
    input=$('advancedToolsPinInputV272');
    error=$('advancedToolsPinErrorV272');
    confirmBtn=$('advancedToolsPinConfirmV272');
    cancelBtn=$('advancedToolsPinCancelV272');

    if(!details||!modal||details.dataset.pinGuardBound==='1')return;
    details.dataset.pinGuardBound='1';

    var summary=details.querySelector('summary');
    if(summary)summary.addEventListener('click',requestOpen,true);

    if(confirmBtn)confirmBtn.addEventListener('click',validatePin);
    if(cancelBtn)cancelBtn.addEventListener('click',closeModal);
    if(input)input.addEventListener('keydown',function(e){
      if(e.key==='Enter'){e.preventDefault();validatePin();}
      if(e.key==='Escape'){e.preventDefault();closeModal();}
    });
    modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
  setTimeout(bind,500);
})();
