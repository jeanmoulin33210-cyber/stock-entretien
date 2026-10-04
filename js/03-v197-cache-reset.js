(function(){
  try{
    if('caches' in window){caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k.indexOf('tests-culinaires-')===0 && k!=='tests-culinaires-v197-20261002'}).map(function(k){return caches.delete(k)}));}).catch(function(){});}
  }catch(e){}
})();
