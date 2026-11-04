'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/01-v199-role-bootstrap.js'),'utf8');

function storage(seed={}){
  const map=new Map(Object.entries(seed));
  return {
    get length(){return map.size},
    key(i){return [...map.keys()][i]??null},
    getItem(k){return map.has(String(k))?map.get(String(k)):null},
    setItem(k,v){map.set(String(k),String(v))},
    removeItem(k){map.delete(String(k))},
    clear(){map.clear()},
    snapshot:()=>Object.fromEntries(map)
  };
}
function boot(search,shared,tab=storage()){
  const win={location:{search},localStorage:shared,sessionStorage:tab};
  vm.runInNewContext(source,{window:win,URLSearchParams}, {filename:'01-v199-role-bootstrap.js'});
  return win;
}

test('tester QR opened in a second browser tab never erases school authentication or the saved school work',()=>{
  const preserved={
    'jm-school-trial-auth-v452':'school-token',
    'jm-tc-auth-existing':'owner-token',
    'sb-other-auth-token':'other-token',
    'jm_tc_account_v385':'{"schoolMode":true}',
    'jm_test_culinaire_param_v2':'{"config":{"lotName":"Lot initial"}}',
    'jm_tc_prepared_jurys_v97':'[{"name":"Lot initial"}]',
    'jm_test_culinaire_access_v20':'admin-access',
    'jm_tc_last_requested_role_v199':'admin'
  };
  const shared=storage(preserved);
  const teacher=boot('',shared);
  assert.equal(teacher.localStorage,shared);
  const tester=boot('?session=school-session&tester=1&accessCode=secret',shared);
  assert.equal(tester.__JM_TESTER_TAB_ISOLATED_V588,true);
  assert.equal(tester.__JM_REQUESTED_ROLE_V199,'tester:1');
  assert.notEqual(tester.localStorage,shared);
  assert.equal(tester.localStorage.getItem('jm_tc_account_v385'),null);
  assert.equal(tester.localStorage.getItem('jm_test_culinaire_param_v2'),null);
  tester.localStorage.setItem('jm_test_culinaire_param_v2','{"config":{"lotName":"Demo testeur"}}');
  tester.localStorage.setItem('jm_test_culinaire_access_v20','new-tester-access');
  tester.localStorage.setItem('jm-tc-auth-any','anonymous-tester-token');
  tester.localStorage.clear();
  assert.deepEqual(shared.snapshot(),preserved);
  assert.equal(teacher.localStorage.getItem('jm_tc_prepared_jurys_v97'),'[{"name":"Lot initial"}]');
});

test('each tester and each QR session get separate storage; reload in the same tab keeps tester answers',()=>{
  const shared=storage({'jm_test_culinaire_param_v2':'real-school-lot'});
  const tab=storage();
  const t1=boot('?session=school-session&tester=1',shared,tab);
  t1.localStorage.setItem('jm_test_culinaire_param_v2','tester-one');
  const t1reloaded=boot('?session=school-session&tester=1',shared,tab);
  assert.equal(t1reloaded.localStorage.getItem('jm_test_culinaire_param_v2'),'tester-one');
  const t2=boot('?session=school-session&tester=2',shared,tab);
  assert.equal(t2.localStorage.getItem('jm_test_culinaire_param_v2'),null);
  t2.localStorage.setItem('jm_test_culinaire_param_v2','tester-two');
  const anotherJury=boot('?session=other-session&tester=1',shared,tab);
  assert.equal(anotherJury.localStorage.getItem('jm_test_culinaire_param_v2'),null);
  assert.equal(t1reloaded.localStorage.getItem('jm_test_culinaire_param_v2'),'tester-one');
  assert.equal(shared.getItem('jm_test_culinaire_param_v2'),'real-school-lot');
});

test('administrator links and establishment iframe continue using their original storage without deleting identities',()=>{
  const shared=storage({'jm-school-trial-auth-v452':'school','jm-tc-auth-other':'owner','sb-other-auth-token':'other','jm_tc_last_requested_role_v199':'tester:2'});
  const admin=boot('?adminToken=code',shared);
  assert.equal(admin.localStorage,shared);
  assert.equal(admin.__JM_REQUESTED_ROLE_V199,'admin');
  const iframe=boot('',shared);
  assert.equal(iframe.localStorage,shared);
  assert.equal(shared.getItem('jm-tc-auth-other'),'owner');
  assert.equal(shared.getItem('sb-other-auth-token'),'other');
  assert.equal(shared.getItem('jm_tc_last_requested_role_v199'),'tester:2');
});
