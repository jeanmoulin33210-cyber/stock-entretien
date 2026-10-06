/* V275 — correction impression QR : ne jamais réimprimer les numéros d'articles */
(function(){
  'use strict';
  if(window.__tcPrintQrFixV275)return;
  window.__tcPrintQrFixV275=true;

  function clearPrintModes(){
    document.body.classList.remove('print-articles','print-qr-all','print-single-qr');
    document.querySelectorAll('#qrGrid .qr-card.print-target').forEach(function(card){
      card.classList.remove('print-target');
    });
  }

  function canPrintQr(){
    try{
      return typeof qrCanRender==='function' ? qrCanRender() : true;
    }catch(e){
      return true;
    }
  }

  function safePrintAllQr(){
    if(!canPrintQr()){
      alert('Préparez d’abord les accès des testeurs.');
      return;
    }
    clearPrintModes();
    document.body.classList.add('print-qr-all');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        setTimeout(function(){
          try{window.print();}
          catch(e){alert('Impossible d’ouvrir l’impression sur cet appareil.');}
        },150);
      });
    });
  }

  function safePrintSingleQr(i){
    if(!canPrintQr()){
      alert('Préparez d’abord les accès des testeurs.');
      return;
    }
    var card=document.querySelector('[data-qr-card="'+String(i)+'"]');
    if(!card){
      alert('La carte QR du testeur est introuvable.');
      return;
    }
    clearPrintModes();
    document.body.classList.add('print-single-qr');
    card.classList.add('print-target');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        setTimeout(function(){
          try{window.print();}
          catch(e){alert('Impossible d’ouvrir l’impression sur cet appareil.');}
        },150);
      });
    });
  }

  // Remplace les fonctions globales utilisées par la vue QR.
  window.printQrCards=safePrintAllQr;
  window.printSingleQrCard=safePrintSingleQr;

  function bind(){
    var all=document.getElementById('qrPrintBtn');
    if(all)all.onclick=safePrintAllQr;

    document.querySelectorAll('[data-qr-pdf]').forEach(function(btn){
      btn.onclick=function(){
        safePrintSingleQr(Number(btn.dataset.qrPdf));
      };
    });
  }

  // Après fermeture de l'aperçu d'impression, aucun ancien mode ne reste actif.
  window.addEventListener('afterprint',function(){
    clearPrintModes();
    setTimeout(bind,0);
  });

  // Rebranche les boutons quand la vue QR vient d'être rendue.
  var oldRender=window.renderQrCodes;
  if(typeof oldRender==='function'){
    window.renderQrCodes=function(returnView){
      clearPrintModes();
      var out=oldRender(returnView);
      setTimeout(bind,0);
      return out;
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
  setTimeout(bind,700);
})();