(function(){
  try{
    var q=new URLSearchParams(location.search);
    var wanted=q.get('tester') ? ('tester:'+String(Math.max(1,Number(q.get('tester'))||1))) : ((q.get('adminToken')||q.get('ownerToken')) ? 'admin' : '');
    if(!wanted)return;
    var last=localStorage.getItem('jm_tc_last_requested_role_v199')||'';
    if(last!==wanted){
      var remove=[];
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i)||'';
        if(k.indexOf('jm-tc-auth-')===0)remove.push(k);
        if(/^sb-.*-auth-token$/.test(k))remove.push(k);
      }
      for(var j=0;j<remove.length;j++)localStorage.removeItem(remove[j]);
      localStorage.removeItem('jm_test_culinaire_access_v20');
      localStorage.setItem('jm_tc_last_requested_role_v199',wanted);
    }
    window.__JM_REQUESTED_ROLE_V199=wanted;
  }catch(e){}
})();
