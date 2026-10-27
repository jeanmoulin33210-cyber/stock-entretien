const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../js/33-owner-sync.js'),source=fs.readFileSync(require('node:path').join(__dirname,'../js/33-owner-sync.js'),'utf8');
const d={config:{_preparedId:'d',lotNumber:'4',lotName:'LOT 4',subtitle:'D',products:[{id:'p',name:'Haricot',samples:[{id:'22'}]}],_shareSessionId:'d-session'},testers:{1:{answers:{p__22:{choices:[10],remarks:['good']}}}}};
assert.ok(core.isLotDRecoveryV389(d.config));assert.ok(!core.isLotDRecoveryV389({...d.config,products:[]}));assert.ok(!core.isLotDRecoveryV389({...d.config,lotNumber:'',lotName:'LOT 40'}));assert.ok(!core.isLotDRecoveryV389({...d.config,_archive:{archivedAt:'now'}}));
assert.throws(()=>core.validateLotDRestoreV389({records:{},resetSessionIds:['d-session']},d),/ancienne/);
assert.throws(()=>core.validateLotDRestoreV389({records:{'prepared:d':{state:d}}},d),/existe/);
const e={state:{config:{lotNumber:'5',products:[{id:'e'}]}}},f={state:{config:{lotNumber:'6',products:[{id:'f'}]}}};
const initial={records:{'prepared:e':e,'prepared:f':f},removed:{'prepared:d':'removed','prepared:other':'removed'}};
const recovered=core.validateLotDRestoreV389(initial,d);assert.deepEqual(recovered.testers,d.testers);assert.equal(recovered.config._preparedId,'d');assert.ok(initial.removed['prepared:d']);
async function restoreCase(mode){
 let updates=0,saves=0,backups=0,storedConfig;
 const data=new Map();const catalog=structuredClone(initial);if(mode==='existing')catalog.records['prepared:d']={state:d};
 const cfg={_ownerCatalogV357:catalog,other:'preserve'};
 const query={select(){return this},eq(){return this},update(value){updates++;storedConfig=value.config;return this},async maybeSingle(){if(storedConfig)return mode==='writeFail'?{error:Error('offline')}:{data:{session_id:'hub'}};return mode==='readFail'?{error:Error('offline')}:{data:{config:cfg,updated_at:'2026-10-27T10:00:00Z'}}}};
 const ctx={API:{},guestTester:null,cloudRole:'admin',busy:false,cloudBusy:false,isLotDRecoveryV389:core.isLotDRecoveryV389,validateLotDRestoreV389:core.validateLotDRestoreV389,id:core.id,clone:core.clone,client:async()=>({from:()=>query}),descriptor:{sessionId:'hub'},loadPreparedJurys:()=>[],verifyRecoveryValueV360:async()=>{backups++},state:{config:{lotName:'F'}},localStorage:{setItem:(k,v)=>data.set(k,v)},read:(k,v)=>data.has(k)?JSON.parse(data.get(k)):v,savePreparedJurys(){saves++},applying:false,status(){}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  API.restoreLotDBackup='),source.indexOf('  API.pauseAccount=')),ctx);
 if(mode==='ok')await ctx.API.restoreLotDBackup(d);else await assert.rejects(()=>ctx.API.restoreLotDBackup(d));
 assert.equal(ctx.busy,false);
 if(mode==='ok'){assert.equal(updates,1);assert.equal(backups,1);assert.equal(saves,1);assert.deepEqual(storedConfig._ownerCatalogV357.records['prepared:e'],e);assert.deepEqual(storedConfig._ownerCatalogV357.records['prepared:f'],f);assert.ok(!storedConfig._ownerCatalogV357.removed['prepared:d']);assert.ok(storedConfig._ownerCatalogV357.removed['prepared:other']);assert.deepEqual(storedConfig._ownerCatalogV357.records['prepared:d'].state.testers,d.testers);}
 else assert.equal(saves,0);
}
async function scanCase(){
 const accessed=[];const values=new Map([['jm_tc_before_test',JSON.stringify({state:d})],['account-secret','never read']]);
 const ctx={API:{},guestTester:null,cloudRole:'admin',isLotDRecoveryV389:core.isLotDRecoveryV389,snapshot:core.snapshot,clone:core.clone,canonical:x=>x,makeInitialState:config=>({config,testers:{}}),STORAGE_KEY:'state',PREPARED_JURY_STORAGE_KEY:'prepared',ARCHIVE_STORAGE_KEY:'archive',localStorage:{length:2,key:i=>[...values.keys()][i],getItem:k=>{accessed.push(k);return values.get(k)}},indexedDB:{open(){const req={result:{close(){},transaction(){const tx={objectStore(){return{openCursor(){const r={};setImmediate(()=>{r.result=null;r.onsuccess();tx.oncomplete();});return r}}}};return tx}}};setImmediate(()=>req.onsuccess());return req}}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  API.findLotDBackups='),source.indexOf('  API.restoreLotDBackup=')),ctx);
 const copies=await ctx.API.findLotDBackups();assert.ok(copies.some(r=>r.state.testers[1]?.answers?.p__22));assert.ok(!accessed.includes('account-secret'));
}
(async()=>{for(const mode of ['ok','existing','readFail','writeFail'])await restoreCase(mode);await scanCase();console.log('PASS: read-only backup search, credentials excluded, explicit D-only restore preserves E/F and notes, stale/reset copies blocked, failed writes do not alter local lots');})().catch(e=>{console.error(e);process.exitCode=1});
