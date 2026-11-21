'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/05-application-principale.js'),'utf8');
const begin=source.indexOf('/* V647 — Un seul appui');
const end=source.indexOf('function signatureCanvasData(id){',begin);
assert.ok(begin>=0&&end>begin,'Closure save source exists');

function setup(mode='online'){
  const sid='session-closure-one-click',key='local-jury-state';
  const closure={date:'2026-11-21',place:'Lycée Jean Moulin',chair:'Responsable',
    chairRole:'Chef de cuisine',coSigner:'',coSignerRole:'',notes:'Rapport prêt',
    chairSignature:'',coSignature:'',members:[{testerNo:1,name:'Alice',role:'Dégustation',present:true}],
    updatedAt:'2026-11-21T08:40:00Z'};
  const state={config:{_shareSessionId:sid,closure:null}};
  let local=null,remote=null,saveCount=0,renderCount=0,syncCount=0;
  let resolveUpload;
  const uploadGate=new Promise(resolve=>resolveUpload=resolve);
  const button={disabled:false};
  const messages=[];
  const ctx={
    state,cloudReady:mode!=='local',cloudRole:'admin',cloudCfg:{sessionId:sid},
    cloudClient:{from:()=>({select(){return this;},eq(){return this;},
      maybeSingle:async()=>({data:{config:{closure:remote}},error:null})})},
    cloudBusy:false,
    syncDirtyToCloud:async()=>{
      syncCount++;
      if(mode==='online'){
        await uploadGate;
        remote=JSON.parse(JSON.stringify(closure));
      }
    },
    captureClosureForm:()=>{state.config.closure=closure;return closure;},
    saveState:()=>{saveCount++;local=JSON.stringify(state);},
    localStorage:{getItem:()=>local},
    STORAGE_KEY:key,PREPARED_JURY_STORAGE_KEY:'prepared',ARCHIVE_STORAGE_KEY:'archive',
    $:sel=>sel==='#saveClosureBtn'?button:null,
    setClosureSaveIndicator:msg=>messages.push(msg),
    renderClosureStatus:()=>true,renderAdmin:()=>renderCount++,
    syncSimpleResultsActions(){},
    toast:msg=>messages.push(msg),
    window:{scrollTo(){}},console,JSON,Date,
    setTimeout:fn=>{queueMicrotask(fn);return 1;}
  };
  vm.createContext(ctx);
  vm.runInContext(source.slice(begin,end),ctx);
  return {ctx,button,messages,release:resolveUpload,metrics:()=>({saveCount,renderCount,syncCount,local,remote})};
}

async function test(){
  const online=setup();
  const first=online.ctx.saveClosure();
  const second=online.ctx.saveClosure();
  assert.equal(online.button.disabled,true,'Button locked while saving');
  assert.equal(online.metrics().saveCount,1,'Two rapid taps must not cause two saves');
  online.release();
  await Promise.all([first,second]);
  assert.equal(online.metrics().renderCount,1,'Navigate after one confirmed receipt');
  assert.equal(online.button.disabled,false,'Button unlocked');
  assert.ok(online.messages.includes('✓ Enregistré sur le serveur'));
  assert.equal(online.metrics().remote.updatedAt,'2026-11-21T08:40:00Z');

  const local=setup('local');
  await local.ctx.saveClosure();
  assert.equal(local.metrics().saveCount,1);
  assert.equal(local.metrics().renderCount,1);
  assert.ok(local.messages.includes('✓ Enregistré sur ce téléphone'));

  const pending=setup('pending');
  await pending.ctx.saveClosure();
  assert.equal(pending.metrics().saveCount,1,'Local copy preserved despite missing server receipt');
  assert.equal(pending.metrics().renderCount,0,'Do not navigate away on unconfirmed cloud save');
  assert.ok(pending.messages.includes('✓ Enregistré ici · serveur en attente'));
  assert.equal(pending.button.disabled,false);
  console.log('PASS closure single click, local save, confirmed server receipt and pending-state feedback');
}
test().catch(e=>{console.error(e);process.exitCode=1;});
