const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/05-application-principale.js'),'utf8'),fields={};
for(const id of ['closureDate','closurePlace','closureChair','closureStatusCard','closureStatusTitle','closureStatusDetail','closureMissingList']){const classes=new Set();fields[id]={value:'',textContent:'',classes,classList:{toggle(k,v){v?classes.add(k):classes.delete(k)},remove:k=>classes.delete(k),add:k=>classes.add(k)},closest(){return this}};}
const state={config:{closure:{date:'2026-10-27',place:'Lycée Jean Moulin',chair:''}}};const ctx={state,document:{getElementById:id=>fields[id]},$:selector=>fields[selector.slice(1)],isJuryClosed:()=>false,console,clearTimeout(){},setClosureSaveIndicator(){},Number,requestAnimationFrame(){},window:{}};vm.createContext(ctx);
function load(start,end){vm.runInContext(source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start))),ctx);}
load('function closureMissingFieldsFrom(','function todayIsoLocal(');
load('function refreshClosureFormStatusV399(','async function saveClosure(');ctx.closureAutosaveTimer=null;
fields.closureDate.value='2026-10-27';fields.closurePlace.value='Lycée Jean Moulin';ctx.renderClosureStatus(state.config.closure);assert.equal(fields.closureChair.classes.has('closure-required-missing'),true);
for(const name of ['Cédric Charlot','Dupont','Élodie Martin']){fields.closureChair.value=name;ctx.scheduleClosureAutosave({type:'input'});assert.equal(fields.closureChair.classes.has('closure-required-missing'),false);assert.equal(fields.closureStatusTitle.textContent,'À enregistrer');assert.equal(state.config.closure.chair,'','typing must not silently save');}
fields.closureChair.value='  ';ctx.scheduleClosureAutosave({type:'change'});assert.equal(fields.closureChair.classes.has('closure-required-missing'),true);
fields.closureChair.value='Cédric Charlot';state.config.closure.chair=fields.closureChair.value;ctx.renderClosureStatus(state.config.closure);assert.equal(fields.closureStatusTitle.textContent,'Fiche prête ✓');assert.equal(fields.closureChair.classes.has('closure-required-missing'),false);
console.log('PASS chair validation follows live input, accepts names, catches blank values and distinguishes unsaved edits from saved closure');
async function checkSave(){
  for(const id of ['closureChairRole','closureCoSigner','closureCoSignerRole','closureNotes'])fields[id]={value:''};
  state.config.testerCount=0;state.testers={};ctx.signatureCanvasData=()=>'';ctx.toast=()=>{};let saved,returns=0;ctx.renderAdmin=()=>returns++;ctx.window.scrollTo=()=>{};
  ctx.saveState=()=>{saved=JSON.parse(JSON.stringify(state))};ctx.document.querySelector=()=>null;
  load('function ensureClosure(','function closureHasUsefulData(');load('function captureClosureForm(','let closureAutosaveTimer=');load('async function saveClosure(','function signatureCanvasData(');
  fields.closureChair.value='Marie Dupont';await ctx.saveClosure();assert.equal(saved.config.closure.chair,'Marie Dupont');assert.equal(returns,1);assert.equal(fields.closureStatusTitle.textContent,'Fiche prête ✓');assert.equal(fields.closureChair.classes.has('closure-required-missing'),false);
  console.log('PASS real save handler stores the entered chair name and validates the complete closure');
}
checkSave().catch(e=>{console.error(e);process.exitCode=1});
