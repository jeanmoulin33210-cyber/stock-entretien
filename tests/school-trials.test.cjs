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
 assert.equal((source.match(/from\('jury_school_trials'\)/g)||[]).length,4);
 assert.ok(source.includes(".eq('revision',expected)"));
});

test('school trial saves and returns home without claiming phones are ready; real jury still requires phones',()=>{
 const source=fs.readFileSync(path.join(dir,'05-application-principale.js'),'utf8');
 const body=source.slice(source.indexOf('function applyDraft(){'),source.indexOf('\nfunction startTesterPreview()'));
 for(const trial of [true,false]){
  const cfg={testerNames:['Testeur 1'],testerCount:1,products:[{id:'p1',samples:[{id:'1',supplier:'A'}]}]};
  const calls={save:0,upsert:0,home:0,config:0,alerts:[]};
  const ctx={window:{__JURY_SCHOOL_TRIAL_ACTIVE:trial},state:{config:cfg,testers:{}},draftConfig:structuredClone(cfg),
   preparationLockedV347:()=>false,syncTopDraft:()=>{},$:()=>({value:'1',scrollIntoView(){}}),validateDraft:()=>null,
   deepClone:structuredClone,validKeys:()=>new Set(),uid:()=> 'prepared-1',
   makeInitialState:config=>({config,testers:{1:{answers:{}}}}),
   saveState:()=>calls.save++,upsertPreparedJury:()=>calls.upsert++,
   localStorage:{setItem(){}},STORAGE_KEY:'state',phoneSharePrepared:()=>false,
   renderHome:()=>calls.home++,renderConfig:()=>calls.config++,toast:()=>{},
   setTimeout:f=>f(),alert:m=>calls.alerts.push(m)};
  vm.createContext(ctx);vm.runInContext(body+';applyDraft();',ctx);
  assert.equal(calls.save,1);assert.equal(calls.upsert,1);
  assert.equal(calls.home,trial?1:0);assert.equal(calls.config,trial?0:1);
  assert.equal(calls.alerts.length,trial?0:1);
  assert.equal(ctx.state.config._shareSessionId,undefined);
 }
});

test('school payload merge preserves independent changes and distinct new lots',()=>{
 const key='jm_test_culinaire_param_v2',history='jm_test_culinaire_sample_lot_history_v178';
 const b={[key]:JSON.stringify({config:{lotName:'Lot 13',testerCount:1,products:[{id:'p1',name:'Carottes'}]},testers:{}}),[history]:'[]'};
 const l=JSON.parse(JSON.stringify(b)),r=JSON.parse(JSON.stringify(b));
 const lc=JSON.parse(l[key]);lc.config.testerCount=2;l[key]=JSON.stringify(lc);
 const rc=JSON.parse(r[key]);rc.config.products[0].name='Carottes bio';r[key]=JSON.stringify(rc);
 l[history]=JSON.stringify([{id:'local',lotName:'Lot 14'}]);r[history]=JSON.stringify([{id:'remote',lotName:'Lot 15'}]);
 const merged=api.mergeSchoolPayload(b,l,r),state=JSON.parse(merged[key]);
 assert.equal(state.config.testerCount,2);assert.equal(state.config.products[0].name,'Carottes bio');
 assert.deepEqual(new Set(JSON.parse(merged[history]).map(x=>x.id)),new Set(['local','remote']));
 rc.config.testerCount=3;r[key]=JSON.stringify(rc);
 assert.throws(()=>api.mergeSchoolPayload(b,l,r),/même information/);
 assert.equal(JSON.parse(l[key]).config.testerCount,2);
});
test('school merge never revives a record deleted on the other device',()=>{
 const k='jm_test_culinaire_prepared_v97',row={id:'one',state:{config:{lotName:'Lot 13'}}};
 const base={[k]:JSON.stringify([row])};
 assert.deepEqual(JSON.parse(api.mergeSchoolPayload(base,base,{[k]:'[]'})[k]),[]);
 const local={[k]:JSON.stringify([{...row,state:{config:{lotName:'Edited'}}}])};
 assert.throws(()=>api.mergeSchoolPayload(base,local,{[k]:'[]'}),/même information/);
 assert.throws(()=>api.mergeSchoolPayload(null,local,base),/même information/);
});
test('stale school revision rebases and retries without losing either device edits',async()=>{
 const key='jm_test_culinaire_param_v2',base={[key]:JSON.stringify({config:{testerCount:1,lotName:'Lot 13'},testers:{}})};
 let server={school:'S1',enabled:true,revision:2,payload:{[key]:JSON.stringify({config:{testerCount:1,lotName:'Lot 13 serveur'},testers:{}})}},writes=0;
 const client={from:()=>{let update,revision;return {
  update(value){update=value;return this},select(){return this},eq(k,v){if(k==='revision')revision=v;return this},
  async maybeSingle(){if(!update)return {data:JSON.parse(JSON.stringify(server))};writes++;
    if(revision!==server.revision)return {data:null};
    server={...server,...update};return {data:{school:'S1',revision:server.revision}};}
 };}};
 const local=new Map(),document={readyState:'loading',addEventListener(){},getElementById:()=>({style:{}})};
 const root={JuryAccountV385:{client,email:'jury-test1@mailo.com'},addEventListener(){}};
 const ctx={window:root,document,localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},setTimeout:()=>1,clearTimeout(){},console,Date};
 let source=fs.readFileSync(path.join(dir,'40-school-trial.js'),'utf8').replace('root.JurySchoolTrialV452=API;','root.JurySchoolTrialV452=API;API.__test={queue,saveNow,setRows:r=>rows=r};');
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const test= root.JurySchoolTrialV452.__test;
 test.setRows([{school:'S1',enabled:true,revision:1,payload:base}]);
 const edit={[key]:JSON.stringify({config:{testerCount:2,lotName:'Lot 13'},testers:{}})};
 await test.queue('S1',edit);await test.saveNow();
 assert.equal(writes,2);assert.equal(server.revision,3);
 const result=JSON.parse(server.payload[key]);assert.equal(result.config.testerCount,2);assert.equal(result.config.lotName,'Lot 13 serveur');
 // The iframe still has its own pre-merge snapshot. A later unrelated edit must retain server fields.
 const next=JSON.parse(edit[key]);next.config.testerCount=3;
 await test.queue('S1',{[key]:JSON.stringify(next)});await test.saveNow();
 assert.equal(JSON.parse(server.payload[key]).config.lotName,'Lot 13 serveur');
 assert.equal(JSON.parse(server.payload[key]).config.testerCount,3);
});

test('an older pending copy without a merge base is retained for recovery',()=>{
 const key='jm_test_culinaire_param_v2',localPayload={[key]:JSON.stringify({config:{testerCount:2}})},remotePayload={[key]:JSON.stringify({config:{testerCount:3}})};
 const saved={revision:1,payload:localPayload},root={JuryAccountV385:{email:'jury-test1@mailo.com'},addEventListener(){}};
 const ctx={window:root,document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(saved)},console};
 const source=fs.readFileSync(path.join(dir,'40-school-trial.js'),'utf8').replace('root.JurySchoolTrialV452=API;','root.JurySchoolTrialV452=API;API.__test={payloadFor};');
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const row={school:'S1',revision:2,payload:remotePayload};
 assert.equal(JSON.stringify(root.JurySchoolTrialV452.__test.payloadFor(row)),JSON.stringify(localPayload));
 assert.equal(JSON.stringify(row.recovery.payload),JSON.stringify(localPayload));
 assert.equal(JSON.stringify(row.payload),JSON.stringify(remotePayload));
});
