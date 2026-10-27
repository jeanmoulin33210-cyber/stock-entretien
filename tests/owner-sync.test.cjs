const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
// Two independent browser-like runtimes execute the production synchronizer,
// including storage, DOM guards, authentication descriptor and async queries.
const chromium={launch:async()=>({newContext:async()=>({newPage:async()=>new SimulatedPage()}),close:async()=>{for(const t of timers)clearTimeout(t)}})};
const timers=[];
class SimulatedPage{
 constructor(){this.mem=new Map();this.listeners={};this.elements=new Map();this.active='homeView';this.url='https://stable.test/';}
 async exposeFunction(name,fn){this[name]=fn;}
 async route(url,handler){this.handler=handler;}
 async goto(){let body;await this.handler({fulfill:async x=>{body=x.body}});this.html=body;this.reset();}
 reset(){const page=this;const element=id=>{if(!page.elements.has(id))page.elements.set(id,{id,textContent:'',style:{},setAttribute(){},classList:{remove(){if(page.active===id)page.active=null},add(){page.active=id}}});return page.elements.get(id)};
 const document={hidden:false,activeElement:{matches:()=>false},getElementById:element,createElement:()=>({id:'',textContent:'',style:{},setAttribute(){}}),querySelector:q=>q==='.view.active'?{id:page.active}:q==='header.topbar'?{after:el=>page.elements.set(el.id,el)}:null,addEventListener:(k,f)=>{(page.listeners[k]??=[]).push(f)}};
 const sandbox={backend:this.backend,console,document,localStorage:{getItem:k=>page.mem.get(k)||null,setItem:(k,v)=>page.mem.set(k,String(v)),removeItem:k=>page.mem.delete(k)},setTimeout:(f,n)=>{const t=setTimeout(f,n);timers.push(t);return t},setInterval:()=>0,clearTimeout,Date,Event:class{constructor(type){this.type=type}}};
 sandbox.window=sandbox;sandbox.addEventListener=(k,f)=>{(page.listeners[k]??=[]).push(f)};sandbox.dispatchEvent=e=>{for(const f of page.listeners[e.type]||[])f(e);return true};
 this.ctx=vm.createContext(sandbox);vm.runInContext(this.html.match(/<script>([\s\S]*)<\/script>/)[1],this.ctx);}
 async addScriptTag({path}){vm.runInContext(fs.readFileSync(path,'utf8'),this.ctx);}
 async evaluate(fn){const v=await vm.runInContext('('+fn.toString()+')()',this.ctx);return v===undefined?undefined:copy(v);}
 async reload(){this.elements.clear();this.listeners={};this.reset();}
 async screenshot(){}
}
const api=require('../js/33-owner-sync.js');
const copy=x=>JSON.parse(JSON.stringify(x));
function jury(id,name){return {config:{_preparedId:id,_juryInstanceId:'instance-'+id,lotName:name,products:[{id:'p-'+id,samples:[{supplier:'A'}]}],supplierNames:['A'],testerCount:1,productSheets:{},receptions:[]},testers:{1:{answers:{}}}};}
const a=jury('55','Lot 55 — Frais'),b=jury('66','Lot 66 — Légumes');
a.config.receptions=[{id:'signed-1',validatedAt:'2026-10-25',supplier:'A',driverSignature:'signed',lines:[{productId:'p-55',received:true,decision:'refus',observations:'Emballage percé'}]}];
a.config.productSheets={'p-55':{description:'Fiche du téléphone',dlc:'2026-11-01'}};
const moulik=jury('old','Moulik');
let server={config:{...copy(b.config),_ownerWorkspaceV351:{prepared:[{id:'55',state:a},{id:'66',state:b},{id:'old',state:moulik}],archives:[]}},updated_at:'2026-10-25T00:00:00.000Z'};
let writes=0,offline=false;
async function backend(q){
 if(offline)return {error:{message:'offline'}};
 assert.equal(q.sid,'F524','owner hub changed with active jury');
 if(q.type==='read')return {data:copy(server)};
 await new Promise(r=>setTimeout(r,10));
 if(q.stamp!==server.updated_at)return {data:null,error:null};
 server={config:copy(q.payload.config),updated_at:q.payload.updated_at};writes++;return {data:{session_id:'F524'},error:null};
}
function fixture(initial,prepared){return `
<header class="topbar"></header><main id="homeView" class="view active"></main><main id="productSheetsView" class="view"></main><script>
let state=${JSON.stringify(initial)},draftConfig=null,currentProduct='',currentSample='',adminProduct='';
const STORAGE_KEY='state',PREPARED_JURY_STORAGE_KEY='prepared';
if(!localStorage.getItem(STORAGE_KEY))localStorage.setItem(STORAGE_KEY,JSON.stringify(state));else state=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!localStorage.getItem('prepared'))localStorage.setItem('prepared',${JSON.stringify(JSON.stringify(prepared))});
let guestTester=null,cloudRole='admin',cloudReady=true,cloudCfg={sessionId:'F524',url:'https://mock',key:'public'};
function loadPreparedJurys(){return JSON.parse(localStorage.getItem('prepared')||'[]')};
function savePreparedJurys(rows){localStorage.setItem('prepared',JSON.stringify(rows))};
function loadSampleLotHistory(){return []};function saveSampleLotHistory(){};
function loadArchives(){return JSON.parse(localStorage.getItem('archives')||'[]')};
function saveArchives(rows){localStorage.setItem('archives',JSON.stringify(rows))};
function blankActiveStateV238(){return {config:{products:[],_emptyAfterReset:true},testers:{}}};
function originalRenderHome(){};function saveCloudCfg(){};function cloudAuthStorageKey(){return 'original-auth'};
function builder(type,payload){const filters={};return {eq(k,v){filters[k]=v;return this},select(){return this},maybeSingle(){return window.backend({type,payload,sid:filters.session_id,stamp:filters.updated_at})}}};
const cloudClient={__jmStorageKeyV357:'original-auth',from(){return {select(){return builder('read')},update(p){return builder('write',p)}}},auth:{getSession:async()=>({data:{session:{user:{id:'owner'}}}})}};
window.supabase={createClient:()=>cloudClient};
window.savedEdit=(fnText)=>{const fn=typeof fnText==='function'?fnText:eval('('+fnText+')');fn(state);localStorage.setItem('state',JSON.stringify(state));const list=loadPreparedJurys();const i=list.findIndex(r=>r.id===state.config._preparedId);const rec={id:state.config._preparedId,state:JSON.parse(JSON.stringify(state))};if(i<0)list.push(rec);else list[i]=rec;savePreparedJurys(list)};
window.openLot=(id)=>{state=JSON.parse(JSON.stringify(loadPreparedJurys().find(r=>r.id===id).state));localStorage.setItem('state',JSON.stringify(state))};
window.inspect=()=>({state:JSON.parse(JSON.stringify(state)),prepared:loadPreparedJurys(),status:document.getElementById('ownerSyncStateV357')?.textContent});
</script>`;}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const ca=await browser.newContext(),cb=await browser.newContext();
 const pa=await ca.newPage(),pb=await cb.newPage();
 for(const [p,initial,list]of [[pa,a,[{id:'55',state:a},{id:'66',state:b}]],[pb,b,[{id:'66',state:b}]]]){
   await p.exposeFunction('backend',backend);await p.route('https://stable.test/**',route=>route.fulfill({contentType:'text/html',body:fixture(initial,list)}));
   await p.goto('https://stable.test/');await p.addScriptTag({path:require('node:path').resolve(__dirname,'../js/33-owner-sync.js')});
 }
 const run=p=>p.evaluate(()=>JuryOwnerSyncV357.run());
 await run(pa);await run(pb);
 let x=await pb.evaluate(()=>inspect());
 assert.deepEqual(x.prepared.map(r=>r.id).sort(),['55','66']);assert.equal(x.prepared.find(r=>r.id==='55').state.config.receptions[0].driverSignature,'signed');
 assert(!JSON.stringify(server.config._ownerCatalogV357).includes('Moulik'));console.log('PASS initial iPad import: two lots, signed receipt, product sheet; obsolete lot excluded');
 await pb.evaluate(()=>openLot('55'));await pb.evaluate(()=>savedEdit(st=>{st.config.productSheets['p-55'].description='Modifié sur iPad'}));
 await run(pb);await run(pa);x=await pa.evaluate(()=>inspect());assert.equal(x.state.config.productSheets['p-55'].description,'Modifié sur iPad');console.log('PASS iPad -> S24 after saved edit');
 await pa.evaluate(()=>savedEdit(st=>{st.config.productSheets['p-55'].dlc='2026-11-02'}));
 await pb.evaluate(()=>savedEdit(st=>{st.config.productSheets['p-55'].brand='Marque iPad'}));
 await Promise.all([run(pa),run(pb)]);await new Promise(r=>setTimeout(r,800));await run(pa);await run(pb);await run(pa);
 x=await pa.evaluate(()=>inspect());assert.equal(x.state.config.productSheets['p-55'].brand,'Marque iPad');assert.equal(x.state.config.productSheets['p-55'].dlc,'2026-11-02');console.log('PASS concurrent saves: CAS retry and field merge retain both edits');
 const before=writes;await run(pa);await run(pb);await run(pa);assert.equal(writes,before);console.log('PASS idle refreshes produce no writes or synchronization loop');
 const baseline={config:{productSheets:{p:{note:'initial'}}},testers:{}};
 assert.throws(()=>api.merge(baseline,{config:{productSheets:{p:{note:'edit A'}}},testers:{}},{config:{productSheets:{p:{note:'edit B'}}},testers:{}}),/même information/);
 console.log('PASS conflicting edits to the same field are reported, never silently overwritten');
 offline=true;await pb.evaluate(()=>savedEdit(st=>{st.config.productSheets['p-55'].note='Enregistré hors connexion'}));await run(pb);x=await pb.evaluate(()=>inspect());assert.equal(x.state.config.productSheets['p-55'].note,'Enregistré hors connexion');assert(x.status.includes('en attente'));
 offline=false;await pb.evaluate(()=>window.dispatchEvent(new Event('online')));await new Promise(r=>setTimeout(r,100));await run(pa);x=await pa.evaluate(()=>inspect());assert.equal(x.state.config.productSheets['p-55'].note,'Enregistré hors connexion');console.log('PASS offline saved edit retained and delivered after reconnection');
 await pb.evaluate(()=>{document.getElementById('homeView').classList.remove('active');document.getElementById('productSheetsView').classList.add('active')});
 await pa.evaluate(()=>savedEdit(st=>{st.config.productSheets['p-55'].origin='Nouvelle origine'}));await run(pa);await run(pb);x=await pb.evaluate(()=>inspect());assert.equal(x.state.config.productSheets['p-55'].origin,undefined);
 await pb.evaluate(()=>{document.getElementById('productSheetsView').classList.remove('active');document.getElementById('homeView').classList.add('active')});await run(pb);x=await pb.evaluate(()=>inspect());assert.equal(x.state.config.productSheets['p-55'].origin,'Nouvelle origine');console.log('PASS incoming data deferred during form editing, applied at home');
 await pb.evaluate(()=>openLot('66'));await run(pb);x=await pb.evaluate(()=>inspect());assert.equal(x.state.config.lotName,'Lot 66 — Légumes');assert.deepEqual(x.state.config.receptions,[]);assert.deepEqual(x.state.testers[1].answers,{});console.log('PASS lot switch preserves separate receipts, product sheets and tester responses');
 await pa.reload();await pa.addScriptTag({path:require('node:path').resolve(__dirname,'../js/33-owner-sync.js')});await run(pa);x=await pa.evaluate(()=>inspect());assert(x.status.includes('vérifiées'));console.log('PASS owner hub reconnects after page reload');
 console.log('ALL TWO-DEVICE SIMULATION CHECKS PASSED');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
