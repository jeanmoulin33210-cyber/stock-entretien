(function(){
  try{
    if('caches' in window){
      caches.keys().then(function(keys){
        return Promise.all(keys.filter(function(k){
          return (
            (k.indexOf('tests-culinaires-')===0 && k!=='tests-culinaires-v335-20261007e') ||
            (k.indexOf('tc-offline-')===0 && k!=='tc-offline-v335-20261007e')
          );
        }).map(function(k){return caches.delete(k)}));
      }).catch(function(){});
    }
  }catch(e){}
})();