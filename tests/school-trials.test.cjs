const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const dir=fs.existsSync(path.join(__dirname,'40-school-trial.js'))?__dirname:path.join(__dirname,'../js');
const api=require(path.join(dir,'40-school-trial.js'));
const {memoryStorage}=require(path.join(dir,'00-school-trial-sandbox.js'));
const {allowed,passwordOK}=require(path.join(dir,'41-school-login.js'));
test('each establishment starts with its own lot, without owner credentials',()=>{
 for(let n=1;n<=12;n++){
  const p=api.seed('S'+n);assert.equal(api.validPayload(p),true);
  const meta=JSON.parse(p.jm_test_culinaire_sample_master_meta_v1);assert.equal(meta.lotNumber,String(100+n));
  assert.equal(JSON.stringify(p).includes('ownerToken'),false);
 }
 assert.throws(()=>api.seed('A'));
 assert.equal(api.validPayload({unknown:'value'}),false);
 assert.equal(api.validPayload({jm_test_culinaire_archives_v1:[]}),false);
});
test('isolated storage never shares writes across establishments',()=>{
 const a=memoryStorage(api.seed('S1')),b=memoryStorage(api.seed('S2'));
 a.setItem('jm_test_culinaire_archives_v1','[1]');assert.equal(b.getItem('jm_test_culinaire_archives_v1'),'[]');
 a.clear();assert.ok(b.length>0);
});
test('first activation is restricted to first two addresses and validates passwords',()=>{
 assert.ok(allowed('jury-test1@mailo.com'));assert.ok(allowed('jury-test2@mailo.com'));
 assert.equal(allowed('jury-test12@mailo.com'),false);assert.equal(allowed('other@mailo.com'),false);
 assert.ok(passwordOK('Sample987'));for(const p of ['shortA1','lowercase1','NoNumbers'])assert.equal(passwordOK(p),false);
});
test('all snapshot reads and writes use the isolated account table',()=>{
 const source=fs.readFileSync(path.join(dir,'40-school-trial.js'),'utf8');
 assert.equal(source.includes('jury_demo_workspaces'),false);
 assert.equal((source.match(/from\('jury_school_trials'\)/g)||[]).length,2);
 assert.ok(source.includes(".eq('revision',row.revision)"));
});
