const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../js/37-reception-temperature.js');
const base={productName:'Haricots surgelés',temperatureCategory:'surgele',productTemp:'-18',interiorTemp:'',temperatureMethod:'sonde-contact',decision:'acceptation'};
const result=(patch={},air='-20',cfg={})=>core.evaluate({...base,...patch},air,cfg);
for(const t of [-40,-25,-20,-18])assert.equal(result({productTemp:String(t)}).level,'ok');
for(const t of [-17.9,-17,-16,-15]){const r=result({productTemp:String(t)});assert.equal(r.level,'warning');assert.equal(core.allowed(base,r),false);}
for(const t of [-14.9,-10,0,5,25]){const r=result({productTemp:String(t)});assert.equal(r.level,'danger');assert.equal(core.allowed({...base,temperatureDeviationVerified:true,temperatureResponsible:'Chef',temperatureJustification:'Transport contrôlé à la sonde'},r),false);assert.equal(core.allowed({...base,decision:'refus'},r),true);}
const exception={...base,productTemp:'-16',temperatureDeviationVerified:true,temperatureResponsible:'Chef',temperatureJustification:'Écart bref vérifié sur le relevé du transport, PMS applicable.'};assert.equal(core.allowed(exception,core.evaluate(exception,'-20')),true);
assert.equal(core.allowed({...exception,temperatureMethod:'infrarouge'},core.evaluate(exception,'-20')),false);
assert.equal(result({productTemp:'-18',interiorTemp:'-12'}).level,'danger','both measured temperatures matter');
assert.equal(result({temperatureLabelMax:'-20',productTemp:'-18'}).level,'danger','stricter label wins');
assert.equal(result({},'-19').level,'ok','-20 vehicle target is not a legal refusal threshold');
assert.equal(result({},'-10').level,'warning');
assert.equal(result({},'').level,'missing');assert.equal(result({productTemp:''}).level,'missing');assert.equal(result({productTemp:'garbage'}).level,'missing');assert.equal(result({temperatureMethod:''}).level,'ok','the removed method field does not block a valid measured temperature');
assert.equal(core.number('-17,5'),-17.5);assert.equal(core.number(''),null);assert.ok(Number.isNaN(core.number('NaN')));
for(const [category,max] of [['refrigere2',2],['refrigere3',3],['refrigere4',4],['refrigere7',7],['refrigere8',8],['congele12',-12],['glace',-18],['poissonCongele',-18],['viandeCongelee',-18]]){
  const line={...base,productName:'Produit',temperatureCategory:category,productTemp:String(max)};assert.equal(core.evaluate(line,category.startsWith('refrigere')?'2':'-20').level,'ok');assert.equal(core.evaluate({...line,productTemp:String(max+0.1)},'-20').level,'danger');
}
assert.equal(core.evaluate({...base,temperatureCategory:'ambiant'},'-20').level,'danger','a named frozen product cannot bypass classification');
assert.equal(core.evaluate({...base,productName:'Riz',temperatureCategory:'ambiant',productTemp:''},'').level,'neutral');
assert.equal(core.evaluate({...base,productName:'Riz',temperatureCategory:'refrigere4',productTemp:'4'},'2',{lotName:'Lot surgelé'}).level,'danger');
assert.equal(core.infer({lotName:'LÉGUMES SURGELÉS'},{productName:'Petits pois'}),'surgele');
assert.equal(core.infer({lotName:'Épicerie'},{productName:'Riz'}),'');
// Run the browser module and the real save handler: a red temperature cannot reach storage;
// a refused product remains saveable and retains its measured temperature and audit.
const ctx={window:{},console,Date};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/37-reception-temperature.js'),'utf8'),ctx);
const cfg={lotName:'Lot surgelé'},rec={date:'2026-10-27',supplier:'A',vehicleTemp:'-20',lines:[{...base,productTemp:'-12',dlc:'2027-01-01',observations:'Température trop élevée'}],driverSignature:'signed'};
assert.equal(ctx.window.ReceptionTemperatureV395.validate(rec,cfg).index,0);assert.equal(rec.lines[0].temperatureControl.level,'danger');
rec.lines[0].decision='refus';assert.equal(ctx.window.ReceptionTemperatureV395.validate(rec,cfg),null);assert.equal(JSON.parse(JSON.stringify(rec)).lines[0].productTemp,'-12');
let pages=0;const text=[];const doc=new Proxy({addPage(){pages++},splitTextToSize:s=>[s],text:s=>text.push(s)},{get:(o,k)=>o[k]||(()=>{})});ctx.window.ReceptionTemperatureV395.appendPdf(doc,{config:{receptions:[rec]}});assert.equal(pages,1);assert.ok(text.some(s=>s.includes('-12')));assert.ok(text.some(s=>s.includes('refus')));
console.log('PASS temperature boundaries, labels, category guard, missing measures, justified deviations, vehicle distinction, refusals and PDF audit');
async function testSave(){
  const source=fs.readFileSync(require('node:path').join(__dirname,'../js/05-application-principale.js'),'utf8');const options=source.slice(source.indexOf('function receptionTemperatureOptions('),source.indexOf('function receptionNowTime('));vm.runInContext(options,ctx);assert.ok(ctx.receptionTemperatureOptions('-18.5').includes('value="-18.5" selected'));assert.ok(ctx.receptionTemperatureOptions('-25').includes('value="-25" selected'));const start=source.indexOf('async function saveReceptionForm('),end=source.indexOf('function renderReceptionSavedList(',start);let saved=0;
  Object.assign(ctx,{state:{config:cfg},receptionEditingIndex:-1,receptionDraft:rec,receptionIsReadOnly:()=>false,receptionConfig:()=>cfg,captureReceptionForm:()=>rec,receptionConfiguredSupplierNames:()=>['A'],receptionSupplierAlreadyReceived:()=>false,receptionSupplierCompleteV345:()=>false,receptionPendingLinesV345:(c,r)=>r.lines,alert:()=>{},document:{querySelector:()=>null},receptionJuryKey:()=> 'D',receptionList:()=>cfg.receptions??=[],deepClone:o=>JSON.parse(JSON.stringify(o)),saveState:()=>saved++,renderReceptionConfigStatus(){},blankReceptionRecordAfterSave:()=>({}),renderHome(){},toast(){}});
  vm.runInContext(source.slice(start,end),ctx);rec.lines[0].decision='acceptation';await ctx.saveReceptionForm();assert.equal(saved,0);assert.equal(cfg.receptions,undefined);
  rec.lines[0].decision='refus';await ctx.saveReceptionForm();assert.equal(saved,1);assert.equal(cfg.receptions[0].lines[0].productTemp,'-12');assert.equal(cfg.receptions[0].lines[0].temperatureControl.level,'danger');
  const historical=JSON.parse(JSON.stringify(cfg.receptions));vm.runInContext(source.slice(source.indexOf('function normalizeReceptionRecord('),source.indexOf('function renderReceptionConfigStatus(')),ctx);
  ctx.newReceptionRecord=()=>({lines:[{productId:'p',productName:'Haricots surgelés'}]});ctx.receptionProductKeyV345=p=>p.productId||p.productName;
  historical[0].lines[0].productId='p';const reloaded=ctx.normalizeReceptionRecord(historical[0],cfg);assert.equal(reloaded.lines[0].temperatureCategory,'surgele');assert.equal(reloaded.lines[0].temperatureControl.level,'danger');
  console.log('PASS real save handler blocks hot acceptance, saves refusal, and preserves temperature controls on reload');
}
testSave().catch(e=>{console.error(e);process.exitCode=1;});

