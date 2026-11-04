/* V588 — une page de testeur ne doit jamais modifier la connexion ni les lots
   de l'administrateur ouverts dans un autre onglet du même navigateur. */
(function(root){
  'use strict';

  function isTesterLink(search){
    const q=new URLSearchParams(search||'');
    return /^[1-9][0-9]*$/.test(q.get('tester')||'');
  }

  function testerStorage(tabStorage,namespace){
    const prefix='jm_tc_tester_tab_v588:'+String(namespace)+':';
    const fallback=new Map();
    function read(k){
      k=prefix+String(k);
      if(tabStorage){try{return tabStorage.getItem(k)}catch(e){}}
      return fallback.has(k)?fallback.get(k):null;
    }
    function write(k,v){
      k=prefix+String(k);v=String(v);
      if(tabStorage){try{tabStorage.setItem(k,v);return}catch(e){}}
      fallback.set(k,v);
    }
    function remove(k){
      k=prefix+String(k);
      if(tabStorage){try{tabStorage.removeItem(k)}catch(e){}}
      fallback.delete(k);
    }
    function keys(){
      const found=new Set(fallback.keys());
      if(tabStorage){
        try{for(let i=0;i<tabStorage.length;i++){
          const k=tabStorage.key(i);
          if(k&&k.startsWith(prefix))found.add(k);
        }}catch(e){}
      }
      return Array.from(found).filter(k=>k.startsWith(prefix)).map(k=>k.slice(prefix.length));
    }
    const storage={
      get length(){return keys().length},
      key(i){return keys()[Number(i)]??null},
      getItem:read,setItem:write,removeItem:remove,
      clear(){for(const k of keys())remove(k)}
    };
    return new Proxy(storage,{
      get(target,key){return key in target?Reflect.get(target,key):typeof key==='string'?read(key):undefined},
      set(target,key,value){if(typeof key==='string'){write(key,value);return true}return Reflect.set(target,key,value)}
    });
  }

  if(typeof module==='object'&&module.exports){
    module.exports={isTesterLink,testerStorage};
    return;
  }

  try{
    const q=new URLSearchParams(root.location.search);
    const tester=isTesterLink(root.location.search);
    if(tester){
      /* sessionStorage appartient à cet onglet ; on n'accède jamais au
         localStorage réel qui contient le compte et les jurys de l'école. */
      const session=String(q.get('session')||'sans-session').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90);
      const number=String(q.get('tester'));
      let tab=null;
      try{tab=root.sessionStorage}catch(e){}
      const isolated=testerStorage(tab,session+'-testeur-'+number);
      Object.defineProperty(root,'localStorage',{value:isolated,configurable:true});
      if(root.localStorage!==isolated)throw new Error('Isolation du stockage indisponible.');
      root.__JM_TESTER_TAB_ISOLATED_V588=true;
    }
    const wanted=tester?'tester:'+q.get('tester'):
      (q.get('adminToken')||q.get('ownerToken'))?'admin':'';
    if(wanted)root.__JM_REQUESTED_ROLE_V199=wanted;

    /* Ne plus effacer les identités jm-tc-auth / sb-auth d'autres onglets,
       ni partager une variable "dernier rôle" commune à tout le navigateur. */
  }catch(error){
    if(isTesterLink(root.location.search)){
      root.__JM_TESTER_TAB_ISOLATION_FAILED_V588=true;
      try{root.stop()}catch(e){}
      try{
        root.document.open();
        root.document.write('<!doctype html><html lang="fr"><meta charset="utf-8"><title>Connexion testeur protégée</title><body style="font:16px system-ui;padding:30px"><h2>Connexion testeur protégée</h2><p>Impossible de séparer cet onglet de votre espace administrateur. Aucune donnée du jury n\'a été modifiée.</p><p>Ouvrez ce QR code dans un autre navigateur ou appareil.</p></body></html>');
        root.document.close();
      }catch(e){}
    }
  }
})(typeof window==='undefined'?globalThis:window);
