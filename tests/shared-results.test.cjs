const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const core=require('../js/33-owner-sync.js');
const jury=(id,name,products=[{id:'p'}])=>({id,name,state:{config:{_preparedId:id,lotName:name,products},testers:{}}});
const d=jury('d','Lot 4 — D'),e=jury('e','Lot 5 — E'),ghost=jury('g','Jury préparé',[]);
const catalog={records:{'prepared:d':{state:d.state},'prepared:e':{state:e.state},'prepared:g':{state:ghost.state}},removed:{}};
assert.deepEqual(core.resultsChoicesV388(catalog,[ghost,e]).map(r=>r.id),['e','d']);
assert.equal(core.resultsChoicesV388({...catalog,removed:{'prepared:d':'deleted'}},[d]).some(r=>r.id==='d'),false);
const archived=jury('a','Archive');archived.state.config._archive={archivedAt:'now'};
assert.equal(core.resultsChoicesV388({records:{'prepared:a':{state:archived.state}},removed:{}},[archived]).length,0);
const draft=jury('draft','Local saved work');assert.ok(core.resultsChoicesV388(catalog,[draft]).some(r=>r.id==='draft'));
assert.deepEqual(catalog.records['prepared:g'].state.config.products,[],'filter must not delete source records');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/06-v20-partage-securise-supabase-auth.js'),'utf8');
const fn=source.slice(source.indexOf('async function fetchCloudState()'),source.indexOf('\nasync function createSecureCloudSession()'));
async function fetchCase(hub,tester=false){
 let loads=0,rebuilds=0;
 const config=hub?{_ownerCatalogV357:catalog}:{lotName:'Lot 4 — D',products:[{id:'p'}]};
 const query={select(){return this},eq(){return this},async maybeSingle(){return {data:{session_id:'hub',config}}},then(resolve){resolve({data:[]})}};
 const ctx={guestTester:tester?1:null,window:{JuryOwnerSyncV357:{checkReset:async()=>false,loadAccount:async()=>{loads++}}},compactLocalJuryCopiesV360:async()=>{},cloudRole:tester?'tester':'admin',cloudClient:{from:()=>query,rpc:async()=>({data:{public_config:config,tester_no:1}})},cloudCfg:{sessionId:'hub'},rememberCloudAccessCodesV339(){},rebuildLocalFromCloud(){rebuilds++},cloudTesterNo:1,compactOwnerEnvelopesV360:x=>x,verifyRecoveryValueV360:async()=>{}};
 vm.createContext(ctx);vm.runInContext(fn,ctx);await ctx.fetchCloudState();return {loads,rebuilds};
}
(async()=>{assert.deepEqual(await fetchCase(true),{loads:1,rebuilds:0});assert.deepEqual(await fetchCase(false),{loads:0,rebuilds:1});assert.deepEqual(await fetchCase(false,true),{loads:0,rebuilds:1});console.log('PASS: fresh D appears, empty rows hidden without deletion, tombstones and archives respected, local work retained, hub is never rebuilt as jury, testers unchanged');})().catch(e=>{console.error(e);process.exitCode=1});
